// bake.mjs: UV atlas (chart per surface patch, shelf packed) and texture baking.
// The macro shape comes from the field; the micro detail (grain, weave, perforations, scratches, panel lines, paint
// variation) is evaluated per texel by the model's materialAt(), so a 60k-triangle model can carry 2K of real detail.
//
// materialAt(ctx, out): ctx = { p:[x,y,z], n:[x,y,z], ao, curv }; write into out:
//   out.c = [r,g,b] sRGB 0..1, out.r = roughness, out.m = metalness, out.h = height in model units (for the normal map)

/** Box-projection charts: group triangles by dominant axis, split into connected patches, pack them. */
export function buildAtlas(mesh, { size = 1024, gutter = 4 } = {}) {
  const { positions: P, normals: N, indices: I } = mesh, nT = I.length / 3;
  const label = new Uint8Array(nT);
  for (let t = 0; t < nT; t++) {
    let nx = 0, ny = 0, nz = 0;
    for (let k = 0; k < 3; k++) { const v = I[t * 3 + k]; nx += N[v * 3]; ny += N[v * 3 + 1]; nz += N[v * 3 + 2]; }
    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    label[t] = ax >= ay && ax >= az ? (nx >= 0 ? 0 : 1) : ay >= az ? (ny >= 0 ? 2 : 3) : (nz >= 0 ? 4 : 5);
  }
  // triangle adjacency through shared edges
  const edge = new Map(), adj = Array.from({ length: nT }, () => []);
  for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) {
    const a = I[t * 3 + k], b = I[t * 3 + (k + 1) % 3], key = a < b ? a * 4294967296 + b : b * 4294967296 + a;
    const o = edge.get(key); if (o === undefined) edge.set(key, t); else { adj[t].push(o); adj[o].push(t); }
  }
  // majority smoothing removes speckle charts
  for (let pass = 0; pass < 2; pass++) {
    const next = label.slice();
    for (let t = 0; t < nT; t++) {
      const c = new Uint8Array(6); for (const o of adj[t]) c[label[o]]++;
      let bi = label[t]; for (let l = 0; l < 6; l++) if (c[l] > c[bi]) bi = l;
      if (bi !== label[t] && c[bi] >= 2) next[t] = bi;
    }
    label.set(next);
  }
  // connected components of equal label
  const comp = new Int32Array(nT).fill(-1); let nC = 0;
  for (let s = 0; s < nT; s++) {
    if (comp[s] >= 0) continue;
    const st = [s]; comp[s] = nC;
    while (st.length) { const t = st.pop(); for (const o of adj[t]) if (comp[o] < 0 && label[o] === label[t]) { comp[o] = nC; st.push(o); } }
    nC++;
  }
  const proj = (l, x, y, z) => {
    switch (l >> 1) { case 0: return [(l & 1 ? 1 : -1) * z, y]; case 1: return [x, (l & 1 ? -1 : 1) * z]; default: return [(l & 1 ? -1 : 1) * x, y]; }
  };
  // per chart bounding box in projected units
  const charts = Array.from({ length: nC }, () => ({ tris: [], u0: Infinity, v0: Infinity, u1: -Infinity, v1: -Infinity, label: 0 }));
  for (let t = 0; t < nT; t++) {
    const c = charts[comp[t]]; c.tris.push(t); c.label = label[t];
    for (let k = 0; k < 3; k++) { const v = I[t * 3 + k], [u, w] = proj(label[t], P[v * 3], P[v * 3 + 1], P[v * 3 + 2]); c.u0 = Math.min(c.u0, u); c.u1 = Math.max(c.u1, u); c.v0 = Math.min(c.v0, w); c.v1 = Math.max(c.v1, w); }
  }
  const order = charts.map((_, i) => i).sort((a, b) => (charts[b].v1 - charts[b].v0) - (charts[a].v1 - charts[a].v0));
  const pack = (s) => {
    let x = 0, y = 0, rowH = 0; const place = new Array(nC);
    for (const ci of order) {
      const c = charts[ci], w = Math.ceil((c.u1 - c.u0) * s) + 2 * gutter, h = Math.ceil((c.v1 - c.v0) * s) + 2 * gutter;
      if (w > size) return null;
      if (x + w > size) { x = 0; y += rowH; rowH = 0; }
      if (y + h > size) return null;
      place[ci] = [x, y]; x += w; rowH = Math.max(rowH, h);
    }
    return place;
  };
  let lo = 1, hi = 1e5, best = null, bestS = 0;
  for (let i = 0; i < 28; i++) { const s = Math.sqrt(lo * hi); const r = pack(s); if (r) { best = r; bestS = s; lo = s; } else hi = s; }
  if (!best) throw new Error('atlas packing failed');
  // duplicate vertices per chart and write UVs
  const remap = new Map(), pos = [], nor = [], uv = [], ao = [], curv = [], idx = [];
  for (let ci = 0; ci < nC; ci++) {
    const c = charts[ci], [ox, oy] = best[ci];
    for (const t of c.tris) for (let k = 0; k < 3; k++) {
      const v = I[t * 3 + k], key = ci * 4294967296 + v; let nv = remap.get(key);
      if (nv === undefined) {
        nv = pos.length / 3; remap.set(key, nv);
        const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2], [u, w] = proj(c.label, x, y, z);
        pos.push(x, y, z); nor.push(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]); ao.push(mesh.ao ? mesh.ao[v] : 1); curv.push(mesh.curv ? mesh.curv[v] : 0);
        uv.push((ox + gutter + (u - c.u0) * bestS) / size, (oy + gutter + (c.v1 - w) * bestS) / size);   // v flipped so "up" stays up in the image
      }
      idx.push(nv);
    }
  }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), indices: new Uint32Array(idx), ao: new Float32Array(ao), curv: new Float32Array(curv), size, texelWorld: 1 / bestS, charts: nC };
}

/** Rasterise every triangle into texture space and evaluate the material per texel. Returns RGBA8 base colour, ORM, normal map. */
export function bakeTextures(atlas, materialAt, { bump = 1, dilate = 6 } = {}) {
  const S = atlas.size, { positions: P, normals: N, uvs: UV, indices: I, ao: AO, curv: CU } = atlas;
  const base = new Uint8ClampedArray(S * S * 4), orm = new Uint8ClampedArray(S * S * 4), height = new Float32Array(S * S), cover = new Uint8Array(S * S);
  const ctx = { p: [0, 0, 0], n: [0, 0, 1], ao: 1, curv: 0 }, out = { c: [0.5, 0.5, 0.5], r: 0.5, m: 0, h: 0 };
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    const ax = UV[a * 2] * S, ay = UV[a * 2 + 1] * S, bx = UV[b * 2] * S, by = UV[b * 2 + 1] * S, cx = UV[c * 2] * S, cy = UV[c * 2 + 1] * S;
    const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (Math.abs(den) < 1e-9) continue;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx) - 1)), x1 = Math.min(S - 1, Math.ceil(Math.max(ax, bx, cx) + 1));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy) - 1)), y1 = Math.min(S - 1, Math.ceil(Math.max(ay, by, cy) + 1));
    const eps = 0.6 / Math.sqrt(Math.abs(den));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den, w1 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den, w2 = 1 - w0 - w1;
      if (w0 < -eps || w1 < -eps || w2 < -eps) continue;
      const q0 = Math.max(0, w0), q1 = Math.max(0, w1), q2 = Math.max(0, w2), qs = q0 + q1 + q2 || 1, u = q0 / qs, v = q1 / qs, w = q2 / qs;
      ctx.p[0] = P[a * 3] * u + P[b * 3] * v + P[c * 3] * w; ctx.p[1] = P[a * 3 + 1] * u + P[b * 3 + 1] * v + P[c * 3 + 1] * w; ctx.p[2] = P[a * 3 + 2] * u + P[b * 3 + 2] * v + P[c * 3 + 2] * w;
      let nx = N[a * 3] * u + N[b * 3] * v + N[c * 3] * w, ny = N[a * 3 + 1] * u + N[b * 3 + 1] * v + N[c * 3 + 1] * w, nz = N[a * 3 + 2] * u + N[b * 3 + 2] * v + N[c * 3 + 2] * w; const nl = Math.hypot(nx, ny, nz) || 1;
      ctx.n[0] = nx / nl; ctx.n[1] = ny / nl; ctx.n[2] = nz / nl; ctx.ao = AO[a] * u + AO[b] * v + AO[c] * w; ctx.curv = CU[a] * u + CU[b] * v + CU[c] * w;
      out.c[0] = out.c[1] = out.c[2] = 0.5; out.r = 0.5; out.m = 0; out.h = 0;
      materialAt(ctx, out);
      const o = y * S + x, k4 = o * 4;
      base[k4] = out.c[0] * 255; base[k4 + 1] = out.c[1] * 255; base[k4 + 2] = out.c[2] * 255; base[k4 + 3] = 255;
      orm[k4] = ctx.ao * 255; orm[k4 + 1] = out.r * 255; orm[k4 + 2] = out.m * 255; orm[k4 + 3] = 255;
      height[o] = out.h; cover[o] = 1;
    }
  }
  // dilate colours into the gutters so mip-mapping and bilinear filtering never bleed black
  for (let pass = 0; pass < dilate; pass++) {
    const snap = cover.slice();
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const o = y * S + x; if (snap[o]) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= S || yy >= S) continue;
        const s = yy * S + xx; if (!snap[s]) continue;
        base.copyWithin(o * 4, s * 4, s * 4 + 4); orm.copyWithin(o * 4, s * 4, s * 4 + 4); height[o] = height[s]; cover[o] = 1; break;
      }
    }
  }
  // normal map: glTF convention (+X = increasing u, +Y = up in the image = decreasing row), slope from real heights
  const normal = new Uint8ClampedArray(S * S * 4), tw = atlas.texelWorld;
  const H = (x, y) => height[Math.max(0, Math.min(S - 1, y)) * S + Math.max(0, Math.min(S - 1, x))];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = ((H(x + 1, y) - H(x - 1, y)) / (2 * tw)) * bump, dy = ((H(x, y - 1) - H(x, y + 1)) / (2 * tw)) * bump;
    const nx = -dx, ny = -dy, nz = 1, l = Math.hypot(nx, ny, nz), k = (y * S + x) * 4;
    normal[k] = (nx / l * 0.5 + 0.5) * 255; normal[k + 1] = (ny / l * 0.5 + 0.5) * 255; normal[k + 2] = (nz / l * 0.5 + 0.5) * 255; normal[k + 3] = 255;
  }
  return { size: S, base, orm, normal, height };
}

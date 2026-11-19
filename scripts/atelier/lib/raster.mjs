// raster.mjs: software preview renderer. Needs no GPU, no browser, no network, so models can be looked at anywhere.
// Shades with PBR-lite (baked ORM maps, normal map, studio softbox environment, fresnel, contact + key shadow on a sweep floor).
// It is a review tool, not the production look: the production look is the three.js render in incridible-skill-3d (render.js).
import { meshBounds } from './meshops.mjs';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a || 1e-9), 0, 1); return t * t * (3 - 2 * t); };
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const s2l = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const l2s = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const aces = (x) => clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1);

const BOXES = [ // studio softboxes: direction, angular radius, intensity, tint
  { d: norm3([0.55, 0.75, 0.5]), s: 0.42, i: 5.2, c: [1, 0.98, 0.95] },
  { d: norm3([-0.85, 0.3, 0.3]), s: 0.55, i: 1.7, c: [0.92, 0.96, 1] },
  { d: norm3([-0.2, 0.5, -0.85]), s: 0.26, i: 4.6, c: [1, 1, 1] },
  { d: [0, 1, 0], s: 0.7, i: 1.2, c: [1, 1, 1] },
];
const KEY = BOXES[0].d;

function env(dx, dy, dz, rough, out) {
  const t = dy;
  let r, g, b;
  if (t >= 0) { const k = sstep(0, 0.9, t); r = 0.55 + 0.4 * k; g = 0.56 + 0.4 * k; b = 0.6 + 0.4 * k; }
  else { const k = sstep(0, 1, -t); r = 0.34 - 0.16 * k; g = 0.33 - 0.16 * k; b = 0.32 - 0.15 * k; }
  const soft = 0.06 + rough * 0.9;
  for (const L of BOXES) {
    const ang = Math.acos(clamp(dx * L.d[0] + dy * L.d[1] + dz * L.d[2], -1, 1));
    const e = L.i * Math.pow(L.s / (L.s + rough * 0.9), 2) * (1 - sstep(L.s - soft, L.s + soft, ang));
    r += e * L.c[0]; g += e * L.c[1]; b += e * L.c[2];
  }
  out[0] = r; out[1] = g; out[2] = b;
}

function sampleTex(tex, u, v, ch, out) { // bilinear, clamp
  const S = tex.size, x = clamp(u * S - 0.5, 0, S - 1.001), y = clamp(v * S - 0.5, 0, S - 1.001), x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0;
  const a = (y0 * S + x0) * 4, b = a + 4, c = a + S * 4, d = c + 4;
  for (let k = 0; k < ch; k++) out[k] = (tex.data[a + k] * (1 - fx) + tex.data[b + k] * fx) * (1 - fy) + (tex.data[c + k] * (1 - fx) + tex.data[d + k] * fx) * fy;
}

function blur(buf, W, H, radius, passes) {
  const tmp = new Float32Array(buf.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < H; y++) { let s = 0, n = 0; const o = y * W;
      for (let x = -radius; x <= radius; x++) if (x >= 0 && x < W) { s += buf[o + x]; n++; }
      for (let x = 0; x < W; x++) { tmp[o + x] = s / n; const a = x + radius + 1, b = x - radius; if (a < W) { s += buf[o + a]; n++; } if (b >= 0) { s -= buf[o + b]; n--; } } }
    for (let x = 0; x < W; x++) { let s = 0, n = 0;
      for (let y = -radius; y <= radius; y++) if (y >= 0 && y < H) { s += tmp[y * W + x]; n++; }
      for (let y = 0; y < H; y++) { buf[y * W + x] = s / n; const a = y + radius + 1, b = y - radius; if (a < H) { s += tmp[a * W + x]; n++; } if (b >= 0) { s -= tmp[b * W + x]; n--; } } }
  }
}

function fillTri2D(buf, G, ax, ay, bx, by, cx, cy, wa, wb, wc) { // rasterise a triangle into a G x G grid with max-compositing
  const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (Math.abs(den) < 1e-12) return;
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(G - 1, Math.ceil(Math.max(ax, bx, cx)));
  const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(G - 1, Math.ceil(Math.max(ay, by, cy)));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5, u = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den, v = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den, w = 1 - u - v;
    if (u < -0.01 || v < -0.01 || w < -0.01) continue;
    const val = wa * u + wb * v + wc * w; if (val > buf[y * G + x]) buf[y * G + x] = val;
  }
}

/**
 * model: { positions, normals, uvs?, indices, tex?: { size, base, orm, normal } (RGBA8), clearcoat? }
 * opts: { width, height, azimuth, elevation, fov, clay, floor, ssaa, normalMap, bg }
 */
export function render(model, opts = {}) {
  const W = opts.width || 480, H = opts.height || 480, ss = opts.ssaa || 2, w = W * ss, h = H * ss;
  const az = ((opts.azimuth ?? 30) * Math.PI) / 180, el = ((opts.elevation ?? 12) * Math.PI) / 180, fov = ((opts.fov ?? 28) * Math.PI) / 180;
  const { positions: P, normals: N, uvs: UV, indices: I } = model, bb = meshBounds(model);
  const cx = (bb.lo[0] + bb.hi[0]) / 2, cz = (bb.lo[2] + bb.hi[2]) / 2, cyc = (bb.lo[1] + bb.hi[1]) / 2, floorY = bb.lo[1];
  const radius = Math.hypot(bb.hi[0] - bb.lo[0], bb.hi[1] - bb.lo[1], bb.hi[2] - bb.lo[2]) / 2;
  const dist = (radius / Math.sin(fov / 2)) * 1.04;
  const eye = [cx + Math.sin(az) * Math.cos(el) * dist, cyc + Math.sin(el) * dist, cz + Math.cos(az) * Math.cos(el) * dist];
  const f = norm3([cx - eye[0], cyc - eye[1], cz - eye[2]]), r = norm3([-f[2], 0, f[0]]), u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const focal = h / 2 / Math.tan(fov / 2), nV = P.length / 3;

  // ---- project vertices ----
  const SX = new Float32Array(nV), SY = new Float32Array(nV), Z = new Float32Array(nV);
  for (let v = 0; v < nV; v++) {
    const dx = P[v * 3] - eye[0], dy = P[v * 3 + 1] - eye[1], dz = P[v * 3 + 2] - eye[2], z = dx * f[0] + dy * f[1] + dz * f[2];
    Z[v] = z; SX[v] = w / 2 + (focal * (dx * r[0] + dy * r[1] + dz * r[2])) / z; SY[v] = h / 2 - (focal * (dx * u[0] + dy * u[1] + dz * u[2])) / z;
  }
  // ---- visibility pass ----
  const depth = new Float32Array(w * h).fill(Infinity), tri = new Int32Array(w * h).fill(-1), B1 = new Float32Array(w * h), B2 = new Float32Array(w * h);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2]; if (Z[a] <= 0 || Z[b] <= 0 || Z[c] <= 0) continue;
    const ax = SX[a], ay = SY[a], bx = SX[b], by = SY[b], cx2 = SX[c], cy2 = SY[c], den = (by - cy2) * (ax - cx2) + (cx2 - bx) * (ay - cy2); if (Math.abs(den) < 1e-9) continue;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx2))), x1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx, cx2))), y0 = Math.max(0, Math.floor(Math.min(ay, by, cy2))), y1 = Math.min(h - 1, Math.ceil(Math.max(ay, by, cy2)));
    const ia = 1 / Z[a], ib = 1 / Z[b], ic = 1 / Z[c];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5, l0 = ((by - cy2) * (px - cx2) + (cx2 - bx) * (py - cy2)) / den, l1 = ((cy2 - ay) * (px - cx2) + (ax - cx2) * (py - cy2)) / den, l2 = 1 - l0 - l1;
      if (l0 < 0 || l1 < 0 || l2 < 0) continue;
      const iz = l0 * ia + l1 * ib + l2 * ic, z = 1 / iz, o = y * w + x; if (z >= depth[o]) continue;
      depth[o] = z; tri[o] = t / 3; B1[o] = (l1 * ib) * z; B2[o] = (l2 * ic) * z;
    }
  }
  // ---- floor shadows (key shadow + contact) on a grid centred under the object ----
  const floor = opts.floor !== false, G = 384, ext = radius * 2.4, key = new Float32Array(G * G), contact = new Float32Array(G * G);
  if (floor) {
    const toG = (x, z) => [((x - (cx - ext)) / (2 * ext)) * G, ((z - (cz - ext)) / (2 * ext)) * G];
    const sp = (v) => { const k = (P[v * 3 + 1] - floorY) / KEY[1]; return toG(P[v * 3] - KEY[0] * k, P[v * 3 + 2] - KEY[2] * k); };
    const cwt = (v) => Math.exp(-(P[v * 3 + 1] - floorY) / (0.06 * radius * 2));
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t], b = I[t + 1], c = I[t + 2];
      const A = sp(a), Bv = sp(b), C = sp(c); fillTri2D(key, G, A[0], A[1], Bv[0], Bv[1], C[0], C[1], 1, 1, 1);
      const a2 = toG(P[a * 3], P[a * 3 + 2]), b2 = toG(P[b * 3], P[b * 3 + 2]), c2 = toG(P[c * 3], P[c * 3 + 2]); fillTri2D(contact, G, a2[0], a2[1], b2[0], b2[1], c2[0], c2[1], cwt(a), cwt(b), cwt(c));
    }
    blur(key, G, G, Math.round(G * 0.028), 3); blur(contact, G, G, Math.round(G * 0.012), 2);
  }
  // ---- shading ----
  const img = new Float32Array(w * h * 3), e = [0, 0, 0], ev = [0, 0, 0], tb = [0, 0, 0, 0], tn = [0, 0, 0, 0], tm = [0, 0, 0, 0];
  const tex = model.tex, hasTex = tex && !opts.clay, useNM = hasTex && tex.normal && opts.normalMap !== false;
  const texB = hasTex ? { size: tex.size, data: tex.base } : null, texO = hasTex ? { size: tex.size, data: tex.orm } : null, texN = useNM ? { size: tex.size, data: tex.normal } : null;
  const bgTop = opts.bg ? opts.bg : [0.88, 0.88, 0.9], bgBot = [0.7, 0.7, 0.73];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = y * w + x, k3 = o * 3, tid = tri[o];
    const rx = f[0] + (r[0] * (x + 0.5 - w / 2)) / focal - (u[0] * (y + 0.5 - h / 2)) / focal, ry = f[1] + (r[1] * (x + 0.5 - w / 2)) / focal - (u[1] * (y + 0.5 - h / 2)) / focal, rz = f[2] + (r[2] * (x + 0.5 - w / 2)) / focal - (u[2] * (y + 0.5 - h / 2)) / focal, rl = Math.hypot(rx, ry, rz);
    if (tid < 0) { // background / floor
      const gy = y / h; let cr = bgTop[0] + (bgBot[0] - bgTop[0]) * gy, cg = bgTop[1] + (bgBot[1] - bgTop[1]) * gy, cb = bgTop[2] + (bgBot[2] - bgTop[2]) * gy;
      const dy = ry / rl;
      if (floor && dy < -1e-4) {
        const t = (floorY - eye[1]) / dy, gx = eye[0] + (rx / rl) * t, gz = eye[2] + (rz / rl) * t;
        const gi = ((gx - (cx - ext)) / (2 * ext)) * G, gj = ((gz - (cz - ext)) / (2 * ext)) * G; let sh = 0;
        if (gi >= 0 && gj >= 0 && gi < G && gj < G) sh = clamp(key[(gj | 0) * G + (gi | 0)] * 0.5 + contact[(gj | 0) * G + (gi | 0)] * 0.6, 0, 0.88);
        const fade = 1 - sstep(radius * 2.6, radius * 6.5, Math.hypot(gx - cx, gz - cz));
        const light = 0.9 + 0.1 * clamp(KEY[1], 0, 1);
        cr = (cr * (1 - fade) + 0.8 * light * fade) * (1 - sh); cg = (cg * (1 - fade) + 0.8 * light * fade) * (1 - sh); cb = (cb * (1 - fade) + 0.82 * light * fade) * (1 - sh);
      }
      img[k3] = s2l(cr); img[k3 + 1] = s2l(cg); img[k3 + 2] = s2l(cb); continue;
    }
    const a = I[tid * 3], b = I[tid * 3 + 1], c = I[tid * 3 + 2], b1 = B1[o], b2 = B2[o], b0 = 1 - b1 - b2;
    const px = P[a * 3] * b0 + P[b * 3] * b1 + P[c * 3] * b2, py = P[a * 3 + 1] * b0 + P[b * 3 + 1] * b1 + P[c * 3 + 1] * b2, pz = P[a * 3 + 2] * b0 + P[b * 3 + 2] * b1 + P[c * 3 + 2] * b2;
    let nx = N[a * 3] * b0 + N[b * 3] * b1 + N[c * 3] * b2, ny = N[a * 3 + 1] * b0 + N[b * 3 + 1] * b1 + N[c * 3 + 1] * b2, nz = N[a * 3 + 2] * b0 + N[b * 3 + 2] * b1 + N[c * 3 + 2] * b2; let nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let alb0 = 0.62, alb1 = 0.62, alb2 = 0.64, rough = 0.5, metal = 0, ao = 1;
    if (hasTex && UV) {
      const uu = UV[a * 2] * b0 + UV[b * 2] * b1 + UV[c * 2] * b2, vv = UV[a * 2 + 1] * b0 + UV[b * 2 + 1] * b1 + UV[c * 2 + 1] * b2;
      sampleTex(texB, uu, vv, 3, tb); alb0 = s2l(tb[0] / 255); alb1 = s2l(tb[1] / 255); alb2 = s2l(tb[2] / 255);
      sampleTex(texO, uu, vv, 3, tm); ao = tm[0] / 255; rough = clamp(tm[1] / 255, 0.04, 1); metal = tm[2] / 255;
      if (texN) { // per-triangle tangent frame from UV derivatives (what viewers do), glTF green = up in image
        const u1 = UV[b * 2] - UV[a * 2], v1 = UV[b * 2 + 1] - UV[a * 2 + 1], u2 = UV[c * 2] - UV[a * 2], v2 = UV[c * 2 + 1] - UV[a * 2 + 1], det = u1 * v2 - u2 * v1;
        if (Math.abs(det) > 1e-12) {
          const e1 = [P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]], e2 = [P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]];
          let T = [(e1[0] * v2 - e2[0] * v1) / det, (e1[1] * v2 - e2[1] * v1) / det, (e1[2] * v2 - e2[2] * v1) / det], Bt = [-((e2[0] * u1 - e1[0] * u2) / det), -((e2[1] * u1 - e1[1] * u2) / det), -((e2[2] * u1 - e1[2] * u2) / det)];
          let d = T[0] * nx + T[1] * ny + T[2] * nz; T = norm3([T[0] - nx * d, T[1] - ny * d, T[2] - nz * d]);
          d = Bt[0] * nx + Bt[1] * ny + Bt[2] * nz; Bt = norm3([Bt[0] - nx * d, Bt[1] - ny * d, Bt[2] - nz * d]);
          sampleTex(texN, uu, vv, 3, tn); const mx = (tn[0] / 255) * 2 - 1, my = (tn[1] / 255) * 2 - 1, mz = (tn[2] / 255) * 2 - 1;
          nx = T[0] * mx + Bt[0] * my + nx * mz; ny = T[1] * mx + Bt[1] * my + ny * mz; nz = T[2] * mx + Bt[2] * my + nz * mz; nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        }
      }
    } else if (model.ao && opts.clay) { ao = 1; }
    const vx = -rx / rl, vy = -ry / rl, vz = -rz / rl, ndv = clamp(nx * vx + ny * vy + nz * vz, 0.001, 1);
    // diffuse: hemisphere + softboxes
    const hemi = 0.5 + 0.5 * ny; let dr = (0.3 + 0.55 * hemi) * 0.9, dg = dr, db = dr * 1.02;
    for (const L of BOXES) { const nd = clamp((nx * L.d[0] + ny * L.d[1] + nz * L.d[2]) * 0.85 + 0.15, 0, 1) * L.i * L.s * L.s * 0.9; dr += nd * L.c[0]; dg += nd * L.c[1]; db += nd * L.c[2]; }
    // specular
    const rdn = 2 * (nx * vx + ny * vy + nz * vz); env(rdn * nx - vx, rdn * ny - vy, rdn * nz - vz, rough, e);
    const f0r = 0.04 + (alb0 - 0.04) * metal, f0g = 0.04 + (alb1 - 0.04) * metal, f0b = 0.04 + (alb2 - 0.04) * metal, fr = Math.pow(1 - ndv, 5) * (1 - rough * 0.7);
    const Fr = f0r + (1 - f0r) * fr, Fg = f0g + (1 - f0g) * fr, Fb = f0b + (1 - f0b) * fr, sao = clamp(ao * ao * 1.6 + 0.1, 0, 1);
    const dm = (1 - metal) * ao;
    let R = alb0 * dm * dr + e[0] * Fr * sao, G2 = alb1 * dm * dg + e[1] * Fg * sao, Bc = alb2 * dm * db + e[2] * Fb * sao;
    if (model.clearcoat && hasTex) { env(rdn * nx - vx, rdn * ny - vy, rdn * nz - vz, 0.06, ev); const cf = 0.04 + 0.96 * Math.pow(1 - ndv, 5); R += ev[0] * cf * model.clearcoat; G2 += ev[1] * cf * model.clearcoat; Bc += ev[2] * cf * model.clearcoat; }
    img[k3] = R; img[k3 + 1] = G2; img[k3 + 2] = Bc;
  }
  // ---- tone map + downsample ----
  const out = new Uint8ClampedArray(W * H * 3), ex = opts.exposure ?? 0.85;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < 3; k++) {
    let s = 0;
    for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) { const v = img[((y * ss + sy) * w + x * ss + sx) * 3 + k]; s += l2s(v > 1.5 ? aces(v * ex) : aces(v * ex)); }
    out[(y * W + x) * 3 + k] = (s / (ss * ss)) * 255;
  }
  return { width: W, height: H, data: out };
}

/** Six standard review views as one contact sheet (3 x 2). */
export const VIEWS = [
  { name: 'front', azimuth: 0, elevation: 6 }, { name: '3q-right', azimuth: 35, elevation: 14 }, { name: 'side', azimuth: 90, elevation: 6 },
  { name: 'back', azimuth: 180, elevation: 8 }, { name: '3q-left', azimuth: -40, elevation: 18 }, { name: 'top', azimuth: 20, elevation: 62 },
];
export function sheet(images, cols = 3) {
  const w = images[0].width, h = images[0].height, rows = Math.ceil(images.length / cols), data = new Uint8ClampedArray(w * cols * h * rows * 3);
  images.forEach((im, i) => { const ox = (i % cols) * w, oy = Math.floor(i / cols) * h; for (let y = 0; y < h; y++) data.set(im.data.subarray(y * w * 3, (y + 1) * w * 3), ((oy + y) * w * cols + ox) * 3); });
  return { width: w * cols, height: h * rows, data };
}

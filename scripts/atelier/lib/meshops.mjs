// meshops.mjs: field-aware mesh operations. Because the model is a signed-distance field, ambient occlusion,
// curvature and cavity are measured from the exact shape instead of estimated from triangles.

/** Flip triangles whose winding disagrees with the vertex normals (they come from the field gradient, so they are the truth). */
export function orient(mesh) {
  const { positions: P, normals: N, indices: I } = mesh; let flipped = 0;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
    const vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    const nx = N[a * 3] + N[b * 3] + N[c * 3], ny = N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1], nz = N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2];
    if (fx * nx + fy * ny + fz * nz < 0) { I[t + 1] = c; I[t + 2] = b; flipped++; }
  }
  return flipped;
}

/** Drop degenerate and duplicate triangles. */
export function cleanTriangles(mesh) {
  const { positions: P, indices: I } = mesh; const out = []; const seen = new Set();
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    if (a === b || b === c || a === c) continue;
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
    const vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
    if (Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) < 1e-14) continue;
    const key = [a, b, c].sort((x, y) => x - y).join('_'); if (seen.has(key)) continue; seen.add(key);
    out.push(a, b, c);
  }
  mesh.indices = new Uint32Array(out); return mesh;
}

export function meshBounds(mesh) {
  const P = mesh.positions, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { if (P[i + k] < lo[k]) lo[k] = P[i + k]; if (P[i + k] > hi[k]) hi[k] = P[i + k]; }
  return { lo, hi, size: Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) };
}

/**
 * Per-vertex ambient occlusion and mean curvature measured on the field.
 *  ao   : 1 = open, 0 = deep crevice (multi-scale: tight creases and broad "between the legs" occlusion)
 *  curv : > 0 convex (edges that wear), < 0 concave (cavities that collect dirt), normalised by object size
 */
export function fieldAttributes(field, mesh) {
  const { positions: P, normals: N } = mesh, n = P.length / 3, size = meshBounds(mesh).size;
  const ao = new Float32Array(n), curv = new Float32Array(n);
  const d0 = size * 0.012, mul = [1, 2.5, 5, 10, 20], wt = [1, 0.8, 0.6, 0.45, 0.3], wsum = wt.reduce((a, b) => a + b, 0), e = size * 0.012;
  for (let v = 0; v < n; v++) {
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2], nx = N[v * 3], ny = N[v * 3 + 1], nz = N[v * 3 + 2];
    let occ = 0;
    for (let k = 0; k < mul.length; k++) {
      const t = d0 * mul[k], d = field(x + nx * t, y + ny * t, z + nz * t);
      occ += wt[k] * (1 - Math.max(0, Math.min(1, d / t)));
    }
    ao[v] = 1 - Math.min(1, (occ / wsum) * 1.25);
    const f0 = field(x, y, z);
    const lap = (field(x + e, y, z) + field(x - e, y, z) + field(x, y + e, z) + field(x, y - e, z) + field(x, y, z + e) + field(x, y, z - e) - 6 * f0) / (e * e);
    curv[v] = Math.max(-4, Math.min(4, (lap * size) / 8));
  }
  mesh.ao = ao; mesh.curv = curv; return mesh;
}

/** Light smoothing that does not shrink the shape (Taubin). Useful on meshes that are not from a field. */
export function taubin(mesh, iterations = 6, lambda = 0.5, mu = -0.53) {
  const P = mesh.positions, I = mesh.indices, n = P.length / 3, nb = Array.from({ length: n }, () => new Set());
  for (let t = 0; t < I.length; t += 3) for (let k = 0; k < 3; k++) { nb[I[t + k]].add(I[t + (k + 1) % 3]); nb[I[t + k]].add(I[t + (k + 2) % 3]); }
  const tmp = new Float32Array(P.length);
  for (let it = 0; it < iterations * 2; it++) {
    const f = it % 2 === 0 ? lambda : mu;
    for (let v = 0; v < n; v++) {
      const s = nb[v]; if (!s.size) { tmp.set(P.subarray(v * 3, v * 3 + 3), v * 3); continue; }
      let ax = 0, ay = 0, az = 0; for (const u of s) { ax += P[u * 3]; ay += P[u * 3 + 1]; az += P[u * 3 + 2]; }
      tmp[v * 3] = P[v * 3] + f * (ax / s.size - P[v * 3]); tmp[v * 3 + 1] = P[v * 3 + 1] + f * (ay / s.size - P[v * 3 + 1]); tmp[v * 3 + 2] = P[v * 3 + 2] + f * (az / s.size - P[v * 3 + 2]);
    }
    P.set(tmp);
  }
  return mesh;
}

/** Recompute normals from the field (exact), or from triangles when no field is given. */
export function recomputeNormals(mesh, field) {
  const { positions: P, indices: I } = mesh, n = P.length / 3, N = new Float32Array(n * 3);
  if (field) {
    const e = meshBounds(mesh).size * 0.002;
    for (let v = 0; v < n; v++) {
      const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
      const gx = field(x + e, y, z) - field(x - e, y, z), gy = field(x, y + e, z) - field(x, y - e, z), gz = field(x, y, z + e) - field(x, y, z - e), l = Math.hypot(gx, gy, gz) || 1;
      N[v * 3] = gx / l; N[v * 3 + 1] = gy / l; N[v * 3 + 2] = gz / l;
    }
  } else {
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t], b = I[t + 1], c = I[t + 2];
      const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
      const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      for (const v of [a, b, c]) { N[v * 3] += fx; N[v * 3 + 1] += fy; N[v * 3 + 2] += fz; }
    }
    for (let v = 0; v < n; v++) { const l = Math.hypot(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]) || 1; N[v * 3] /= l; N[v * 3 + 1] /= l; N[v * 3 + 2] /= l; }
  }
  mesh.normals = N; return mesh;
}

/**
 * Level of detail by vertex clustering: every vertex in a grid cell merges into one. Fast and robust, good for LOD1/LOD2.
 * Pass the field to re-snap merged vertices to the true surface so silhouettes do not shrink.
 */
export function decimate(mesh, targetTris, field) {
  const { lo, size } = meshBounds(mesh);
  const nTri = mesh.indices.length / 3;
  let cell = size / Math.sqrt(targetTris * 0.5), best = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const map = new Map(), P = mesh.positions, remap = new Int32Array(P.length / 3), acc = [], cnt = [];
    for (let v = 0; v < P.length / 3; v++) {
      const key = Math.floor((P[v * 3] - lo[0]) / cell) + ',' + Math.floor((P[v * 3 + 1] - lo[1]) / cell) + ',' + Math.floor((P[v * 3 + 2] - lo[2]) / cell);
      let id = map.get(key); if (id === undefined) { id = acc.length / 3; map.set(key, id); acc.push(0, 0, 0); cnt.push(0); }
      remap[v] = id; acc[id * 3] += P[v * 3]; acc[id * 3 + 1] += P[v * 3 + 1]; acc[id * 3 + 2] += P[v * 3 + 2]; cnt[id]++;
    }
    const out = { positions: new Float32Array(acc.length), indices: null };
    for (let i = 0; i < cnt.length; i++) { out.positions[i * 3] = acc[i * 3] / cnt[i]; out.positions[i * 3 + 1] = acc[i * 3 + 1] / cnt[i]; out.positions[i * 3 + 2] = acc[i * 3 + 2] / cnt[i]; }
    const tri = [], seen = new Set();
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const a = remap[mesh.indices[t]], b = remap[mesh.indices[t + 1]], c = remap[mesh.indices[t + 2]];
      if (a === b || b === c || a === c) continue;
      const key = a < b && a < c ? `${a}_${b}_${c}` : b < c ? `${b}_${c}_${a}` : `${c}_${a}_${b}`;
      if (seen.has(key)) continue; seen.add(key); tri.push(a, b, c);
    }
    out.indices = new Uint32Array(tri); best = out;
    const got = tri.length / 3;
    if (got <= targetTris * 1.15 || nTri <= targetTris) break;
    cell *= Math.sqrt(got / targetTris) * 1.02;
  }
  if (field) {
    const P = best.positions, e = size * 0.002, g = [0, 0, 0];
    for (let v = 0; v < P.length / 3; v++) {
      let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
      for (let it = 0; it < 2; it++) {
        const d = field(x, y, z);
        g[0] = field(x + e, y, z) - field(x - e, y, z); g[1] = field(x, y + e, z) - field(x, y - e, z); g[2] = field(x, y, z + e) - field(x, y, z - e);
        const l = Math.hypot(...g) || 1; x -= (g[0] / l) * d; y -= (g[1] / l) * d; z -= (g[2] / l) * d;
      }
      P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z;
    }
  }
  recomputeNormals(best, field); orient(best); return best;
}

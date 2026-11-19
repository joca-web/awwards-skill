// mesher.mjs: surface nets over a signed-distance field, with a coarse block skip so big empty volumes cost almost nothing,
// projection of every vertex onto the exact surface, and normals from the field gradient.
// Returns { positions: Float32Array, normals: Float32Array, indices: Uint32Array, bounds, cell }.

export function surfaceNets(field, { bounds, resolution = 128, block = 4, project = 2 } = {}) {
  const [lo, hi] = bounds;
  const ext = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  const h = Math.max(...ext) / resolution;
  const nx = Math.ceil(ext[0] / h) + 2, ny = Math.ceil(ext[1] / h) + 2, nz = Math.ceil(ext[2] / h) + 2; // cells (1 padding each side)
  const ox = lo[0] - h, oy = lo[1] - h, oz = lo[2] - h;
  const sx = nx + 1, sy = ny + 1, sz = nz + 1;                                                            // nodes
  const idx = (i, j, k) => i + sx * (j + sy * k);
  const val = new Float32Array(sx * sy * sz);
  const done = new Uint8Array(sx * sy * sz);

  // ---- sample nodes: skip blocks that are provably far from the surface ----
  const B = block, far = B * h * 1.9;
  for (let bk = 0; bk < sz; bk += B) for (let bj = 0; bj < sy; bj += B) for (let bi = 0; bi < sx; bi += B) {
    let mn = Infinity, sgn = 0, mixed = false;
    for (let c = 0; c < 8; c++) {
      const i = Math.min(bi + (c & 1) * B, sx - 1), j = Math.min(bj + ((c >> 1) & 1) * B, sy - 1), k = Math.min(bk + ((c >> 2) & 1) * B, sz - 1);
      const d = field(ox + i * h, oy + j * h, oz + k * h);
      mn = Math.min(mn, Math.abs(d)); const s = d < 0 ? -1 : 1; if (sgn && s !== sgn) mixed = true; sgn = s;
      if (c === 0) val[idx(i, j, k)] = d, done[idx(i, j, k)] = 1;
    }
    const fill = !mixed && mn > far;
    for (let k = bk; k <= Math.min(bk + B, sz - 1); k++) for (let j = bj; j <= Math.min(bj + B, sy - 1); j++) for (let i = bi; i <= Math.min(bi + B, sx - 1); i++) {
      const n = idx(i, j, k);
      if (done[n]) continue;
      if (fill) { val[n] = sgn * mn; } else { val[n] = field(ox + i * h, oy + j * h, oz + k * h); done[n] = 1; }
    }
  }

  // ---- one vertex per mixed cell ----
  const cellVert = new Int32Array(nx * ny * nz).fill(-1);
  const pos = []; const cidx = (i, j, k) => i + nx * (j + ny * k);
  const CORN = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float64Array(8);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let neg = 0;
    for (let c = 0; c < 8; c++) { const v = val[idx(i + CORN[c][0], j + CORN[c][1], k + CORN[c][2])]; cv[c] = v; if (v < 0) neg++; }
    if (neg === 0 || neg === 8) continue;
    let ax = 0, ay = 0, az = 0, cnt = 0;
    for (const [a, b] of EDGES) {
      if ((cv[a] < 0) === (cv[b] < 0)) continue;
      const t = cv[a] / (cv[a] - cv[b]);
      ax += CORN[a][0] + (CORN[b][0] - CORN[a][0]) * t; ay += CORN[a][1] + (CORN[b][1] - CORN[a][1]) * t; az += CORN[a][2] + (CORN[b][2] - CORN[a][2]) * t; cnt++;
    }
    cellVert[cidx(i, j, k)] = pos.length / 3;
    pos.push(ox + (i + ax / cnt) * h, oy + (j + ay / cnt) * h, oz + (k + az / cnt) * h);
  }

  // ---- quads across every sign-changing grid edge ----
  const tris = [];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    // split along the shorter diagonal
    const dist = (p, q) => { const dx = pos[p * 3] - pos[q * 3], dy = pos[p * 3 + 1] - pos[q * 3 + 1], dz = pos[p * 3 + 2] - pos[q * 3 + 2]; return dx * dx + dy * dy + dz * dz; };
    const t = dist(a, c) <= dist(b, d) ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
    for (const [p, q, r] of t) flip ? tris.push(p, r, q) : tris.push(p, q, r);
  };
  for (let k = 1; k < nz; k++) for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) {
    const v0 = val[idx(i, j, k)] < 0;
    if (v0 !== val[idx(i + 1, j, k)] < 0) quad(cellVert[cidx(i, j - 1, k - 1)], cellVert[cidx(i, j, k - 1)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j - 1, k)], !v0);
    if (v0 !== val[idx(i, j + 1, k)] < 0) quad(cellVert[cidx(i - 1, j, k - 1)], cellVert[cidx(i - 1, j, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j, k - 1)], !v0);
    if (v0 !== val[idx(i, j, k + 1)] < 0) quad(cellVert[cidx(i - 1, j - 1, k)], cellVert[cidx(i, j - 1, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i - 1, j, k)], !v0);
  }

  // ---- snap to the exact surface, then normals from the gradient ----
  const nv = pos.length / 3, P = new Float32Array(pos), N = new Float32Array(nv * 3), e = h * 0.5;
  const grad = (x, y, z, out) => {
    out[0] = field(x + e, y, z) - field(x - e, y, z); out[1] = field(x, y + e, z) - field(x, y - e, z); out[2] = field(x, y, z + e) - field(x, y, z - e);
    const l = Math.hypot(out[0], out[1], out[2]) || 1; out[0] /= l; out[1] /= l; out[2] /= l;
  };
  const g = [0, 0, 0];
  for (let v = 0; v < nv; v++) {
    let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    for (let it = 0; it < project; it++) { const d = field(x, y, z); grad(x, y, z, g); const s = Math.max(-h, Math.min(h, d)); x -= g[0] * s; y -= g[1] * s; z -= g[2] * s; }
    P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z;
    grad(x, y, z, g); N[v * 3] = g[0]; N[v * 3 + 1] = g[1]; N[v * 3 + 2] = g[2];
  }
  return { positions: P, normals: N, indices: new Uint32Array(tris), bounds: [[ox, oy, oz], [ox + nx * h, oy + ny * h, oz + nz * h]], cell: h };
}

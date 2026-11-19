// sdf.mjs: signed-distance modelling kit, pure JS (no three.js). A field is (x, y, z) => distance, negative inside.
// Same ideas as incridible-skill-3d/assets/three/sdf.js, extended with revolve profiles, domain repetition,
// polar arrays and a fast noise, and runnable in plain Node so models build, bake and export without a browser.

const { sqrt, abs, min, max, sin, cos, floor, hypot, PI } = Math;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rad = (d) => (d * PI) / 180;

// ---------- primitives ----------
export const sphere = (r, c = [0, 0, 0]) => (x, y, z) => hypot(x - c[0], y - c[1], z - c[2]) - r;

export const ellipsoid = (r, c = [0, 0, 0]) => {
  const [rx, ry, rz] = r, [cx, cy, cz] = c, m = min(rx, ry, rz);
  return (x, y, z) => {
    const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
    const k0 = hypot(px, py, pz), k1 = hypot(px / rx, py / ry, pz / rz);
    return k1 < 1e-9 ? -m : (k0 * (k0 - 1)) / k1;
  };
};

/** half = half extents, r = corner radius (applied inside the box, so the outer size stays `half`). */
export const box = (half, c = [0, 0, 0], r = 0) => {
  const [hx, hy, hz] = half;
  return (x, y, z) => {
    const qx = abs(x - c[0]) - hx + r, qy = abs(y - c[1]) - hy + r, qz = abs(z - c[2]) - hz + r;
    return hypot(max(qx, 0), max(qy, 0), max(qz, 0)) + min(max(qx, qy, qz), 0) - r;
  };
};

export const capsule = (a, b, r) => roundCone(a, b, r, r);

/** Cone with spherical ends, linearly varying radius (a close approximation of an exact round cone). */
export const roundCone = (a, b, ra, rb) => {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2], bb = bax * bax + bay * bay + baz * baz || 1e-9;
  return (x, y, z) => {
    const pax = x - a[0], pay = y - a[1], paz = z - a[2];
    const h = clamp((pax * bax + pay * bay + paz * baz) / bb, 0, 1);
    return hypot(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
  };
};

export const torus = (R, r, c = [0, 0, 0], axis = 'y') => (x, y, z) => {
  const px = x - c[0], py = y - c[1], pz = z - c[2];
  const [u, v, w] = axis === 'y' ? [px, pz, py] : axis === 'x' ? [py, pz, px] : [px, py, pz];
  return hypot(hypot(u, v) - R, w) - r;
};

/** Vertical cylinder (axis y) with rounded rim radius `round`. */
export const cylinder = (r, h, c = [0, 0, 0], round = 0) => (x, y, z) => {
  const dx = hypot(x - c[0], z - c[2]) - r + round, dy = abs(y - c[1]) - h + round;
  return min(max(dx, dy), 0) + hypot(max(dx, 0), max(dy, 0)) - round;
};

/** Infinite half space: negative below the plane through p with normal n. */
export const plane = (n, p = [0, 0, 0]) => {
  const l = hypot(...n); const nx = n[0] / l, ny = n[1] / l, nz = n[2] / l;
  return (x, y, z) => (x - p[0]) * nx + (y - p[1]) * ny + (z - p[2]) * nz;
};

/**
 * Solid of revolution around the Y axis from a closed profile of [radius, height] points (include r = 0 points on the axis).
 * Exact distance to the polyline, sign from a point-in-polygon test. This is how bottles, vases, cups, lamps and knobs
 * are made with perfectly smooth walls.
 */
export function revolve(points, { round = 0 } = {}) {
  const n = points.length, X = new Float64Array(n), Y = new Float64Array(n);
  points.forEach((p, i) => { X[i] = p[0]; Y[i] = p[1]; });
  return (x, y, z) => {
    const r = hypot(x, z); let d2 = Infinity, inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const ax = X[j], ay = Y[j], bx = X[i], by = Y[i], ex = bx - ax, ey = by - ay;
      const t = clamp(((r - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1e-12), 0, 1);
      const dx = r - (ax + ex * t), dy = y - (ay + ey * t), dd = dx * dx + dy * dy;
      if (dd < d2) d2 = dd;
      if ((ay > y) !== (by > y) && r < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
    }
    return (inside ? -sqrt(d2) : sqrt(d2)) - round;
  };
}

// ---------- combine ----------
export const union = (...f) => (x, y, z) => { let d = f[0](x, y, z); for (let i = 1; i < f.length; i++) { const e = f[i](x, y, z); if (e < d) d = e; } return d; };
export const intersect = (...f) => (x, y, z) => { let d = f[0](x, y, z); for (let i = 1; i < f.length; i++) { const e = f[i](x, y, z); if (e > d) d = e; } return d; };
export const subtract = (a, ...b) => (x, y, z) => { let d = a(x, y, z); for (let i = 0; i < b.length; i++) { const e = -b[i](x, y, z); if (e > d) d = e; } return d; };
const smin = (a, b, k) => { const h = max(k - abs(a - b), 0) / k; return min(a, b) - h * h * k * 0.25; };
/** k is the fillet radius: bigger = softer join. */
export const smoothUnion = (k, ...f) => (x, y, z) => { let d = f[0](x, y, z); for (let i = 1; i < f.length; i++) d = smin(d, f[i](x, y, z), k); return d; };
export const smoothSubtract = (k, a, ...b) => (x, y, z) => { let d = a(x, y, z); for (let i = 0; i < b.length; i++) d = -smin(-d, b[i](x, y, z), k); return d; };
export const smoothIntersect = (k, ...f) => (x, y, z) => { let d = f[0](x, y, z); for (let i = 1; i < f.length; i++) d = -smin(-d, -f[i](x, y, z), k); return d; };

// ---------- place ----------
export const translate = (f, [tx, ty, tz]) => (x, y, z) => f(x - tx, y - ty, z - tz);
export const scale = (f, s) => (x, y, z) => f(x / s, y / s, z / s) * s;
/** Euler degrees, applied X then Y then Z, around pivot. */
export function rotate(f, [rx, ry, rz], pivot = [0, 0, 0]) {
  const cx = cos(rad(-rx)), sx = sin(rad(-rx)), cy = cos(rad(-ry)), sy = sin(rad(-ry)), cz = cos(rad(-rz)), sz = sin(rad(-rz));
  return (x, y, z) => {
    let px = x - pivot[0], py = y - pivot[1], pz = z - pivot[2], t;
    t = px * cz - py * sz; py = px * sz + py * cz; px = t;          // inverse of Z last
    t = px * cy + pz * sy; pz = -px * sy + pz * cy; px = t;
    t = py * cx - pz * sx; pz = py * sx + pz * cx; py = t;
    return f(px + pivot[0], py + pivot[1], pz + pivot[2]);
  };
}
export const mirrorX = (f) => (x, y, z) => f(abs(x), y, z);
export const mirrorZ = (f) => (x, y, z) => f(x, y, abs(z));
/** Non-uniform stretch (cheap squash/stretch; keeps the field a usable bound for modest factors). */
export const stretch = (f, [sx, sy, sz]) => { const m = min(sx, sy, sz); return (x, y, z) => f(x / sx, y / sy, z / sz) * m; };
export const twist = (f, k) => (x, y, z) => { const a = k * y, c = cos(a), s = sin(a); return f(c * x - s * z, y, s * x + c * z); };

// ---------- finish ----------
export const round = (f, r) => (x, y, z) => f(x, y, z) - r;
export const shell = (f, t) => (x, y, z) => abs(f(x, y, z)) - t / 2;
export const displace = (f, fn) => (x, y, z) => f(x, y, z) + fn(x, y, z);
/** Thin layer just under the surface of f (depth in field units): intersect a cutter with it to carve shallow recesses. */
export const skin = (f, depth) => (x, y, z) => abs(f(x, y, z) + depth * 0.5) - depth * 0.5;

// ---------- arrays (repeat details without writing them N times) ----------
/** Repeat f every `spacing` along an axis, `count` cells each side of the origin. */
export const repeat = (f, axis, spacing, count) => (x, y, z) => {
  const p = [x, y, z], i = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  p[i] -= spacing * clamp(Math.round(p[i] / spacing), -count, count);
  return f(p[0], p[1], p[2]);
};
/** n copies around the Y axis. */
export const polar = (f, n) => (x, y, z) => {
  const sec = (2 * PI) / n; let a = Math.atan2(z, x); a = ((a % sec) + sec + sec / 2) % sec - sec / 2;
  const r = hypot(x, z); return f(r * cos(a), y, r * sin(a));
};

// ---------- noise ----------
function hash(ix, iy, iz) { let h = (ix * 374761393 + iy * 668265263 + iz * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
const fade = (t) => t * t * (3 - 2 * t);
/** Smooth value noise in [0,1]. */
export function noise3(x, y, z) {
  const ix = floor(x), iy = floor(y), iz = floor(z), fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx), l(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx), fy),
    l(l(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx), l(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}
export function fbm(x, y, z, oct = 4) { let a = 0.5, s = 0, f = 1; for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return s; }
export { clamp };

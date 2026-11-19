// hull.mjs: image-to-3D for solid products from silhouettes. Each tight-cropped silhouette becomes a 2D signed distance
// image; the 3D field is the smooth intersection of their extrusions (a visual hull), so it feeds the same
// mesh -> bake -> glb pipeline as hand-written models. Colour can be projected from front (and back) photos.
// Honest limits: concavities that do not show in a silhouette (a mug's hollow, the gap between a shoe's tongue and
// upper) cannot be recovered; a hull is a good base for bottles, cans, boxes, headphones, toys, lamps, speakers.
import { clamp } from './sdf.mjs';

/** RGBA image -> boolean mask. Uses alpha when the image has transparency, otherwise difference from the border colour. */
export function toMask({ width: w, height: h, data }) {
  let hasAlpha = false; for (let i = 3; i < data.length; i += 4) if (data[i] < 250) { hasAlpha = true; break; }
  const m = new Uint8Array(w * h);
  if (hasAlpha) { for (let i = 0; i < w * h; i++) m[i] = data[i * 4 + 3] > 127 ? 1 : 0; return m; }
  const border = []; for (let x = 0; x < w; x++) { border.push(x, (h - 1) * w + x); } for (let y = 0; y < h; y++) { border.push(y * w, y * w + w - 1); }
  const bg = [0, 1, 2].map((k) => border.map((p) => data[p * 4 + k]).sort((a, b) => a - b)[border.length >> 1]);
  for (let i = 0; i < w * h; i++) m[i] = Math.hypot(data[i * 4] - bg[0], data[i * 4 + 1] - bg[1], data[i * 4 + 2] - bg[2]) > 48 ? 1 : 0;
  return m;
}

function edt1d(f, n, v, z, out) { // Felzenszwalb squared distance transform, one line
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s; while (true) { s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); if (s <= z[k] && k > 0) k--; else break; }
    if (s <= z[k]) { k = 0; v[0] = q; z[0] = -Infinity; z[1] = Infinity; } else { k++; v[k] = q; z[k] = s; z[k + 1] = Infinity; }
  }
  k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const d = q - v[k]; out[q] = d * d + f[v[k]]; }
}
function dist2d(mask, w, h, target) { // distance (px) from every pixel to the nearest pixel whose mask == target
  const INF = 1e10, g = new Float64Array(w * h), n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let i = 0; i < w * h; i++) g[i] = mask[i] === target ? 0 : INF;
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; edt1d(f, h, v, z, d); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; edt1d(f, w, v, z, d); for (let x = 0; x < w; x++) g[y * w + x] = d[x]; }
  for (let i = 0; i < w * h; i++) g[i] = Math.sqrt(g[i]); return g;
}

/** Cropped, padded signed-distance image of a silhouette: negative inside, in pixels. */
function silhouette(img, pad = 6) {
  const m = toMask(img), { width: W, height: H } = img; let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) throw new Error('silhouette is empty: the object must differ from the background (use a transparent or plain background)');
  const w = x1 - x0 + 1 + 2 * pad, h = y1 - y0 + 1 + 2 * pad, c = new Uint8Array(w * h);
  for (let y = 0; y < h - 2 * pad; y++) for (let x = 0; x < w - 2 * pad; x++) c[(y + pad) * w + x + pad] = m[(y + y0) * W + x + x0];
  const din = dist2d(c, w, h, 0), dout = dist2d(c, w, h, 1), s = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) s[i] = c[i] ? -(din[i] - 0.5) : dout[i] - 0.5;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, raw = new Float32Array(bh), rowHalf = new Float32Array(bh);
  for (let y = 0; y < bh; y++) { let a = Infinity, b = -Infinity; for (let x = 0; x < bw; x++) if (c[(y + pad) * w + x + pad]) { a = Math.min(a, x); b = Math.max(b, x); } raw[y] = b >= a ? (b - a + 1) / 2 : 0; }
  for (let y = 0; y < bh; y++) { let t = 0, n = 0; for (let k = -2; k <= 2; k++) { const v = raw[Math.max(0, Math.min(bh - 1, y + k))]; t += v; n++; } rowHalf[y] = t / n; }
  return { w, h, s, pad, x0, y0, bw, bh, rowHalf, mask: c };
}
function sample(sil, px, py) { // bilinear SDF with a linear continuation outside the image
  const cx = clamp(px, 0, sil.w - 1.001), cy = clamp(py, 0, sil.h - 1.001), x0 = cx | 0, y0 = cy | 0, fx = cx - x0, fy = cy - y0, w = sil.w, s = sil.s;
  const v = (s[y0 * w + x0] * (1 - fx) + s[y0 * w + x0 + 1] * fx) * (1 - fy) + (s[(y0 + 1) * w + x0] * (1 - fx) + s[(y0 + 1) * w + x0 + 1] * fx) * fy;
  return v + Math.hypot(px - cx, py - cy);
}
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };

/** Fill background pixels with the nearest object colour on the same row so projected colour never samples the background. */
function bleed(img, sil) {
  if (!img) return null;
  const { width: W, height: H } = img, src = toMask(img), data = new Uint8Array(img.data), out = { width: W, height: H, data };
  for (let y = 0; y < H; y++) {
    let last = -1; for (let x = 0; x < W; x++) { if (src[y * W + x]) last = x; else if (last >= 0) data.copyWithin((y * W + x) * 4, (y * W + last) * 4, (y * W + last) * 4 + 4); }
    last = -1; for (let x = W - 1; x >= 0; x--) { if (src[y * W + x]) last = x; else if (last >= 0 && !(x > 0 && false)) { const o = (y * W + x) * 4; if (data[o] === img.data[o] && data[o + 1] === img.data[o + 1] && data[o + 2] === img.data[o + 2]) data.copyWithin(o, (y * W + last) * 4, (y * W + last) * 4 + 4); } }
  }
  return out;
}

/**
 * section: cross-section used when no top silhouette is given. 'round' (ellipse, exponent 2), 'box' (plain intersection),
 * or a number = superellipse exponent (2 round, 3 to 4 squircle, 8 almost box). Two orthogonal silhouettes alone cannot say.
 */
export function hullModel({ front, side, top = null, height = 1, smooth = 0.012, frontColor = null, backColor = null, section = 'round', params = {} }) {
  const F = silhouette(front), S = silhouette(side), T = top ? silhouette(top) : null;
  const sc = height / F.bh;                                   // world units per pixel, from the front view
  const scS = height / S.bh;                                  // the side view is cropped to the same height
  const W = F.bw * sc, D = S.bw * scS, k = smooth * height;
  const scT = T ? W / T.bw : 0;
  const fF = (x, y) => sample(F, F.pad + F.bw / 2 + x / sc, F.pad + F.bh - y / sc) * sc;
  const fS = (z, y) => sample(S, S.pad + S.bw / 2 + z / scS, S.pad + S.bh - y / scS) * scS;
  const fT = T ? (x, z) => sample(T, T.pad + T.bw / 2 + x / scT, T.pad + T.bh / 2 + z / scT) * scT : null;
  const expo = section === 'box' ? Infinity : section === 'round' ? 2 : +section || 2;
  const halfAt = (sil, scale, y) => { const r = Math.max(0, Math.min(sil.bh - 1, Math.round(sil.bh - y / scale))); return sil.rowHalf[r] * scale; };
  const fSec = (!fT && isFinite(expo)) ? (x, y, z) => { const a = halfAt(F, sc, y), b = halfAt(S, scS, y); if (a < 1e-6 || b < 1e-6) return -1; return (Math.pow(Math.pow(Math.abs(x) / a, expo) + Math.pow(Math.abs(z) / b, expo), 1 / expo) - 1) * Math.min(a, b); } : null;
  const field = (x, y, z) => { let d = smax(fF(x, y), fS(z, y), k); if (fT) d = smax(d, fT(x, z), k); if (fSec) d = smax(d, fSec(x, y, z), k); return d; };
  frontColor = bleed(frontColor, F); backColor = bleed(backColor, F);
  const grey = [0.78, 0.78, 0.8];
  const lookup = (img, sil, u, v) => { // sample the colour photo at the same pixel the silhouette used (original image coordinates)
    const px = clamp(sil.x0 + (u - sil.pad), 0, img.width - 1) | 0, py = clamp(sil.y0 + (v - sil.pad), 0, img.height - 1) | 0, o = (py * img.width + px) * 4;
    return [img.data[o] / 255, img.data[o + 1] / 255, img.data[o + 2] / 255];
  };
  const materialAt = (ctx, out) => {
    const [x, y] = ctx.p, nz = ctx.n[2]; let col = grey;
    if (frontColor) {
      const u = F.pad + F.bw / 2 + x / sc, v = F.pad + F.bh - y / sc;
      const cf = lookup(frontColor, F, u, v);
      if (nz < -0.1 && backColor) { const cb = lookup(backColor, F, F.pad + F.bw / 2 - x / sc, v), t = clamp(-nz * 1.6, 0, 1); col = [cf[0] + (cb[0] - cf[0]) * t, cf[1] + (cb[1] - cf[1]) * t, cf[2] + (cb[2] - cf[2]) * t]; }
      else col = cf;
    }
    const dirt = (1 - ctx.ao) * 0.2;
    out.c[0] = col[0] * (1 - dirt); out.c[1] = col[1] * (1 - dirt); out.c[2] = col[2] * (1 - dirt);
    out.r = params.rough ?? 0.45; out.m = params.metal ?? 0; out.h = 0;
  };
  const pad = 0.04 * height;
  return { field, materialAt, meta: { name: 'hull', resolution: 130, texture: 1024, bump: 0, bounds: [[-W / 2 - pad, -pad, -D / 2 - pad], [W / 2 + pad, height + pad, D / 2 + pad]] } };
}

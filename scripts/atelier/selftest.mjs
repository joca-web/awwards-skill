#!/usr/bin/env node
// selftest.mjs: proves the Atelier pipeline works on this machine in about 20 seconds.
//   node selftest.mjs        (exit code 0 = all checks passed)
// It makes a bottle silhouette itself, turns it into a mesh with the image-to-3D hull route, checks the geometry,
// then builds the bundled speaker model and verifies the .glb it writes can be read back.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
import { encodePNG, decodePNG } from './lib/png.mjs'; import { hullModel } from './lib/hull.mjs'; import { surfaceNets } from './lib/mesher.mjs';
import { orient, meshBounds } from './lib/meshops.mjs'; import { readGLB } from './lib/glb.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)); let fail = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); if (!ok) fail++; };

// 1. PNG round trip
const px = new Uint8Array(4 * 4 * 4).map((_, i) => (i * 37) & 255); const rt = decodePNG(encodePNG(4, 4, px, 4));
check('png encode/decode round trip', rt.width === 4 && rt.data.every((v, i) => v === px[i]));

// 2. bottle silhouette (profile r(y)), front = side, top = circle
const R = (t) => (t < 0.55 ? 0.22 : t < 0.7 ? 0.22 - (t - 0.55) / 0.15 * 0.14 : t < 0.92 ? 0.08 : 0.095);        // t in 0..1 from bottom
const Wd = 300, Ht = 600, mk = (fn) => { const d = new Uint8Array(Wd * Ht * 4).fill(255); for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) if (fn(x, y)) { const o = (y * Wd + x) * 4; d[o] = d[o + 1] = d[o + 2] = 20; } return { width: Wd, height: Ht, data: d }; };
const prof = mk((x, y) => { const t = 1 - (y - 20) / 560; return t >= 0 && t <= 1 && Math.abs(x - Wd / 2) < R(t) * 560; });
const topMask = (() => { const d = new Uint8Array(300 * 300 * 4).fill(255); for (let y = 0; y < 300; y++) for (let x = 0; x < 300; x++) if (Math.hypot(x - 150, y - 150) < 123) { const o = (y * 300 + x) * 4; d[o] = d[o + 1] = d[o + 2] = 20; } return { width: 300, height: 300, data: d }; })();
const m = hullModel({ front: prof, side: prof, top: topMask, height: 1 });
const mesh = surfaceNets(m.field, { bounds: m.meta.bounds, resolution: 90 }); orient(mesh); const bb = meshBounds(mesh);
check('hull produces a mesh', mesh.indices.length > 5000, `${mesh.indices.length / 3} triangles`);
const w = bb.hi[0] - bb.lo[0], d = bb.hi[2] - bb.lo[2], h = bb.hi[1] - bb.lo[1];
check('hull height = requested height (1.0)', Math.abs(h - 1.0) < 0.02, `h=${h.toFixed(3)}`);
check('hull is round (width ~ depth)', Math.abs(w - d) < 0.06, `w=${w.toFixed(3)} d=${d.toFixed(3)}`);
check('hull width matches the silhouette (0.439 expected)', Math.abs(w - 0.439) < 0.02, `w=${w.toFixed(3)}`);
// every vertex lies on the surface
let maxErr = 0; for (let i = 0; i < mesh.positions.length; i += 3) maxErr = Math.max(maxErr, Math.abs(m.field(mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2])));
check('vertices sit on the surface', maxErr < mesh.cell * 0.5, `max |field| = ${maxErr.toExponential(1)} (cell ${mesh.cell.toFixed(4)})`);
// winding agrees with normals
let bad = 0; { const P = mesh.positions, N = mesh.normals, I = mesh.indices; for (let t = 0; t < I.length; t += 3) { const a = I[t], b = I[t + 1], c = I[t + 2]; const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2]; if ((uy * vz - uz * vy) * N[a * 3] + (uz * vx - ux * vz) * N[a * 3 + 1] + (ux * vy - uy * vx) * N[a * 3 + 2] < 0) bad++; } }
check('triangles face outward', bad === 0, `${bad} inverted`);

// 3. full pipeline through the CLI on the bundled model
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-'));
try {
  execFileSync('node', [path.join(HERE, 'atelier.mjs'), 'build', path.join(HERE, 'models/speaker.mjs'), '--draft', '--out', tmp], { stdio: 'pipe' });
  const glb = readGLB(fs.readFileSync(path.join(tmp, 'speaker.glb')));
  check('speaker.glb reads back with UVs and textures', glb.uvs && glb.json.textures.length === 3 && glb.indices.length > 10000);
  check('preview images written', ['speaker-views.png', 'speaker-beauty.png', 'speaker-clay-views.png'].every((f) => fs.existsSync(path.join(tmp, f))));
} catch (e) { check('speaker build through the CLI', false, String(e.stderr || e.message).slice(0, 300)); }
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed'); process.exit(fail ? 1 : 0);

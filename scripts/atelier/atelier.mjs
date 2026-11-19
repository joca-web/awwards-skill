#!/usr/bin/env node
// atelier.mjs: code-first 3D studio. No Blender, no browser, no network, no installs: Node 22 only.
//
//   node atelier.mjs build  models/speaker.mjs [--out DIR] [--res 140] [--tex 1024] [--param k=v] [--lods 60000,20000] [--draft]
//   node atelier.mjs hull   front.png side.png [top.png] --height 1 [--section round|box|N] [--front-color front.png] [--back-color back.png] [--out DIR] [--name thing]
//   node atelier.mjs preview model.glb [--out DIR] [--clay] [--no-normal-map]
//
// build : model module -> exact mesh (surface nets on a signed-distance field) -> field AO and curvature -> UV atlas ->
//         baked albedo / ORM / normal maps -> .glb (+ LODs) -> six-view sheet and a beauty shot rendered by the software previewer.
// hull  : tight-cropped silhouettes (front, side, optional top) -> smooth visual hull -> same pipeline. Image-to-3D for solid products.
// preview: render the review sheet for any single-mesh .glb with embedded PNG textures.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import * as sdf from './lib/sdf.mjs';
import { surfaceNets } from './lib/mesher.mjs';
import { orient, cleanTriangles, fieldAttributes, decimate, meshBounds, recomputeNormals } from './lib/meshops.mjs';
import { buildAtlas, bakeTextures } from './lib/bake.mjs';
import { writeGLB, readGLB } from './lib/glb.mjs';
import { encodePNG, decodePNG } from './lib/png.mjs';
import { render, sheet, VIEWS } from './lib/raster.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), cmd = argv[0];
const VALUE_FLAGS = new Set(['out', 'res', 'tex', 'param', 'lods', 'height', 'name', 'front-color', 'back-color', 'size', 'bump', 'smooth', 'section']);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d; };
const flag = (n) => argv.includes('--' + n);
const positional = argv.slice(1).filter((a, i, arr) => !a.startsWith('--') && !VALUE_FLAGS.has((arr[i - 1] || '').replace(/^--/, '')));
const params = {}; argv.forEach((a, i) => { if (a === '--param' && argv[i + 1]) { const [k, ...v] = argv[i + 1].split('='); params[k] = isNaN(+v.join('=')) ? v.join('=') : +v.join('='); } });
const draft = flag('draft');
const t0 = Date.now(); const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

function usage() { console.error('usage:\n  node atelier.mjs build <model.mjs> [--out DIR] [--res N] [--tex N] [--param k=v] [--lods a,b] [--draft]\n  node atelier.mjs hull <front.png> <side.png> [top.png] --height 1 [--front-color img.png]\n  node atelier.mjs preview <model.glb> [--clay]'); process.exit(2); }

function savePreview(model, outDir, name, { clay = false, size = 420 } = {}) {
  const ssaa = draft ? 1 : 2, imgs = VIEWS.map((v) => render(model, { width: size, height: size, azimuth: v.azimuth, elevation: v.elevation, ssaa, clay, normalMap: !flag('no-normal-map') }));
  const s = sheet(imgs); fs.writeFileSync(path.join(outDir, `${name}${clay ? '-clay' : ''}-views.png`), encodePNG(s.width, s.height, s.data, 3));
  const beauty = render(model, { width: 900, height: 900, azimuth: 32, elevation: 13, fov: 24, ssaa, clay });
  fs.writeFileSync(path.join(outDir, `${name}${clay ? '-clay' : ''}-beauty.png`), encodePNG(beauty.width, beauty.height, beauty.data, 3));
}

function finish({ field, materialAt, meta }, outDir, name) {
  const t = { res: +opt('res', draft ? 72 : meta.resolution || 140), tex: +opt('tex', draft ? 512 : meta.texture || 1024) };
  let mesh = surfaceNets(field, { bounds: meta.bounds, resolution: t.res });
  log(`mesh: ${mesh.indices.length / 3} triangles at resolution ${t.res}`);
  { const [blo, bhi] = mesh.bounds, P = mesh.positions, m = mesh.cell * 1.2; let hit = 0;
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) if (P[i + k] < blo[k] + m || P[i + k] > bhi[k] - m) { hit++; break; }
    if (hit) console.warn(`WARNING: ${hit} vertices touch meta.bounds, so the model is probably CLIPPED (flat cut-offs on tips). Enlarge meta.bounds on the side that is cut.`); }
  cleanTriangles(mesh); const flipped = orient(mesh); log(`oriented (${flipped} flipped); measuring occlusion and curvature on the field`);
  fieldAttributes(field, mesh);
  const atlas = buildAtlas(mesh, { size: t.tex }); log(`atlas: ${atlas.charts} charts at ${t.tex}px`);
  const tex = bakeTextures(atlas, materialAt, { bump: +opt('bump', meta.bump ?? 1) }); log('baked albedo, ORM and normal maps');
  const glb = writeGLB(atlas, tex, { name, clearcoat: meta.clearcoat, clearcoatRoughness: meta.clearcoatRoughness, doubleSided: false });
  fs.writeFileSync(path.join(outDir, `${name}.glb`), glb); log(`wrote ${name}.glb (${(glb.length / 1048576).toFixed(2)} MB)`);
  for (const target of (opt('lods', '') || '').split(',').filter(Boolean).map(Number)) {
    let lod = decimate(mesh, target, field); fieldAttributes(field, lod);
    const la = buildAtlas(lod, { size: Math.min(t.tex, 1024) }); const lt = bakeTextures(la, materialAt, { bump: +opt('bump', meta.bump ?? 1) });
    const g = writeGLB(la, lt, { name, clearcoat: meta.clearcoat }); fs.writeFileSync(path.join(outDir, `${name}-lod${target}.glb`), g); log(`LOD ${target}: ${lod.indices.length / 3} triangles, ${(g.length / 1048576).toFixed(2)} MB`);
  }
  const model = { ...atlas, tex: { size: tex.size, base: tex.base, orm: tex.orm, normal: tex.normal }, clearcoat: meta.clearcoat };
  fs.writeFileSync(path.join(outDir, `${name}-albedo.png`), encodePNG(tex.size, tex.size, tex.base, 4));
  fs.writeFileSync(path.join(outDir, `${name}-normal.png`), encodePNG(tex.size, tex.size, tex.normal, 4));
  savePreview(model, outDir, name); log('rendered views and beauty shot');
  savePreview({ ...model, tex: null }, outDir, name, { clay: true, size: 320 }); log('rendered clay sheet (shape only)');
  const bb = meshBounds(mesh);
  const report = { name, triangles: mesh.indices.length / 3, vertices: atlas.positions.length / 3, resolution: t.res, texture: t.tex, charts: atlas.charts, glbMB: +(glb.length / 1048576).toFixed(2), size: bb.hi.map((v, i) => +(v - bb.lo[i]).toFixed(4)), seconds: +((Date.now() - t0) / 1000).toFixed(1) };
  fs.writeFileSync(path.join(outDir, `${name}-report.json`), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
}

if (cmd === 'build') {
  if (!positional[0]) usage();
  const file = path.resolve(positional[0]), outDir = path.resolve(opt('out', '.apex/models')); fs.mkdirSync(outDir, { recursive: true });
  const mod = await import(pathToFileURL(file).href), meta = mod.meta || {};
  if (!meta.bounds) throw new Error('the model must export meta.bounds = [[minx,miny,minz],[maxx,maxy,maxz]]');
  const built = mod.default({ sdf, params: { ...(meta.params || {}), ...params } });
  finish({ ...built, meta }, outDir, meta.name || path.basename(file, path.extname(file)));
} else if (cmd === 'hull') {
  if (positional.length < 2) usage();
  const { hullModel } = await import('./lib/hull.mjs');
  const outDir = path.resolve(opt('out', '.apex/models')); fs.mkdirSync(outDir, { recursive: true });
  const sil = positional.map((p) => decodePNG(fs.readFileSync(path.resolve(p))));
  const colour = (n) => (opt(n) ? decodePNG(fs.readFileSync(path.resolve(opt(n)))) : null);
  const m = hullModel({ front: sil[0], side: sil[1], top: sil[2] || null, height: +opt('height', 1), smooth: +opt('smooth', 0.012), section: opt('section', 'round'), frontColor: colour('front-color'), backColor: colour('back-color') });
  finish(m, outDir, opt('name', 'hull'));
} else if (cmd === 'preview') {
  if (!positional[0]) usage();
  const outDir = path.resolve(opt('out', '.apex/models')); fs.mkdirSync(outDir, { recursive: true });
  const g = readGLB(fs.readFileSync(path.resolve(positional[0])));
  const m = { positions: g.positions, normals: g.normals, uvs: g.uvs, indices: g.indices, tex: null };
  if (!m.normals) recomputeNormals(m);
  const mat = g.json.materials?.[0], pbr = mat?.pbrMetallicRoughness || {}, load = (t) => { if (!t) return null; const d = decodePNG(Buffer.from(g.imageBytes(g.json.textures[t.index].source))); return d; };
  const b = load(pbr.baseColorTexture), o = load(pbr.metallicRoughnessTexture), n = load(mat?.normalTexture);
  if (b && g.uvs) m.tex = { size: b.width, base: b.data, orm: o ? o.data : new Uint8Array(b.data.length).fill(128), normal: n ? n.data : null };
  savePreview(m, outDir, path.basename(positional[0], '.glb') + '-preview'); log('done');
} else usage();

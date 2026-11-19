// glb.mjs: write a glTF 2.0 binary (.glb) with embedded PBR textures. No dependencies.
import { encodePNG } from './png.mjs';

/**
 * atlas: { positions, normals, uvs, indices }  tex: { size, base, orm, normal }  (RGBA8 arrays, all optional except geometry)
 * material: { name, clearcoat, clearcoatRoughness, emissive:[r,g,b], doubleSided }
 */
export function writeGLB(atlas, tex, material = {}) {
  const bin = []; let off = 0; const views = [], accessors = [];
  const pad = (n) => (4 - (n % 4)) % 4;
  const addView = (buf, target) => { const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength); const p = pad(off);
    if (p) { bin.push(Buffer.alloc(p)); off += p; }
    views.push({ buffer: 0, byteOffset: off, byteLength: b.length, ...(target ? { target } : {}) }); bin.push(b); off += b.length; return views.length - 1; };
  const P = atlas.positions, n = P.length / 3; const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[i + k]); mx[k] = Math.max(mx[k], P[i + k]); }
  const acc = (view, componentType, count, type, extra = {}) => { accessors.push({ bufferView: view, componentType, count, type, ...extra }); return accessors.length - 1; };
  const attributes = {};
  attributes.POSITION = acc(addView(P, 34962), 5126, n, 'VEC3', { min: mn, max: mx });
  if (atlas.normals) attributes.NORMAL = acc(addView(atlas.normals, 34962), 5126, n, 'VEC3');
  if (atlas.uvs) attributes.TEXCOORD_0 = acc(addView(atlas.uvs, 34962), 5126, n, 'VEC2');
  const indices = acc(addView(atlas.indices, 34963), 5125, atlas.indices.length, 'SCALAR');

  const images = [], textures = [], pbr = { metallicFactor: 1, roughnessFactor: 1 }, mat = { name: material.name || 'atelier', pbrMetallicRoughness: pbr };
  const addTex = (rgba, size) => { images.push({ bufferView: addView(new Uint8Array(encodePNG(size, size, rgba, 4))), mimeType: 'image/png' }); textures.push({ source: images.length - 1, sampler: 0 }); return textures.length - 1; };
  if (tex) {
    if (tex.base) pbr.baseColorTexture = { index: addTex(tex.base, tex.size) };
    if (tex.orm) { const i = addTex(tex.orm, tex.size); pbr.metallicRoughnessTexture = { index: i }; mat.occlusionTexture = { index: i, strength: 1 }; }
    if (tex.normal) mat.normalTexture = { index: addTex(tex.normal, tex.size), scale: 1 };
  } else { pbr.baseColorFactor = [0.8, 0.8, 0.8, 1]; pbr.metallicFactor = 0; pbr.roughnessFactor = 0.6; }
  if (material.emissive) mat.emissiveFactor = material.emissive;
  if (material.doubleSided) mat.doubleSided = true;
  const used = [];
  if (material.clearcoat) { mat.extensions = { KHR_materials_clearcoat: { clearcoatFactor: material.clearcoat, clearcoatRoughnessFactor: material.clearcoatRoughness ?? 0.08 } }; used.push('KHR_materials_clearcoat'); }

  const json = {
    asset: { version: '2.0', generator: 'awwards-skill atelier' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: material.name || 'model' }],
    meshes: [{ primitives: [{ attributes, indices, material: 0, mode: 4 }] }], materials: [mat],
    accessors, bufferViews: views, buffers: [{ byteLength: 0 }],
    ...(images.length ? { images, textures, samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }] } : {}),
    ...(used.length ? { extensionsUsed: used } : {}),
  };
  const binBuf = Buffer.concat(bin); const bp = pad(binBuf.length); const binPadded = Buffer.concat([binBuf, Buffer.alloc(bp)]);
  json.buffers[0].byteLength = binPadded.length;
  let js = Buffer.from(JSON.stringify(json)); const jp = pad(js.length); js = Buffer.concat([js, Buffer.alloc(jp, 0x20)]);
  const total = 12 + 8 + js.length + 8 + binPadded.length, head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
  const c1 = Buffer.alloc(8); c1.writeUInt32LE(js.length, 0); c1.writeUInt32LE(0x4e4f534a, 4);
  const c2 = Buffer.alloc(8); c2.writeUInt32LE(binPadded.length, 0); c2.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([head, c1, js, c2, binPadded]);
}

/** Minimal reader for single-mesh .glb files (ours and simple exports): geometry plus embedded textures. */
export function readGLB(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  const jl = buf.readUInt32LE(12); const json = JSON.parse(buf.toString('utf8', 20, 20 + jl)); const bo = 20 + jl + 8; const bin = buf.subarray(bo);
  const read = (ai) => { const a = json.accessors[ai], v = json.bufferViews[a.bufferView], T = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
    const nc = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type]; const start = (v.byteOffset || 0) + (a.byteOffset || 0);
    const copy = new T(a.count * nc); const src = new T(bin.buffer.slice(bin.byteOffset + start, bin.byteOffset + start + a.count * nc * T.BYTES_PER_ELEMENT)); copy.set(src); return copy; };
  const prim = json.meshes[0].primitives[0]; const out = { positions: read(prim.attributes.POSITION) };
  if (prim.attributes.NORMAL !== undefined) out.normals = read(prim.attributes.NORMAL);
  if (prim.attributes.TEXCOORD_0 !== undefined) out.uvs = read(prim.attributes.TEXCOORD_0);
  const idx = prim.indices !== undefined ? read(prim.indices) : null; out.indices = idx ? Uint32Array.from(idx) : Uint32Array.from({ length: out.positions.length / 3 }, (_, i) => i);
  out.json = json; out.imageBytes = (i) => { const v = json.bufferViews[json.images[i].bufferView]; return bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); };
  return out;
}

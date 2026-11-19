# Atelier: professional 3D in code, without Blender

Atelier is a Node-only 3D pipeline: you describe an object as a signed-distance field (SDF) plus a per-texel material function, and it produces a textured `.glb`, LODs and review renders. No Blender, no WebGL, no network.

## Contents
1. What it is good at, and what it is not
2. The route ladder
3. The pipeline
4. Writing a model file
5. SDF toolbox and recipes
6. Materials and baked detail
7. Characters
8. Silhouettes to mesh (hull)
9. Build, look, fix
10. LODs and sizes
11. Putting the model on a page
12. Verification status and limits

## 1. Good at, and not

Good at: hard-surface products (speakers, bottles, headphones, devices, packaging, furniture, tools), stylised characters and mascots (designer-toy look), logos in 3D, props, simple scenes. Output is clean, watertight, UV-unwrapped, PBR-textured.

Not a Tripo-class generator. A learned text-to-3D model invents arbitrary organic detail (a specific sneaker, an animal's fur, a face, food). Code-defined SDFs cannot. For those, use `07-3d-generators.md`. Be explicit with the user about which route made each model.

## 2. The route ladder

Pick the lowest rung that meets the brief.

1. **Atelier model file** (`build`). Products, props and stylised characters from parameters. Highest control, cleanest topology.
2. **Atelier hull** (`hull`). The user gives front and side silhouettes (or photos with a mask); you get a solid base with projected colour. Good for blocking out bottles, vases, lamps, shoes' rough mass. It cannot recover concavities (a hollow, an undercut).
3. **Generator route** (`07`). The user, or a connected generator, produces the mesh; Atelier cannot ingest foreign meshes. Cleanup is done in the browser with `model3d.mjs --tune` and optional `gltf-transform` (see `07`).
4. **Blender**: only if the user asked for it (`09-blender-on-request.md`).

## 3. The pipeline

SDF field → surface-nets mesh (block-skipping sampler, vertices projected onto the surface, gradient normals) → orientation → field-measured AO and curvature → box-chart UV atlas with shelf packing → per-texel material bake (albedo, ORM, normal map from real heights, glTF convention) → GLB writer (`KHR_materials_clearcoat`) → LODs by vertex clustering, re-snapped to the field → review sheets (six views, beauty, clay).

Why this beats a plain marching-cubes export: the macro shape is soft and filleted because it comes from smooth booleans; the micro detail (perforations, brushed metal, grain, wear) is baked into textures at 1 to 2K, so a 35k to 155k triangle mesh carries detail that would cost millions of triangles; and AO and curvature measured on the field drive cavity dirt and edge wear.

## 4. Writing a model file

```js
export const meta = {
  name: 'speaker', texture: 1024, resolution: 150, bump: 1,
  bounds: [[-0.62, -0.02, -0.62], [0.62, 0.9, 0.62]],   // must contain the whole object with a small margin
  params: { body: '#25262b', ring: '#b9bcc2' },          // overridable with --param body=#111111
};
export default function build({ sdf, params }) {
  const field = /* sdf expression */;
  const materialAt = (ctx, out) => {
    // ctx: { p:[x,y,z], n:[nx,ny,nz], ao, curv }   out: { c:[r,g,b] (0..1), r (roughness), m (metal), h (height, metres-ish) }
  };
  return { field, materialAt };
}
```
Units: roughly metres; keep objects around 1 unit tall. Y is up. The floor is y = 0. Keep the bottom flat if the object sits on a surface.

Two examples ship: `models/speaker.mjs` (hard-surface) and `models/creature.mjs` (character). Copy one and edit.

## 5. SDF toolbox and recipes

Primitives (all return a function `(x,y,z) → distance`): `sphere(r, c)`, `ellipsoid([rx,ry,rz], c)`, `box(half, c, round)`, `capsule(a, b, r)`, `roundCone(a, b, ra, rb)`, `torus(R, r, c, axis)`, `cylinder(r, h, c, round)`, `plane(normal, point)`, `revolve(profilePoints, {round})`.

Booleans: `union`, `intersect`, `subtract(a, ...b)`; smooth versions take the blend radius first: `smoothUnion(k, ...f)`, `smoothSubtract(k, a, ...b)`, `smoothIntersect(k, ...f)`.

Transforms: `translate(f, [x,y,z])`, `scale(f, s)`, `rotate(f, [rx,ry,rz] degrees, pivot)`, `mirrorX`, `mirrorZ`, `stretch(f, [sx,sy,sz])`, `twist(f, k)`.

Shaping: `round(f, r)` (fillet by offset), `shell(f, thickness)` (hollow), `skin(f, depth)` (thin layer inside a surface, used for grooves), `displace(f, fn)`, `repeat(f, axis, spacing, count)`, `polar(f, n)` (radial copies). Noise: `noise3`, `fbm`.

Recipes:
- **Real fillets:** build with `smoothUnion(0.03..0.12, a, b)` instead of `union`; or `round(box(...), 0.04)`.
- **Panel gap or groove:** `smoothSubtract(0.01, body, intersect(torus(...), skin(body, 0.05)))`; the `skin` confines the cut to the surface.
- **Hollow bottle or cup:** `subtract(outer, inner)` with `revolve` profiles; check that wall thickness is at least 2 cells (see `resolution`).
- **Lathe objects:** `revolve([[r0,y0],[r1,y1],...], {round})` for bottles, vases, lamps, glasses.
- **Symmetric characters and products:** model one side, wrap in `mirrorX`.
- **Repeated features:** `polar(f, 12)` for vents, `repeat(f, 'x', 0.1, 8)` for ribs.
- **Organic variation:** add `displace(f, (x,y,z) => 0.01 * fbm(x*6,y*6,z*6,3))`; keep amplitudes small so the mesher does not alias.

Resolution rules: `resolution` is cells along the longest bounds side. Features thinner than about 2 cells vanish or tear; raise `resolution` (up to roughly 200) or thicken the feature and carve the fine detail in the material bake instead. Always check the clipped-bounds warning.

## 6. Materials and baked detail

`materialAt` is called for every texel with the surface point and measured field data. Fill `out.c` (albedo), `out.r` (roughness), `out.m` (metal 0 or 1; avoid in-between values except at transitions) and `out.h` (height used to derive the normal map).

What makes it read as real:
- **Roughness varies.** Never a constant. Add fine noise (`fbm` at high frequency) and raise roughness in cavities (`1 - ctx.ao`).
- **Wear on convex edges:** `max(0, ctx.curv - threshold)` lightens colour and lowers roughness along edges, as burnished or chipped paint.
- **Dirt in cavities:** darken albedo by `(1 - ctx.ao) * 0.2..0.3`.
- **Micro patterns through height:** perforation grids, knurling, brushed lines, stitching, orange-peel grain. Height is in the same units as the model: 0.001 to 0.007 is visible; larger will look embossed.
- **Metals:** `m = 1`, albedo as the reflectance colour, roughness 0.25 to 0.45 for brushed or satin.
- **Clearcoat:** add `clearcoat: 1` (and optionally `clearcoatRoughness: 0.08`) to the model's `meta` for lacquered surfaces (car paint, glossy plastic); the GLB then carries `KHR_materials_clearcoat`. It applies to the whole model.
- **Emissive and LEDs:** keep as bright albedo with low roughness; real emission is added in the web scene (bloom).

## 7. Characters

Designer-toy characters read well because the form is simple and the finish is rich.
- Build from ellipsoids and roundCones joined with `smoothUnion` at 0.05 to 0.18 radius; larger blends for neck and limbs, smaller for ears and tail.
- Model one side with `mirrorX`; add asymmetry only in the material (a scuff, a mark).
- Eyes: separate spheres inside sockets, `union`-ed after the smooth blend so they stay crisp; give them low roughness and a dark albedo, with a highlight bake if wanted.
- Colour regions: paint from position (belly, cheeks, inner ears) with soft edges using `clamp`.
- Finish: vinyl or soft-touch roughness 0.45 to 0.65, cavity darkening, no metalness.
- Proportions: big head (about 40 percent of height), short limbs, wide stance; check the silhouette in the clay sheet first.

## 8. Silhouettes to mesh (hull)

```bash
node atelier.mjs hull front.png side.png [top.png] --height 1 [--section round|box|N] [--front-color front.png] [--back-color back.png] [--name bottle] [--smooth 0.02]
```
Inputs are PNGs (8-bit, non-interlaced) with a clear subject: either an alpha channel or a plain background. Each silhouette becomes an extruded signed-distance shape; the shapes are combined with a smooth intersection. Without a top view, a superellipse cross-section (`--section`) decides whether the object is round, box-like, or in between (`N` is the exponent). `--front-color` and `--back-color` project colours onto the front and back, and `bleed` fills the seams, so photos become albedo.

Rules:
- Front and side views must share the same vertical extent and be orthographic; perspective photos give distorted bases.
- Use a top view for anything not roughly round or box-like.
- The visual hull cannot recover hollows, handles' holes seen only from the top, or undercuts. State that to the user.
- Treat the result as a base: refine in a model file (copy the hull into a field) when quality matters.

## 9. Build, look, fix

```bash
node atelier.mjs build models/speaker.mjs --lods 40000,12000
node atelier.mjs build models/speaker.mjs --draft              # fast low-res pass while iterating
node atelier.mjs build models/speaker.mjs --param body=#2b3a55 --res 180 --tex 2048
node atelier.mjs preview .apex/models/speaker.glb --clay
```
Outputs in `.apex/models/`: `<name>.glb`, `<name>-lodN.glb`, `<name>-views.png`, `<name>-beauty.png`, `<name>-clay-views.png`, `<name>-albedo.png`, `<name>-normal.png`, `<name>-report.json`.

Review loop (do this every round, in this order):
1. **Clay sheet first.** Silhouette from all six angles: proportion, stance, symmetry, any tearing or missing thin parts.
2. **Views sheet.** Colour regions, material separation, where wear and dirt sit.
3. **Beauty shot.** Overall impression and lighting read.
4. Look at `<name>-normal.png` for aliasing or stray stripes.
5. Fix the top two problems, rebuild, repeat. After three rounds, ship with the remaining issues listed.

A warning "N vertices touch meta.bounds: CLIPPED" means part of the object is cut off by the bounds: enlarge them and rebuild.

The previewer is a software rasteriser meant for review. It does not do image-based lighting, so metals look flatter than in Three.js. Judge final lighting in the browser render from `incridible-skill-3d`.

## 10. LODs and sizes

`--lods 40000,12000` writes decimated meshes by vertex clustering, re-snapped onto the field so silhouettes stay faithful. Typical targets: hero 40k to 120k triangles on desktop; 12k to 25k for mobile and secondary objects. Textures: 2048 for hero, 1024 otherwise. Typical GLB size at 1K is a few MB; check `report.json` for the actual numbers and quote them in the final report.

## 11. Putting the model on a page

- Single object: `$I3D/assets/three/stage.js` loads a `.glb` from `data-model`, with orbit, scroll and cursor options per its README. Copy `three/` and `components/` next to the page.
- Full-page scenes: `three/director.js` (it does not load GLBs by itself; use the stage or load with `GLTFLoader` and register the object).
- With plain Three.js: `GLTFLoader`; the GLB uses standard `pbrMetallicRoughness`, a single ORM texture (occlusion R, roughness G, metallic B) and `KHR_materials_clearcoat`, which the loader supports.
- Lighting: use an environment map (HDR) plus one soft key; add a contact shadow plane; avoid default lights.
- Always supply a still (`*-beauty.png`) as poster, `alt` text, and Open Graph image. Under reduced motion, show the poster.

## 12. Verification status and limits

Verified in this environment: self-test (`node selftest.mjs`: PNG round trip, hull geometry, speaker build and GLB read-back), software renders of the shipped models, round bottle from two silhouettes.

Not verified here: loading the GLBs in a real WebGL viewer. The normal-map green-channel direction follows the glTF convention and was checked by math and software rendering only; if bumps look inverted in the browser, flip the green channel (`out.h` sign or the bake option) and tell the user.

Known limits: no foreign mesh ingestion; no remeshing or retopology of external models; no rigging or animation export (animate transforms in the page); hull cannot recover concavities; very thin features need higher resolution; procedural organic detail is limited to what you can express as fields and noise.

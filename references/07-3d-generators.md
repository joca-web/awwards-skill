# Generators and Tripo-class results

Tripo and similar services use learned generative models to produce a textured mesh from a prompt or a photo. Atelier cannot match that on arbitrary organic or exact-product subjects, and this file is the honest route for them.

## Contents
1. Which route for which subject
2. Getting a generated mesh
3. Cleanup without Blender
4. Reducing triangles without Blender
5. Placing and finishing on the page
6. What to tell the user

## 1. Which route for which subject

| Subject | Best route |
|---|---|
| Product from parameters, packaging, devices, furniture, props | Atelier model file |
| Stylised mascot or character, designer toy | Atelier model file |
| Rough mass from silhouettes (bottle, vase, lamp) | Atelier hull, then refine |
| Specific real product from photos | Generator (image-to-3D), or hull for a base |
| Animals, people, faces, plants, food, fabric, sneakers | Generator |
| Scenes and environments | Atelier for props; sky, water and particles in the web scene (`$I3D`) |

## 2. Getting a generated mesh

Options, in order of preference:
1. **The user supplies a `.glb`** exported from their generator (Tripo, Meshy, Rodin, Hunyuan3D, Luma, etc.). Ask for GLB, not FBX or OBJ, and for the "low-poly" or "quad" option if the service offers it.
2. **A connected generation tool.** Search the available connectors and tool catalogues for image-to-3D or text-to-3D (for example through `mcp__treg__catalog_search`). If one exists, show its price and parameters before calling it, and check the user's license terms for the output.
3. **Atelier hull** from photos, as a stand-in, with the limits in `06`.

Never claim the generator output came from Atelier.

## 3. Cleanup without Blender

For a `.glb` you did not build:
- Inspect it with `readGLB` from `scripts/atelier/lib/glb.mjs` (triangle count, textures, extensions) or with `gltf-transform inspect` when the package is available.
- Clean it with `$I3D/scripts/model3d.mjs`: `node model3d.mjs shoe.glb --tune --tune-size 1` centres the model, grounds it, scales it and normalises materials, and writes `<name>-tuned.glb` (needs Chrome and three, as the incridible-skill-3d README describes). This handles most "model looks wrong in the scene" problems: too shiny, too dark, wrong scale, floating. Orientation problems may still need a rotation in the page.
- Check texture size (resize to 2048 or 1024 for the web), colour space, and double-sided materials.

## 4. Reducing triangles without Blender

Atelier does not remesh foreign meshes. Options:
- Ask the generator for a lower-poly or quad-remeshed export.
- `gltf-transform` (needs a network install): `gltf-transform simplify in.glb out.glb --ratio 0.25 --error 0.001` (meshoptimizer), then `gltf-transform optimize` for dedupe, texture compression (WebP or KTX2) and Draco/Meshopt.
- If packages are not installable here (network off), say so and give the user the exact command to run; do not fake the result.

## 5. Placing and finishing on the page

Same as `06` §11: `stage.js` with `data-model`, environment map, contact shadow, poster still, reduced-motion fallback. Generated models usually need `--tune` for scale and grounding, and a lower texture size.

## 6. What to tell the user

Say plainly: "Atelier built X in code; Y came from a generator because it is an organic shape that code cannot match", and list for each model the route, triangle count, file size, and any known artefacts. If the user expected Tripo-quality organic output from code alone, correct that expectation early, before the work.

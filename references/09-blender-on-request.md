# Blender, only on request

Apex is built so that Blender is never needed. The default for every 3D task is Atelier (`06`) or a generator (`07`).

## The rule
Use Blender only when the requester explicitly asks for it: names Blender, a `.blend` file, `bpy`, or a Blender workflow in their own message. Do not use, install, mention as a recommended step, or add it as a "better quality" option on your own initiative. If a user asks "can you improve this", the answer is not "open Blender".

## When the user does ask

1. Confirm what they want from Blender in one line (build the model, retopologise a generated mesh, render, bake, export).
2. Check that it is available: `which blender` or `blender --version`. In this cloud workspace it is usually not installed and package installs may be blocked; if so, say it plainly and offer the options below.
3. If available, run it headless (`blender -b -P script.py`), write the script to a file, keep the `.blend` and the exported `.glb`, and report what the script did. Export GLB with `export_apply=True`, Y-up, and compressed textures only when asked.
4. Verify the result the same way as any other model: clay and views sheets, triangle count, loading in the page.

## When Blender is unavailable
Say so, then offer: a Blender script they can run on their machine (`bpy` file), the Atelier route for the same object, or a generator route. Do not pretend a render came from Blender.

## When the user supplies a `.blend`
A `.blend` as an input is not permission to use Blender. Ask them to export a `.glb`, or to confirm they want Blender used. Once they choose, follow the matching route.

## What does not need Blender, even for professional results
Modelling products and characters, UVs, PBR texture baking, normal maps, LODs, GLB export, preview renders, silhouette-to-mesh: all of this is in Atelier. Retopology of foreign meshes is the one thing code-only cannot do; use generator-side low-poly exports or `gltf-transform simplify` before reaching for Blender.

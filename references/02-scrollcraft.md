# Scroll craft

Scroll is the timeline of the page. A good scroll experience has a story shape, one signature device, supporting devices that differ section by section, a budget, and a fallback. The approach follows the idea behind scroll-storytelling skills (plan beats first, then pick devices); the devices below map to components that already exist in `incridible-skill-3d`.

> **Going further.** For a scroll experience in its own right (scrubbed video, pinned acts, a layered hero, a page that must not look like a template) also read `11-scroll-craft-engine.md`: the upstream scroll-craft method (eight page grammars, signature move, fingerprint gate, feeling curve) and its dependency-free engine. Use this file for beats, devices, budgets and fallbacks; use that one to decide the page's shape and to drive it without GSAP. Controls and micro-interactions follow `10-ui-motion-craft.md`.

## Contents
1. Beats before layout
2. Page structures
3. Scroll devices (and which component makes each)
4. Pinning and scrub rules
5. Frame sequences and video
6. 3D driven by scroll
7. Budgets
8. Mobile, reduced motion, fallbacks
9. Pitfalls

## 1. Beats before layout

Write 5 to 9 beats. Each beat is one line: scroll position, what the visitor should feel or learn, the device, and the exit.

```
0%   Arrive   : name at poster scale, object idle              device: load-in + cursor tilt
15%  Promise  : one sentence, object rotates to the side        device: pinned text + 3D scrub
35%  Proof    : three facts with numbers                        device: stacking cards
55%  Detail   : close-up of the material                       device: camera dolly into the model
75%  People   : photographs, uneven                            device: horizontal drag gallery
100% Act      : one button, nothing else                        device: expanding media into CTA
```

Rules: an arrival beat that works with zero scroll; at most one pinned beat in a row; a quiet beat after every loud one; the final beat is a single action.

## 2. Page structures

| Structure | Use for | Shape |
|---|---|---|
| Linear chapters | Brand and launch sites | Pinned hero, chapters of one idea each, closing action |
| Object tour | A single product | Sticky 3D object; text sections scroll past while camera and pose change |
| Horizontal rail | Portfolios, collections | Vertical scroll drives a horizontal track; each card has its own reveal |
| Zoom corridor | Place, scale, "inside of" stories | Each section is a deeper zoom into the previous one |
| Editorial flow | Journalism, long reads | No pins; curtains and image reveals; type does the work |
| Data story | Reports | One chart, state changes per step (scrollama pattern) |
| Split screen | Comparison, before and after | Two columns scroll in opposite directions, meet in the middle |

## 3. Scroll devices

Components live in `$I3D/assets/components/` (see `$I3D/references/09-components.md` for the exact attributes). Pick one primary device per beat.

| Device | Effect | Notes |
|---|---|---|
| Split-text reveal | Lines, words or characters rise on a mask | Reveal by line for headlines, never per letter on body |
| Scramble | Text resolves from glyph noise | Short labels only |
| Pinned text | Section pins while words highlight in sequence | Pin length 150 to 250 vh |
| Stacking cards | Cards stack and scale back | Good for proof points |
| Horizontal track | Vertical scroll becomes horizontal travel | Pin the section; give cards different speeds |
| Expanding media | Small image grows to full bleed | Use as a bridge between sections |
| Parallax layers | Layers move at different rates | Keep to 2 or 3 layers; 10 to 20 percent speed difference |
| Image trail / cursor | Pictures follow the pointer | Pointer devices only |
| SVG draw | Paths draw with scroll | Logos, diagrams, routes |
| Flip filter | Grid re-sorts with a smooth transition | Catalogues |
| Page transition | Curtain or morph between routes | Needs a router; keep under 900 ms |
| Shader / distortion | Image reacts to scroll velocity or pointer | WebGL; poster fallback |
| Camera dolly (3D) | Camera moves along a path through a scene | `three/director.js` |
| Object scrub (3D) | Model rotates or explodes with scroll | `three/stage.js` plus scroll timeline |

Never stack two loud devices in the same viewport. Pair a loud device with a still one.

## 4. Pinning and scrub rules

- Use `ScrollTrigger` with `scrub: 0.5` to `1` for smoothing; `scrub: true` feels glued and harsh.
- Pin with a spacer (`pin: true, pinSpacing: true`) and verify document height afterwards. Refresh after fonts and images load (`ScrollTrigger.refresh()` on `load` and after `document.fonts.ready`).
- One smooth-scroll instance (Lenis) per page, tied to the GSAP ticker; native scroll for anything inside modals or inner scrollers (`data-lenis-prevent`).
- Animate transform and opacity only. Do not scrub layout properties.
- Anchor links must still work with the smooth-scroll layer.
- Easing: `power2.out` or `expo.out` for reveals, `none` for scrubbed travel, `power3.inOut` for transitions between states.

## 5. Frame sequences and video

For photoreal object rotation or a fly-through that must look cinematic, a frame sequence on a canvas beats video scrubbing, because video seeking is not frame-accurate on many browsers.

- Render or export 60 to 180 frames, WebP at roughly 1280 px wide, named in order; preload the first 8 frames, stream the rest.
- Draw with `requestAnimationFrame`, map `progress → frame index`, use `drawImage` onto a canvas sized to the device pixel ratio capped at 2.
- Budget 2 to 6 MB total for a hero sequence; if heavier, drop frame count before dropping resolution.
- Atelier can render the frames: use the preview renderer for review only; for production frames, render from Three.js in `$I3D` with `shoot.mjs`/`render.js`.
- Always provide a poster (first frame) as an `<img>` so the page reads before the sequence loads.

## 6. 3D driven by scroll

- Single model on a sticky stage: drive rotation, camera distance and material parameters from one timeline, not from many listeners.
- Full-page scene: `three/director.js` owns the canvas, and sections declare shots with `data-` attributes.
- Models over 1 MB: load a lower LOD first (Atelier `--lods`), swap when idle.
- Keep a still render (`*-beauty.png`) as the `<img>` fallback and as the Open Graph image.

## 7. Budgets

- Moving elements on a normal scroll: at least 8, but only one or two loud ones per viewport.
- Total pinned height: under 6 viewports on the whole page for non-cinema directions.
- Largest contentful paint under 2.5 s on a mid phone profile; no layout shift from late fonts (use `font-display: swap` and size-adjust fallbacks).
- GLB: under 3 MB for hero (use LODs), textures 2K maximum on desktop, 1K on mobile.
- Total JS under 300 KB gzip excluding Three.js when 3D is present.

## 8. Mobile, reduced motion, fallbacks

- Design the 390 px layout as its own composition: fewer pins, bigger type, one device per screen.
- Disable pointer-only devices (trails, tilt) when `(hover: none)`.
- `prefers-reduced-motion: reduce`: no scrub, no pins; sections render in final state; reveals become simple fades or nothing; 3D shows the still.
- Content that matters must exist in the DOM as real text, not only inside canvas.
- Provide `aria-label` for decorative canvases or mark them `aria-hidden` with adjacent text.

## 9. Pitfalls

- Fade-up on every element at the same timing: vary distance, duration and stagger by element role.
- Scroll-jacking that traps the visitor: never hijack wheel speed beyond smoothing; never block keyboard and touch scrolling.
- Long pinned sections with nothing new happening: if a pin lasts more than two screens, something must change every screen.
- Re-measuring on resize without `invalidateOnRefresh`: pinned values go stale.
- Forgetting to kill triggers on route change.

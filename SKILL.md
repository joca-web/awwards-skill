---
name: awwards-skill
description: Top layer over incridible-skill and incridible-skill-3d for premium, award-level websites and professional 3D. Every site starts on Meta's Astryx design system, with a preloader before the hero, GSAP + Lenis smooth scroll (Motion/Framer Motion in React apps), page transitions, professional buttons and a Three.js hero (working starter in assets/starter). Also includes a taste engine (anti-slop gate), scroll craft (plus the vendored scroll-craft engine), UI motion craft (Emil Kowalski), graft, graphify, other design systems on request (Apple, Google, Fluent 2, Atlassian, Salesforce) with a selector, and Atelier, a code-first 3D studio (SDF, PBR, .glb) with no Blender. Use for Awwwards-level, immersive or scroll-driven sites, preloaders, smooth scroll, page transitions, Three.js heroes, any 3D product or .glb, and phrases like "site nível awwwards", "modelo 3d profissional", "sem Blender", "taste", "scroll craft", "emil", "graft", "graphify", "astryx". Blender is used only if the user explicitly asks.
---

# Awwards Skill

A site or a 3D model looks professional when a long list of decisions were made on purpose: one idea, one design system, one story told by scroll, objects lit and textured like a photographer would, and a gate that refuses to ship anything that fails. This skill is the layer that makes those decisions and checks them. It does not replace the engines underneath; it drives them.

**It sits on top of two skills you must load first** (Skill tool): `incridible-skill-3d` (components, starters, Three.js stage and director, `shoot.mjs`, `model3d.mjs`) and `incridible-skill` (same web engine, older starters). Their folders are where the listing says they are; below, `$I3D` is the incridible-skill-3d folder, `$APEX` is this folder. If they are not installed, say so and continue with this skill's own parts (selector, tokens, Atelier, codegraph, contrast check), because those work alone.

## What this adds on top

| Layer | What it is | Where |
|---|---|---|
| **Taste** | Inventory, three dealt directions, one idea sentence, imagery order, a scored anti-slop gate | `references/01-taste.md` |
| **Scroll craft** | Beats, page structures, scroll devices (pins, wipes, frame sequences, 3D camera), budgets, fallbacks. Plus the full upstream scroll-craft method (eight page grammars, signature move, fingerprint gate, feeling curve) and its dependency-free engine | `references/02-scrollcraft.md`, `references/11-scroll-craft-engine.md`, `vendor/scroll-craft/` |
| **UI motion craft** | How controls, menus, popovers, toasts and drags move: when to animate at all, easing, durations, press feedback, interruptibility, review and audit skills (Emil Kowalski) | `references/10-ui-motion-craft.md`, `vendor/emilkowalski-skills/` |
| **Graft** | Bring a feature from a public GitHub repo into the project only after a licence, stack, scope, quality and maintenance gate | `references/03-graft.md` |
| **Graphify** | Map a site or repo into a graph before redesign or graft; real Graphify when available, `scripts/codegraph.mjs` offline | `references/12-hero-motion-system.md` | Every new site: order of events, preloader, Lenis, GSAP, page transitions, buttons, Three.js hero, the Astryx design pass |
| `references/13-motion-react.md` | A React app: Motion for React (Framer Motion) patterns on the same kit and tokens |
| `assets/starter/`, `scripts/new-site.mjs` | Phase 5: the working kit, scaffolded into the project |
| `references/04-graphify.md` |
| **Six design systems** | Apple, Google, Fluent 2, Atlassian, Salesforce and Meta's Astryx as one token contract, plus a selector and a "borrow mechanisms, never identity" rule | `references/05-design-systems.md`, `references/ds/*.md`, `assets/design-systems/*/tokens.css` |
| **Atelier (3D)** | Code-first 3D: signed-distance modelling, field-measured AO and curvature, UV atlas, baked albedo / ORM / normal maps, LODs, silhouette-to-mesh, .glb, software preview. Node only, no Blender | `references/06-3d-atelier.md`, `scripts/atelier/` |
| **Generators** | The honest route to Tripo-class organic models: a generator service, then cleanup and placement | `references/07-3d-generators.md` |
| **Gate** | One scorecard that must pass before anything is reported done | `references/08-qa-gate.md` |

## Rules that decide the result

1. **Decide first, write the decision down.** Create `.apex/decisions.md` early: the idea sentence, the direction, the design system and what is borrowed, the scroll beats, the 3D route per object. A skill that produces polished pixels without recorded decisions drifts into the template look by the third section.
2. **Astryx first, always; another system only when the user asks.** Every build starts on Meta's Astryx (`assets/design-systems/astryx/`), with no selector run and no question about it. If the person does not like the result, or names another system ("muda o design system", "quero Apple", "make it Fluent"), switch: a named system is used as named; an unnamed "I don't like it" runs `pick-design-system.mjs --exclude astryx`, offers the top two or three in one line each, and applies the pick. The one exception is a site or repo that already has its own design system or brand tokens: keep those and say so. Astryx is used well, not just used: run the design pass in `references/12-hero-motion-system.md` §8 (up to three directions inside Astryx: theme, template, accent, density; look at each; pick one; record why the others lost). Exactly one system owns the identity at a time; swapping means replacing one `tokens.css`. Other systems lend mechanisms (state layers, focus rings, table patterns), restated in the primary's tokens. Mixing two systems' colours, fonts or radii is the fastest way to look unfinished.
3. **Every site ships the kit, in this order.** A cover (preloader on a fresh load, page curtain when arriving from another page) is always up before the first hero section; every start state is set behind it; the hero intro plays under the lifting cover; then smooth scroll (one Lenis instance on the GSAP ticker) and scroll-driven GSAP motion take over. Add professional buttons (all states, press, hover-gated label roll and fill, magnetic on the main call to action), a professional page transition (curtain or native View Transitions) and one engineered Three.js hero with a fallback. Start from `node $APEX/scripts/new-site.mjs <dir>` and `references/12-hero-motion-system.md`. In a React app (Vite, Next.js, Remix, an Astryx React app) the components animate with Motion for React (Framer Motion, `references/13-motion-react.md`) instead of GSAP, with the same order of events and rules; never two animation engines on one element. A pure product UI keeps the cover and a short intro and may drop the 3D hero. Reduced motion shows everything at once.
4. **Brand sites split the work: the system owns the systemic layer, the art direction owns the hero.** Type scale, spacing, forms, focus, states come from the system. The hero, imagery, signature moment and motion personality come from the idea. A site that looks like a design-system demo does not win awards; one that ignores the system fails usability.
5. **The page is a story told by scroll.** Plan beats before layout (`02-scrollcraft.md`; for a scroll experience in its own right add `11-scroll-craft-engine.md`). One signature device, a different supporting device per section, never one effect repeated down the page.
6. **Controls move by their own rules.** Whatever the visitor operates (hover, press, menus, dialogs, toasts, drags) follows `10-ui-motion-craft.md`: first ask whether it should animate at all, then strong ease-out, under about 300 ms. The story may be slower; the controls may not.
7. **Content is never hidden by animation, and every 3D thing has a fallback.** Poster, `aria-label`, static layout that reads with JavaScript off, reduced-motion path. This rule comes from `incridible-skill` and stays.
8. **Look at the 3D before you ship it.** Run the Atelier build, open the six-view sheet and the clay sheet every round. Shape problems hide under textures, so judge the clay first.
9. **Blender is off unless the user asks for it.** Never use it, install it or suggest it as an optimisation step on your own. If the user's own request names Blender, a `.blend` file or `bpy`, follow `references/09-blender-on-request.md`. A `.blend` supplied as an input is not permission to open Blender: ask for a .glb export or an explicit yes.
10. **Be honest about the ceiling.** Atelier makes products, characters and props to a high standard from code, and turns silhouettes and photos into solid bases. It does not reproduce a learned text-to-3D generator such as Tripo on arbitrary organic subjects (a specific sneaker, a face, an animal, food). For those, use the generator route and say which route made each model.
11. **Prove it.** Real browser, real libraries, real wheel input for the page; real renders and the self-test for the model; contrast audit for the tokens. Fix every FAIL, then report what was and was not verified.

## Pick the route

| The user gives you | Do |
|---|---|
| A brief, or only a topic | New build: phases 0 to 7 |
| A screenshot, Figma frame or photo of a design | Phase 0, then `$I3D/references/02-image-to-code.md`, then phases 2 to 7 |
| An existing site or repo to improve | Graphify it (phase 0), record "before" with `shoot.mjs`, keep stack, content, routes, then phases 1 to 7 |
| "Use this feature from github.com/..." | Graft (`03-graft.md`) with its gate, then phase 5 |
| A product, character, prop or scene in 3D | `06-3d-atelier.md`: pick the route ladder, build, look, fix; place it with `$I3D` stage or director |
| A real product, a face, an animal, a very specific shoe | `07-3d-generators.md`: their file, or a generator, then cleanup; be explicit about it |
| Only a design system ("make this look like Fluent", "use Astryx") | `05-design-systems.md`: use the one named (Astryx if none), skip art-direction phases. For Astryx in a React 19 app, `ds/astryx.md` also covers the real packages |
| A preloader, smooth scroll, GSAP intro, page transition, buttons or a Three.js hero (every new site needs them) | `12-hero-motion-system.md`, scaffold with `scripts/new-site.mjs`, then adapt |
| A React app, or the words "framer motion", "motion/react", "AnimatePresence", "layoutId" | `13-motion-react.md` |
| A scroll experience: video that scrubs, pinned acts, a layered hero, "this looks like a template" | `11-scroll-craft-engine.md` (method and engine), with `02-scrollcraft.md` for beats and budgets |
| Interaction polish, animating a component, a review or audit of motion, "it feels off", a phone that feels like a website | `10-ui-motion-craft.md`, then the one vendored Emil skill it points to |
| A site they admire | `$I3D/references/07-reference-teardowns.md`: borrow technique and structure, never photos, logos, text, names or characters |

Work in the user's stack when one exists. Without one, start from a starter in `$I3D/assets/starters/` (monument, editorial, product-3d, cinematic-3d), copy `components/` and `three/` next to it as that README says, and restyle it fully.

## Workflow

### Phase 0: Intake, map, reuse
Classify the request with the table above and ask at most one question; otherwise state the assumption and go on. If code exists, run `node $APEX/scripts/codegraph.mjs <dir>` and read `GRAPH_REPORT.md` (entry points, hubs, broken references, dead tokens, libraries) before editing. If the user points at a repo to reuse, run the Graft gate first.

### Phase 1: Taste
Follow `01-taste.md`: inventory 8 to 12 specifics only this client has, deal three directions, pick one, write the idea sentence ("On this page, [something that belongs to the subject] becomes [the device the direction calls for]") and plan one signature moment. Choose imagery by the order in that file. Write all of it to `.apex/decisions.md`.

### Phase 2: Design system
Default: **Astryx**. Copy `assets/design-systems/astryx/tokens.css`, `fonts.css` and `fonts/` into the project, read `references/ds/astryx.md`, load the tokens before your own CSS and build everything from `--ds-*` variables. Run the **Astryx design pass** (`references/12-hero-motion-system.md` §8): three directions inside Astryx (theme, template or page grammar, accent, density, hero scale, 3D palette), a hero and one section of each, screenshots at 1440 and 390 in light and dark, a 0 to 2 scorecard, one pick, and why the others lost. Record in `.apex/decisions.md`: "Astryx (default)", the three directions, the pick, and what art direction overrides (usually the hero and a brand accent, then re-run the contrast check). Do not run the selector and do not ask which system the person wants.

**When the person asks to change it** (dislikes the look, or names another system):
- Named system: copy that system's `tokens.css`, read its `references/ds/<id>.md`, rebuild from the same `--ds-*` variables, and note "changed from Astryx on request" in the decisions.
- Not named: `node $APEX/scripts/pick-design-system.mjs --type <t> --audience <a> --density <d> --tone <t> --motion <m> --3d <yes|no> --ambition <awwwards|standard> --exclude astryx` (add `--stack react` for a React app). Types: marketing, portfolio, ecommerce, saas-app, dashboard, admin, docs, crm, devtools, collab, media, fintech, healthcare, education, mobile-web. Show the top two or three with one line of why, apply the first unless the person picks another, and record the runner-up and the borrowed mechanisms. When the confidence line says "low", it is a near tie: decide from the brand and write down why.
- After any switch, re-run `scripts/contrast-check.mjs` on the tokens in use.

### Phase 3: Scroll architecture
Write the beats (what the visitor should feel and learn at each scroll stage), choose the page structure and one device per beat from `02-scrollcraft.md`, and decide where 3D, video or frame sequences earn their weight. For a scroll experience, add the upstream method from `11-scroll-craft-engine.md`: the eight questions, one of eight page grammars, a signature move, the fingerprint gate and a feeling curve with one peak. Plan mobile as its own composition.

### Phase 4: Assets
- **Pictures and footage:** order in `01-taste.md`. Credits stay on the page.
- **3D:** for each object choose a rung of the ladder in `06-3d-atelier.md` and build it with Atelier (`node $APEX/scripts/atelier/atelier.mjs build <model.mjs>`), or follow `07-3d-generators.md`. Look at `*-views.png` and `*-clay-views.png`; fix; repeat. Export `.glb` plus LODs.

### Phase 5: Build in layers
Scaffold with `node $APEX/scripts/new-site.mjs <dir>` (the starter has the cover, intro, Lenis, transition, buttons and the Three.js hero already wired; replace every `TODO(content)`). Static first (semantic HTML, real copy, tokens, responsive), then motion (components from `$I3D/references/09-components.md`, custom GSAP only for the signature moment), then 3D (`$I3D/assets/three/stage.js` takes a `.glb` directly in `data-model`; the cinematic director for full-page 3D), then polish (hover, focus, empty and error states, favicon, OG image, 404), with every control built to `10-ui-motion-craft.md`. Motion budget: at least 8 elements move on a normal scroll, but only 1 or 2 things are loud in any viewport.

### Phase 6: Gate
Run everything in `08-qa-gate.md` (including the kit checks in `12-hero-motion-system.md` §10): the inspector from `$I3D/scripts/shoot.mjs` (or scroll-craft's, if the page uses that engine) at three widths with real input, the motion review from `10-ui-motion-craft.md`, `scripts/contrast-check.mjs` on the tokens, the Atelier self-test and model reports, and the scorecard. Fix every FAIL, shoot again, up to three rounds.

### Phase 7: Report
Short and honest: direction and idea sentence, design system and what was borrowed, the scroll beats, 3D route per model with triangle count and size, final inspector numbers, what is placeholder, credits, and anything not verified (for example "WebGL smoothness measured only in software rendering"). No recap of every step.

## Atelier in one screen

```bash
node $APEX/scripts/atelier/selftest.mjs                                   # 20 seconds: proves the pipeline works here
node $APEX/scripts/atelier/atelier.mjs build models/speaker.mjs --lods 40000,12000
node $APEX/scripts/atelier/atelier.mjs hull front.png side.png [top.png] --height 1 --front-color front.png --section round
node $APEX/scripts/atelier/atelier.mjs preview some-model.glb
```
Outputs per model: `.glb` (albedo, ORM and normal maps embedded), `-lodN.glb`, `-views.png` (front, 3/4, side, back, 3/4, top), `-beauty.png`, `-clay-views.png`, `-albedo.png`, `-normal.png`, `-report.json`. The previewer is a review tool; the production look comes from Three.js `render.js` in `$I3D`. A WARNING that vertices touch `meta.bounds` means the model is clipped: enlarge the bounds.

## Bundled resources

| File | Read when |
|---|---|
| `references/01-taste.md` | Phase 1, and for the anti-slop scoring |
| `references/02-scrollcraft.md` | Phase 3 and any scroll-driven section |
| `references/03-graft.md` | Reusing code from a public repo |
| `references/10-ui-motion-craft.md` | Any interactive component, animation, motion review; routes to the vendored Emil Kowalski skills |
| `references/11-scroll-craft-engine.md` | Scroll experiences: the upstream method, the engine, the fingerprint gate, paid-API rules |
| `references/04-graphify.md` | Existing site or repo; before a redesign or graft |
| `references/05-design-systems.md` | Phase 2: the contract, selection, borrowing, licensing of fonts and marks |
| `references/ds/apple.md`, `google.md`, `fluent2.md`, `atlassian.md`, `salesforce.md`, `astryx.md` | The chosen primary, and the systems you borrow from |
| `references/06-3d-atelier.md` | Any 3D model: ladder, SDF recipes, baking, materials, characters, hulls, LODs, web handoff |
| `references/07-3d-generators.md` | Organic or exact-product models; Tripo-class results |
| `references/08-qa-gate.md` | Phase 6 and 7 |
| `references/09-blender-on-request.md` | Only when the user asks for Blender |
| `assets/design-systems/<id>/tokens.css` | Shipped into the project (one of six; Astryx also has `fonts.css` and `fonts/`) |
| `vendor/` | Third-party material kept unchanged with its licence: `emilkowalski-skills/`, `scroll-craft/` (method, engine, harness), `astryx/` (design records and the Neutral theme). Read `vendor/README.md` first; licences in `THIRD_PARTY_NOTICES.md` |
| `scripts/pick-design-system.mjs`, `contrast-check.mjs`, `codegraph.mjs` | Phases 0, 2, 6 |
| `scripts/atelier/` | `atelier.mjs`, `selftest.mjs`, `lib/` (sdf, mesher, meshops, bake, glb, raster, hull, png), `models/` (speaker, creature) |

## Taste calls that separate 8s from 9s

- Scale contrast: one thing huge, the rest small. Timid type is the fastest tell.
- Light and texture the object before judging it; judge the silhouette in clay first.
- Spend the accent colour like money.
- Three well-chosen components beat twelve.
- Brand voice in micro-interactions: loader labels, cursor text, hover captions.
- Rhythm: alternate dense and empty, loud and quiet, dark and light.
- Edit hard: remove the third animation on a section, the fourth weight, the fifth colour.
- Details nobody asked for: focus ring, selection colour, favicon, `theme-color`, a real 404, empty and error states that have a voice.

# The default build: Astryx, preloader, smooth scroll, GSAP, transitions, buttons, Three.js

Every site made with this skill starts from the same professional kit. It is not optional decoration: it is the order of events, the scroll engine, the page-to-page transition, the buttons and one 3D moment, all built on the Astryx tokens. The working code is in `assets/starter/`; scaffold it with `node scripts/new-site.mjs <dir>`.

## Contents
1. The order of events (the rule)
2. Preloader and intro
3. Smooth scroll
4. GSAP, used professionally
5. Page transitions
6. Buttons
7. The Three.js hero
8. The Astryx design pass: find the best design inside Astryx
9. Starter, scaffold, and how to adapt it
10. Gate checks, and what was verified

> React app? The same rules apply with Motion for React (Framer Motion) as the engine for components: see `13-motion-react.md`. This file's starter is plain HTML, CSS and JS.

## 1. The order of events (the rule)

1. **A cover is always up before the first hero section is seen.** Fresh load: the preloader. Arriving from another page of the site: the page curtain. Never a bare hero popping in.
2. **Behind the cover, every start state is set** (hidden lines, faded buttons, intro value of the 3D scene), so nothing flashes when it lifts.
3. **The hero intro plays under the lifting cover** (it starts about 60% into the wipe) and scrolling unlocks when it ends.
4. **Then** smooth scroll and scroll-driven motion take over.

Applies to every site with a hero. A pure product UI (dashboard, admin) keeps the cover and a short intro but may drop the 3D hero and the marquee; say so in `.apex/decisions.md`.

## 2. Preloader and intro

- It is part of the brand voice (brand name, a large count, a progress line) in the primary system's accent colours, not a spinner.
- **The progress is real**: it follows promises for fonts, the first 3D frame and `window.load`, never faster than a minimum on-screen time (1.5 s first visit, 0.55 s on a reload in the same session) and never longer than 6 s of waiting (a slow asset must not trap the visitor).
- Two safety nets are mandatory: a head script that removes the cover classes after 9 s no matter what, and `bail()` in `main.js` if GSAP never loads. A page must never stay covered.
- Exit: the content slides away, the panel wipes up with `expo.inOut` (about 1 s), the hero intro starts under it.
- Reduced motion: no cover at all, content visible at once.
- Hero intro: title lines rise out of masks (`SplitText`, `mask: 'lines'`, `autoSplit: true` so the lines re-flow on resize), then lead and buttons fade up, then the nav; the 3D scene grows from flat to its resting height.

## 3. Smooth scroll

One **Lenis** instance, driven by the GSAP ticker so ScrollTrigger and the smoothing share one clock:

```js
const lenis = new Lenis({ autoRaf: false, lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false,
                          anchors: { offset: -72, duration: 1.3 }, stopInertiaOnNavigate: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

- `lerp` between 0.08 and 0.12 is the professional range; lower feels slippery, higher feels like no smoothing.
- Touch keeps native momentum (`syncTouch: false`): simulated scrolling feels wrong on a phone.
- Reduced motion: do not create Lenis (Lenis also honours it itself).
- `lenis.stop()` while a cover is up, a modal is open or a page is leaving; `lenis.start()` after. Inner scrollers get `data-lenis-prevent`.
- Keep Lenis's few CSS rules (`site.css` has them). Never run a second smooth-scroll library and never both Lenis and scroll-craft's engine on one page.
- Call `ScrollTrigger.refresh()` after fonts and images settle.

## 4. GSAP, used professionally

- Load pinned versions from a CDN (`gsap@3.15.1` plus `ScrollTrigger` and `SplitText`; `lenis@1.3.27`; `three@0.187.0`). GSAP's licence is the GSAP "no charge" standard licence, not MIT, so this skill links it instead of copying it into the repository.
- One timeline per moment; defaults in the timeline (`defaults: { ease }`); no `setTimeout` choreography.
- Eases: `expo.out` for arrivals, `expo.inOut` for covers, `power3.out` for small things. Controls follow `10-ui-motion-craft.md`, the story may be slower.
- Use `gsap.quickTo` for pointer-following (magnetic buttons), `ScrollTrigger.batch` for lists, `once: true` for reveals so nothing re-plays, `scrub` only for the few things that should be tied to the scrollbar (marquee, hero exit).
- Animate `transform`, `opacity` and `clip-path` only. `autoAlpha` for reveals, but never `visibility: hidden` on something that can take focus (the hero exit uses plain `opacity`).
- Never overwrite a tween that drives different state: `overwrite: true` kills every tween of that target. Use separate targets (this was a real bug in the first preloader draft: the minimum-time tween was killed by the progress tween).
- Under reduced motion nothing travels or scales: skip the choreography and leave content visible.

## 5. Page transitions

Two modes, chosen by `<html data-transition>`:

| Mode | How | Use |
|---|---|---|
| `curtain` (default) | A full-bleed panel in the accent colour wipes up with the destination's name (0.75 s), the browser navigates, the next page starts covered (head script adds `.pt-enter`) and the panel lifts (0.9 s) while the hero intro plays under it | Identical in every browser; branded; works with Lenis and the preloader order |
| `view` | Native cross-document View Transitions: `@view-transition { navigation: auto }` in `css/view-transition.css`; `::view-transition-old/new(root)` give the wipe; the nav keeps its own `view-transition-name` | Chrome and Edge 126+, Safari 18.2+. Browsers without support fall back to the curtain automatically |

Rules for both: leave modifier clicks, new tabs, downloads, other origins, same-page and `#hash` links alone; stop Lenis while leaving; restore on `pageshow` when `persisted` (back/forward cache); prefetch on hover and focus; keep the whole transition under 900 ms each way; under reduced motion use no transition at all. A single-page app uses the router's own transition hook with the same visuals.

## 6. Buttons

Three variants on Astryx tokens (`.btn--primary`, `--secondary`, `--ghost`), two sizes, plus an icon button. What makes them professional:

- **States all designed**: rest, hover, active, focus-visible, disabled, loading (`aria-busy`, spinner). Focus uses the Astryx ring (`--ds-focus-ring`, 2 px at a 3 px offset).
- **Press**: `transform: scale(0.97)` on `:active`, transition on `transform` only (Emil rule).
- **Hover only on hover devices**: everything inside `@media (hover: hover) and (pointer: fine)`.
- **Label roll**: the label slides up and an identical `aria-hidden` copy takes its place (markup added by `buttons.js` from `data-roll`, so the HTML stays clean and screen readers read one label).
- **Pointer-origin fill**: a `clip-path` circle grows from where the pointer entered (`--px`/`--py`).
- **Magnetic pull** (`data-magnetic`) for the one or two primary calls to action only, fine pointers only, `quickTo`, about 0.28 strength.
- **Touch targets** at least 44 px (`--ds-control-h` becomes 44 px on coarse pointers; the starter's buttons are taller still).
- Under reduced motion: no transitions, no magnetic, no scale.

## 7. The Three.js hero

One scene, one idea. The starter's is a lattice of rounded columns that ripple, follow the pointer and scroll, coloured from `--ds-surface` to `--ds-accent`, so light/dark and any token change repaint it. Replace the scene with the one that belongs to the subject (for a model use `assets/starter`'s canvas and `06-3d-atelier.md`), but keep the engineering:

- Dynamic `import('three')`; if the CDN or WebGL fails, the canvas is hidden and the CSS poster gradient remains.
- Transparent canvas over the page background; text stays real HTML above it.
- Image-based lighting (`RoomEnvironment` through `PMREMGenerator`) plus one key light. No real-time shadows unless the subject needs them.
- `setPixelRatio(min(devicePixelRatio, 2))`, dropped to 1 if the frame rate stays under about 40 fps.
- `InstancedMesh` for repeated objects; no allocations inside the frame loop.
- The loop runs on the GSAP ticker and stops when the hero is off screen (`IntersectionObserver`) or the tab is hidden.
- First frame is drawn before `ready` resolves, so the preloader waits for it and the reveal never shows an empty canvas.
- Reduced motion: still frame, no loop, no pointer tracking.
- Handle `webglcontextlost`; dispose geometry, material, environment and renderer on `pagehide`.
- Text over 3D must keep 4.5:1: keep the scene to the side or low in contrast behind the headline, then check the screenshot.

## 8. The Astryx design pass: find the best design inside Astryx

Astryx is always the system (SKILL.md rule 2). "Using Astryx" is not "using the Neutral defaults": the work is to find the strongest design that Astryx allows for this brief. Do this in phase 2, one round, at most three directions.

**Read first.** `references/ds/astryx.md`; the design-principle records in `vendor/astryx/docs/design/`; `vendor/astryx/themes-overview.md`. When the network allows, also the official sources: https://astryx.atmeta.com/, https://astryx.atmeta.com/docs/getting-started, https://github.com/meta/astryx, and the CLI's own guides (`npx @astryxdesign/cli docs principles`, `docs layout`, `docs tokens`, `template --list`, `theme list`).

**What Astryx offers to design with** (from its docs; the product is in Beta):

| Lever | Options |
|---|---|
| Theme (a set of token overrides) | Neutral (Figtree, muted and minimal; the one whose tokens are bundled here), Butter, Chocolate, Gothic (dark only), Matcha, Stone, Y2K |
| Page templates | product gallery, IDE, payment form, login split, settings sidebar, AI chat landing, product detail |
| Customisation | `defineTheme({ extends })` token overrides: accent, surfaces, fonts, radii. `theme eject` only for an independent fork |
| Surface | 14 px base, 1.2 type ladder, radii 6/10/12 (28 for page frames), motion 125/300/700 ms, 2 px focus ring |

**The pass:**
1. From the idea sentence and brief, write three directions in `.apex/decisions.md`, each as: theme (or Neutral plus a brand accent), the closest template or page grammar, density, hero type scale, the 3D palette, and one sentence on the feeling.
2. Build only the hero and one section of each with the starter's tokens (a few lines of `--ds-*` overrides), then shoot all three at 1440 and 390, light and dark, and look at the screenshots.
3. Score each 0 to 2: fits the idea sentence; does not look like the default template; the headline stays legible over the 3D; type and spacing character; contrast passes `scripts/contrast-check.mjs`; light and dark both hold. Pick the highest; write why the other two lost.
4. Say which route gives the tokens. This skill bundles **Neutral** only. For another theme in a React 19 app, install the real package (`npx @astryxdesign/cli theme add <name>`). In a static site, author the theme as an override of the `--ds-*` variables the way Astryx themes are overrides, from the theme's published palette, and run the contrast check. Never present an approximation as the official theme.
5. A brand accent replaces `--ds-accent`, `--ds-accent-text`, `--ds-on-accent` and `--ds-focus` together; re-run the contrast check.

If the person dislikes the result, they can ask to change the system: that is the one thing that ends the Astryx default (SKILL.md rule 2).

## 9. Starter, scaffold, and how to adapt it

```bash
node $APEX/scripts/new-site.mjs my-site            # Astryx by default
node $APEX/scripts/new-site.mjs my-site --ds apple # only after the person asked for another system
```

| File | Job |
|---|---|
| `index.html`, `work.html` | Two pages (so the transition is real): covers, nav, hero with canvas, rows, marquee, buttons stage, closing. Every placeholder says `TODO(content)` |
| `css/site.css` | All styles from `--ds-*`: covers, nav, buttons, hero, sections, Lenis rules, reduced-motion block |
| `css/view-transition.css` | Optional native transition |
| `js/main.js` | The order of events |
| `js/preloader.js`, `transitions.js`, `motion.js`, `scroll.js`, `buttons.js`, `hero3d.js`, `theme.js` | One job each |

Adapting: restyle the hero (art direction owns it), replace every `TODO(content)`, swap the 3D scene, keep `main.js` order and the safety nets. Delete the buttons stage and marquee if the idea does not want them. Serve with any static server; `file://` will not load ES modules.

## 10. Gate checks, and what was verified

Add these to the `08-qa-gate.md` scorecard: cover shown first and gone within about 3 s on a normal connection; intro plays after the cover and never before; Lenis present, wheel scroll eased and monotonic, scroll locked until the intro ends; internal link leaves with the curtain and arrives with it lifting; back button works; every button state reachable by keyboard; canvas non-blank, paused off screen, fallback shown when WebGL or three is blocked; page fully usable when GSAP is blocked; reduced motion shows everything at once; no console errors.

Verified when the starter was written: see `vendor/README.md`-style notes in `assets/starter/README.md` (what ran, in which browser, against which library builds, and what was not tested).

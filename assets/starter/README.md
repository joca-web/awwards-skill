# Starter: Astryx + preloader + smooth scroll + page transition + buttons + Three.js hero

Scaffolded by `node scripts/new-site.mjs <dir>` (Astryx tokens and Figtree go in `ds/`). Read `references/12-hero-motion-system.md` for the rules behind every file. Replace each `TODO(content)`, restyle the hero, keep the order of events in `js/main.js`.

Serve it with any static server (ES modules do not load from `file://`). Libraries load from a CDN at pinned versions: `gsap@3.15.1` (+ ScrollTrigger, SplitText), `lenis@1.3.27`, `three@0.187.0`. They are not copied into the repository: GSAP is under its own "no charge" licence, and the others are fetched at runtime.

## What was checked (Chromium headless, Playwright, software WebGL)
Libraries were the same versions as the pinned ones, built locally from their GitHub sources (GSAP 3.15.1 `dist`, three r187 `build`, Lenis v1.3.27 compiled with esbuild); the CDN URLs themselves were not fetched.

- Preloader: shown first, real progress, exits with the wipe, hero intro starts under it; gone about 2.8 s after load with no WebGL, about 5 s under software WebGL.
- Smooth scroll: one wheel gesture of 900 px produced an eased, monotonic curve (about 60 distinct positions, fastest early, settling) at 61 fps with WebGL blocked; scroll stays locked until the intro ends.
- Page transition (curtain): leaving shows the panel with the destination name, the new page arrives covered, the panel lifts, the preloader does not repeat; browser back works; the restore-from-cache handler was exercised by dispatching `pageshow` with `persisted: true`.
- Native View Transitions mode: the rule is active and `pagereveal` delivers a `viewTransition` on arrival in this Chromium; the second preloader is skipped.
- Buttons: label roll and pointer-origin fill render; press gives `scale: 0.97` also on the magnetic button; focus ring; loading state sets `aria-busy`.
- Three.js: renders in light and dark, follows tokens when the theme toggles, scene reacts to scroll; with `three` blocked the canvas is hidden and the poster remains; with GSAP blocked the page is plain and complete.
- Reduced motion: no covers, no Lenis, everything visible.
- Mobile 390 px: native scroll, no horizontal overflow, scene above the text.
- No console errors in a normal run.

## Not checked
- A real GPU (frame rate under software WebGL was about 4 fps, so 3D smoothness was not judged), Safari, Firefox, and a physical phone.
- The native View Transition animation itself (only that it is wired and fires), and a real back-forward-cache restore.
- Contrast of the headline over the 3D scene was judged by eye in screenshots (the scene fades out under the text with a CSS mask), not measured.

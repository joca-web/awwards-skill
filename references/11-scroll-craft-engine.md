# scroll-craft: the upstream method and engine

`02-scrollcraft.md` is this skill's own planning layer (beats, devices, budgets) built around the GSAP components of `incridible-skill-3d`. This file adds the full upstream **scroll-craft** skill by Nate Herk: a method that decides the *shape* of a scroll page, and a dependency-free engine that drives it. It is vendored unchanged in `vendor/scroll-craft/` (MIT; commit and licence in `vendor/README.md`).

Use it when the page is a scroll experience in its own right: scroll-scrubbed video or frame sequences, pinned acts, a layered hero, a page that must not look like a template. Use `02` alone for ordinary sections with a few reveals.

## Contents
1. What upstream gives you
2. Which engine: scroll-craft or GSAP
3. The method, mapped to the phases
4. Wiring the engine to the design system
5. Rules adopted as defaults
6. Money, network and trust
7. Verification, and its limits

## 1. What upstream gives you

All paths are under `vendor/scroll-craft/`; read `SKILL.upstream.md` first, then only the reference you need.

| Need | File |
|---|---|
| The whole procedure: interview, grammar, gate, score, assets, build, verify | `SKILL.upstream.md` |
| Eight page grammars (filmic one-shot, chaptered editorial, live surface, continuous world, typographic poster, gallery, split stage, rhythmic cutlist), the signature move, the fingerprint gate, aesthetic range | `references/uniqueness.md` |
| Feeling curve, the one engineered peak, the tell-someone test, pacing as emotion, the feel check | `references/feel.md` |
| Devices: `scrub`, `pin`, `pan`, `reveal`, `kinetic`, `parallax`, `count`, `flow` + `in`, pointer devices, `drift` | `references/devices.md` |
| Photographic worlds and when illustration is allowed | `references/worlds.md` |
| Dimensional hero: independent planes, alpha cutouts, mobile art direction | `references/hero-depth.md` |
| Spacing, type, depth, colour floor | `references/taste.md` |
| One unbroken camera flight (only when the brief is literally that) | `references/worldflight.md` |
| Making and encoding assets (scrub-friendly video) | `references/assets.md`, `scripts/encode.sh` |
| Verification procedure, phone-specific failures, diagnostic page | `references/verify.md`, `references/device-diag.html` |
| A starting page | `references/template.html` |
| The engine | `engine/scrollcraft.js`, `engine/scrollcraft.css` (vanilla JS, zero dependencies, no DOM generation; reads `data-sc-*` attributes from your real HTML) |
| Harness | `scripts/serve.mjs`, `scripts/shoot.mjs`, `scripts/doctor.mjs`, `scripts/workspace.mjs` |
| A worked registry of twelve builds | `EXAMPLES.md` |

## 2. Which engine: scroll-craft or GSAP

| The page is | Use |
|---|---|
| Led by scrubbed video or frame sequences, pinned acts, lateral pans, with real HTML on top, and you want no animation library | **scroll-craft engine** |
| Led by complex ScrollTrigger timelines, WebGL distortion or shaders, page transitions, Flip filters, draggable sliders, or a Three.js stage | **GSAP components** (`$I3D`, `02-scrollcraft.md` §3) |
| Mostly ordinary sections with some reveals | Either; prefer the lighter one already in the project |

The default build (`12-hero-motion-system.md`) is GSAP + Lenis + a Three.js hero; the scroll-craft engine is the alternative when the page is led by scrubbed video or frame sequences. Never run both engines on the same section. A page may use scroll-craft acts for the story and an `$I3D` stage for one 3D object if they do not both drive the same element; when in doubt keep one engine.

The engine does not generate DOM. You write semantic HTML (real `h1`, `p`, links) and mark it up, for example `<section data-sc-act="pin" data-sc-span="2.5">`, `data-sc-scrub` on a `<video>`, `data-sc-cue="0.1 0.5"`, `data-sc-kinetic="lines"`, `data-sc-reveal="up"`. Never edit the engine per project; theme it with tokens and bespoke JS in the page driven off `--sc-p`.

## 3. The method, mapped to the phases

| awwwards-skill phase | scroll-craft step | What to do |
|---|---|---|
| 0 Intake | Step 0 (brief) | Ask the eight questions in one pass (vibe, journey, energy curve, feeling and the one memorable moment, the thing no other site does, distance from premium-minimal, one unbroken world or distinct scenes, existing assets). If the user delegates creative direction, write a brief marked "self-authored under explicit creative delegation". Write the answers into `.apex/decisions.md` (upstream uses `BRIEF.md`; keep both if the project has one) |
| 1 Taste | Steps 1 and 2 | `01-taste.md` stays the source of the idea sentence and the anti-slop gate. Add upstream's feeling curve (one line per act: emotion, then what causes it) and name the peak before choosing devices |
| 2 Design system | n/a | Astryx unless the person asked for another; `--sc-*` tokens map to `--ds-*` (§4) |
| 3 Scroll architecture | Step 2 | Pick one grammar from the eight and say why the other seven lost; invent one signature move; run the fingerprint gate (differ from every existing row on at least 4 of 6 dimensions, never edit the registry to fit); then assign devices per beat: four or more device families, never the same twice in a row, at most two `scrub` acts, one peak with the largest span |
| 4 Assets | Step 3 | One style preamble reused verbatim; look at every asset before using it; encode for scrubbing (`encode.sh`: dense GOP); layer the hero into planes |
| 5 Build | Step 4 | Start from `references/template.html`; real HTML first |
| 6 Gate | Step 5 | Scroll it: harness at desktop and mobile and reduced motion, read the contact sheet, then the feel check (one word per act, then diff against the brief) |
| 7 Report | Output | Grammar and why the other seven lost, signature move, fingerprint result, journey, curve and peak, what was verified |

The registry upstream is `<workspace>/FINGERPRINTS.md` (`scripts/workspace.mjs` prints the workspace). Keep it in the project, per user and starting empty; append one row after shipping.

## 4. Wiring the engine to the design system

scroll-craft themes by overriding a few tokens. Point them at the chosen system so the page stays on one identity:

```css
:root {
  --sc-canvas: var(--ds-bg);          --sc-surface: var(--ds-surface);
  --sc-ink: var(--ds-text);           --sc-ink-soft: var(--ds-text-subtle);
  --sc-accent: var(--ds-accent);      --sc-accent-ink: var(--ds-on-accent);
  --sc-font-display: var(--ds-font-sans);
  --sc-font-text: var(--ds-font-sans);
}
```
A cinematic brand page usually wants its display face to differ from the system's: set `--sc-font-display` to the brand face and keep `--sc-font-text` on the system. After any accent override re-run `scripts/contrast-check.mjs`.

## 5. Rules adopted as defaults

Upstream's "hard rules" are strong taste opinions that match this skill's anti-slop gate. Treat them as defaults the user can override explicitly:

- Photographic worlds by default; no clay or low-poly diorama unless the brand is genuinely illustrated.
- No scroll cue, arrow or animated mouse icon; no `01 / 06` section counters; no eyebrow above every heading; no em dash in visible copy.
- Vary the copy anchor (lead, trail, centre, split); the same device never twice in a row.
- One engineered peak; the ending resolves and holds instead of fading into a footer.
- Real text in markup, never baked into a generated image; no invented statistics in counters.
- Only `transform`, `opacity` and `clip-path` motion; no `transition: all`; no gradient text, neon glow or zero-offset coloured halos.
- No audio on scrub clips.
- A scrim only where the text sits, never a full-frame dark overlay.

Where this conflicts with `10-ui-motion-craft.md` (Emil), scroll-craft governs the scroll story and Emil governs the controls.

## 6. Money, network and trust

- `scripts/kie.mjs` generates stills and clips through **kie.ai**, a paid third-party service: it reads `KIE_AI_API_KEY` and posts prompts and any reference images to `api.kie.ai` and `kieai.redpandaai.co`. **Do not run it unless the user supplied a key in this session and agreed to the spend** (upstream's own estimate for a modest six-act page is about 520 credits; a ten-leg continuous flight about 2,000). Never write a key into the repository; `.env` stays out of version control.
- The default route is the user's own photos and footage, which upstream treats as first-class. A build from them needs no key.
- In this workspace the shell may block those hosts. If `kie.mjs` is unreachable, say so and ask for assets; do not look for another way around.
- These are third-party scripts (see `vendor/README.md`): read a script before running it, run `serve.mjs` bound to this machine only (it is by default; `--lan` exposes the served folder to the whole network, so use it only on a trusted network and stop it afterwards), and do not run `shoot.mjs` against sites you do not own.

## 7. Verification, and its limits

The upstream harness reports dead scroll, cues that never reach full opacity and composited contrast, and writes a contact sheet; the human-in-the-loop part is to read the sheet and run the feel check. A green headless run does **not** cover a real phone (video decoder, autoplay policy, Low Power Mode, touch scrolling). On any mobile defect, ship `references/device-diag.html` beside the site and let the device answer.

When this skill's own gate (`08-qa-gate.md`) runs, use whichever inspector the project already has (`$I3D/scripts/shoot.mjs` or upstream's `shoot.mjs`), not both, and report which one it was. State plainly that the vendored engine and scripts were not executed during the integration of this skill; evidence for a given page is whatever you ran on that page.

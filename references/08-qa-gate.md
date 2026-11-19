# QA gate

Nothing is reported done until this gate has run. Fix every FAIL, re-run, up to three rounds, then ship with the remaining items listed honestly.

## Contents
1. Site gate
2. Design-system gate
3. 3D gate
4. Graft gate
5. Scorecard
6. The final report

## 1. Site gate

Run the inspector from `incridible-skill-3d` (`$I3D/scripts/shoot.mjs`) at 1440, 768 and 390 px with real wheel and touch input, not scripted `scrollTo`. It records screenshots, a filmstrip, console errors, layout metrics and motion counts. Check:

| Check | Pass |
|---|---|
| Console | No errors; no failed requests |
| Structure | One `h1`; landmarks (`header`, `main`, `footer`); headings in order |
| Layout | No horizontal scroll at 390; equal outer margins; no empty stretch over 1.5 viewports; no overlapping text |
| Type | Headline two lines at 1440 and at most three at 390; body line length 45 to 80 characters |
| Images | At least four real pictures on content pages; every `img` has `alt`; no broken images; `loading="lazy"` below the fold |
| Motion | At least 8 elements move on a normal scroll; at most 1 or 2 loud per viewport; content visible with JavaScript off and under reduced motion |
| Performance | LCP under 2.5 s on throttled mobile profile; no layout shift from fonts; JS budget as in `02` |
| Interaction | Every control reachable by keyboard; visible focus; no scroll trap; links work with the smooth-scroll layer |
| Fallbacks | Poster for every canvas and sequence; `aria-label` or `aria-hidden` on decorative canvases |

## 2. Design-system gate

```bash
node $APEX/scripts/contrast-check.mjs <project>/tokens.css      # all pairs pass, light and dark
node $APEX/scripts/codegraph.mjs <project>                      # no undefined --ds-* tokens, no broken references
```
Also check by eye: only one system's colours, fonts and radii are in use; borrowed mechanisms are written in the primary's tokens; custom brand colours were re-audited with `contrast-check.mjs --pair`.

## 3. 3D gate

```bash
node $APEX/scripts/atelier/selftest.mjs       # must pass
```
For each model: clay and views sheets reviewed this round; no CLIPPED warning; GLB triangle count and size within budget (`06` §10); LOD files exist when the model is on a hero; a poster still exists; loads in the page and sits on the ground with contact shadow; the page works with the still only.

Say clearly if the model was judged only in the software previewer and not in WebGL.

## 4. Graft gate

If anything was ported: the table from `03-graft.md` is filled, licence notices are present, no unused dependency remains, the host graph shows no new broken references.

## 5. Scorecard

Score 1 to 10 with a one-line reason; below 8 gets a fix round.

| Area | Weight (Awwwards) | Look for |
|---|---|---|
| Design | 40 | Single idea, type ladder, colour discipline, imagery quality, 3D realism |
| Usability | 30 | Navigation clarity, readable on phone, keyboard and focus, motion that helps |
| Creativity | 20 | A signature moment someone remembers; not the template look |
| Content | 10 | Specific copy, real proof, no placeholders left unmarked |
| Developer | extra | Semantics, performance, accessibility, clean markup |

## 6. The final report

Short, in the user's language. Include:
- Direction and idea sentence; design system, runner-up and what was borrowed.
- Scroll beats in one line each.
- For each 3D model: route (Atelier, hull, generator), triangles, size, known issues.
- Inspector numbers: console clean, LCP, moving elements.
- Placeholders and credits.
- **What was not verified** (for example: WebGL smoothness, a real normal-map viewer, evals not run).
- One next step if there is a real one.

No recap of every step.

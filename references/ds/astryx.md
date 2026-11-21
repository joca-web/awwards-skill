# Astryx (Meta)

Official source (verify before shipping): https://astryx.atmeta.com · https://github.com/meta/astryx (MIT, currently in Beta)
Tokens: `assets/design-systems/astryx/tokens.css` (+ `fonts.css` and `fonts/`)
Vendored upstream docs: `vendor/astryx/` (see `vendor/README.md` for the commit)

## Character
Quiet, grayscale and unbranded by default: a canvas that lets the product or the brand speak. Figtree throughout, small radii, soft layered shadows, strict hierarchy by space before boxes. Astryx grew inside Meta over eight years and ships 150+ accessible React components, brand-level theming, dark mode, templates and a CLI built so that people and AI agents build from the same reference.

The accent is monochrome (near-black in light, near-white in dark), so on a brand site you are expected to **override the accent**, not to keep Astryx grey. That is the system's own idea of theming: a theme is a set of CSS custom property overrides.

## Best for
Developer tools, SaaS apps, documentation, internal products, dashboards and admin where a calm neutral frame matters more than a distinctive skin. It also works for restrained portfolios and editorial pages when the art direction carries the identity. Not the first choice for cinematic brand launches (Apple) or record-heavy CRM (Salesforce).

## Token summary (Neutral theme)
| Role | Light | Dark |
|---|---|---|
| bg / surface | `#F1F1F1` / `#FFFFFF` | `#1B1B1B` / `#262626` |
| text / subtle | `#000000` / `#474747` | `#FFFFFF` / `#9E9E9E` |
| accent (mono) | `#1B1B1B` on `#FFFFFF` | `#F1F1F1` on `#111111` |
| border | 8% black hairline | 10% white hairline |
| status text | red `#C0262C`, green `#2F7D33`, amber `#836700` | `#FFAEA7`, `#90CA90`, `#EEC448` |
| radius | 6 / 10 / 12 px, page 28 px | same |
| control height | 32 px (44 px on coarse pointers) | same |
| display | 42 to 60 px, weight 400 | same |
| body | Figtree 16 px / 24 px (Astryx base is 14 px, 16 px floor on touch) | same |
| ease | standard `cubic-bezier(.24,1,.4,1)`, 125 / 300 / 700 ms | same |

Derived, not Astryx values (marked in the file): `--ds-surface-raised` in dark, `--ds-border-strong` in both modes (Astryx's own emphasized border fails 3:1 for form controls), and tracking. All 18 contrast pairs pass in both themes.

## Mechanisms to use
- **Space before containment.** Gaps grow local < group < section (`--ds-space-*`), and a card is added only when spacing alone does not make the group clear. Run the squint test: sections must still read blurred.
- **Quiet elevation.** One edge language per surface: a hairline or a soft shadow, never both at full strength. In dark, shadows carry a faint inset ring (already in `--ds-shadow-*`). A surface that looks higher must cover what is lower (menus, popovers) and must not be clipped by a container.
- **Concentric radii.** Nested curves stay parallel: inner radius = outer radius minus the padding between them. Roles map to `--ds-radius-s` (inner), `-m` (controls), `-l` (containers), `-xl` (page frames, large media).
- **Type by role.** Display, heading, body, label and supporting text are visibly different roles; body copy stays under about 65 characters per line.
- **Focus.** Keyboard focus only (`:focus-visible`): 2 px ring in the accent colour at a 3 px offset, exposed as `--ds-focus-ring`. State rings are never confused with elevation shadows.
- **Overlay tints for hover and press** (about 5% and 10% of the content colour) so the surface identity survives the state.
- **Reduced motion keeps meaning.** No travel, scale or spring; on touch a change cross-fades in 200 ms or less, with a mouse or keyboard it is immediate. The tokens file already shortens `--ds-dur-*` under `prefers-reduced-motion`.
- **Motion carries meaning.** Small feedback is faster than large entrances; settle with a decelerating curve, no ornamental bounce.

## Mechanisms to avoid
- Keeping the monochrome accent on a brand site that has colours of its own. Replace `--ds-accent`, `--ds-accent-text`, `--ds-on-accent` and `--ds-focus` together, then re-run `scripts/contrast-check.mjs`.
- Display type at weight 600 or 700 "for impact": Astryx uses 400 so size does the work. Raise to 500 if you must, not more.
- Cinematic long reveals as the system's voice. That is an art-direction choice, not Astryx's.
- Mixing Astryx radii or Figtree into another system's page, or the reverse.

## Fonts
Figtree is open (SIL OFL 1.1), so unlike the other five systems it is bundled: `assets/design-systems/astryx/fonts/` with its licence, and `fonts.css` (local woff2, `font-display: fallback`, so a page never waits on a network). Load `fonts.css` before `tokens.css`. Keep the OFL file next to the fonts when you ship them.

## Two ways to use it
1. **Tokens only** (static sites, GSAP or Three.js pages, Awwwards builds): copy `tokens.css`, `fonts.css`, `fonts/` and build from `--ds-*` like any other system.
2. **The real library** (a React 19 app): `npm i @astryxdesign/core @astryxdesign/theme-neutral @stylexjs/stylex` and `npm i -D @astryxdesign/cli`, then `npx @astryxdesign/cli init`. Then follow the workflow in `vendor/astryx/astryx-agent-skill.md`: `astryx build "<what the page is for>"`, scaffold with `astryx template`, read props with `astryx component <Name>`. Astryx names differ from other libraries (buttons take `label`; booleans start with `is`/`has`; inputs take `value` and `onChange`). Use the package's own theme object rather than this tokens file in that case.

## Other Astryx themes
Neutral is the one mapped here. Astryx also ships Butter, Chocolate, Gothic (dark only), Matcha, Stone and Y2K (see `vendor/astryx/themes-overview.md`). To map another one to `--ds-*`, read its `src/*Theme.ts` upstream and follow the same mapping as in the header of `tokens.css`; `vendor/astryx/neutral-theme/neutralTheme.ts` is the worked example.

## Accessibility notes
Contrast verified in both themes. Targets grow to 44 px on coarse pointers. Astryx's own design records (vendored under `vendor/astryx/docs/design/`) cover reduced motion, bidirectionality, system and user states, typography hierarchy and control rhythm; read the one that matches the component you are building. Several of those records are marked `draft` upstream: treat them as guidance, not as a published standard.

## Lends to other systems
Spacing and grouping; reduced-motion rule; quiet elevation (in product UI). The selector prints these when another system is primary. Astryx is also the skill's default: it is used on every build unless the person asks to change (`SKILL.md` rule 2).

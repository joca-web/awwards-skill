# Design systems: one contract, six identities

Apex ships six systems (Apple, Google Material 3, Microsoft Fluent 2, Atlassian, Salesforce, Meta Astryx) as the same set of CSS variables. A site picks one primary system, loads its `tokens.css`, and builds only from `--ds-*` variables. Switching system means swapping one file.

## Contents
1. The token contract
2. Choosing the primary (the selector)
3. Borrowing without mixing
4. Brand sites versus product UI
5. Dark mode, contrast, forced colours
6. Fonts, marks and licensing
7. Using the tokens
8. What the values are and are not

## 1. The token contract

Every `tokens.css` defines the same names:

- Colour roles: `--ds-bg`, `--ds-surface`, `--ds-surface-raised`, `--ds-text`, `--ds-text-subtle`, `--ds-accent`, `--ds-on-accent`, `--ds-accent-text`, `--ds-border`, `--ds-border-strong`, `--ds-danger`, `--ds-success`, `--ds-warning`, `--ds-focus`.
- Type: `--ds-font-sans`, `--ds-font-mono`, and per step (`display`, `h1`, `h2`, `h3`, `body`, `small`) a size `--ds-fs-*`, weight `--ds-fw-*`, line height `--ds-lh-*`, tracking `--ds-ls-*`.
- Shape and space: `--ds-radius-s/m/l/pill` (Astryx also exposes `--ds-radius-xl` for page-level frames), `--ds-space-1` (base unit), `--ds-gap`, `--ds-control-h`.
- Motion: `--ds-ease-standard`, `--ds-ease-emphasized`, `--ds-dur-fast/base/slow`.
- Elevation and focus: `--ds-shadow-s/m/l`, `--ds-focus-ring`.

Light is the default. Dark applies through `[data-theme="dark"]`, or through `prefers-color-scheme: dark` when no theme attribute is set.

Why semantic names: components never know which system they are in. A button is `background: var(--ds-accent); color: var(--ds-on-accent); border-radius: var(--ds-radius-m)` and looks Apple, Google, Fluent, Atlassian or Salesforce depending on the file.

## 2. Choosing the primary

```bash
node $APEX/scripts/pick-design-system.mjs --type <t> --audience <a> --density <d> --tone <t> --platform <p> --ecosystem <e> --motion <m> --3d <yes|no> --ambition <awwwards|standard> [--json]
```

| Flag | Values |
|---|---|
| `--type` | marketing, portfolio, ecommerce, saas-app, dashboard, admin, docs, crm, devtools, collab, media, fintech, healthcare, education, mobile-web |
| `--audience` | consumer, prosumer, enterprise, developer |
| `--density` | airy, comfortable, compact |
| `--tone` | premium-minimal, friendly, neutral-pro, expressive |
| `--platform` | apple, android, windows, mixed |
| `--ecosystem` | salesforce, atlassian, none (the site lives inside that vendor's ecosystem) |
| `--motion` | low, medium, high |
| `--3d` / `--ambition` | yes/no; awwwards/standard |
| `--stack` | react, other (react favours Fluent 2, Atlassian and above all Astryx, which ship real React component libraries) |

The score is a base fit per site type plus modifiers; the output lists the ranking, a confidence (high when the margin is 4 or more, medium for 2 to 3, low below that), the borrowing plan and the rules. It is a judgement aid, not an oracle. When confidence is low, decide from the brand and record why in `.apex/decisions.md`.

Typical outcomes: marketing, portfolio and media sites land on Apple; Android-first and education flows on Google; dashboards, admin and Windows-centred products on Fluent 2; team-collaboration and docs on Atlassian; developer tools, SaaS and docs for a developer audience, especially in a React app, on Astryx; CRM and record-heavy enterprise on Salesforce. The scores are this skill's own judgement, not a ranking published by any vendor.

## 3. Borrowing without mixing

"Use the best for each configuration" means: for each concern, take the best **mechanism**, restated in the primary's tokens, and never the other system's identity.

Allowed to borrow: state-layer percentages (Google), two-ring focus outlines and forced-colours handling (Fluent), command palette and sidebar structure (Atlassian), record layouts and table patterns (Salesforce), long ease-out reveals and blur layering (Apple), space-before-containers grouping and the reduced-motion rule (Astryx).

Not allowed to borrow: colours, fonts, corner radii, logos, icon sets. These make the identity; mixing them yields a page that looks assembled.

The selector prints a per-concern borrowing table for the chosen primary. Typical concerns: typography ladder, colour roles and dark mode, motion, component states, navigation, data tables and forms, focus and accessibility, elevation, spacing and grouping, reduced motion.

## 4. Brand sites versus product UI

- **Brand and Awwwards sites** (marketing, portfolio, media, launches): the system owns the systemic layer: type scale, spacing, form controls, focus, states, dark mode. The art direction owns the hero, imagery, signature moment and motion personality. Override tokens deliberately (a brand accent via `--ds-accent`, a custom display face via `--ds-font-sans` for headlines only), and re-run the contrast check afterwards.
- **Product UI** (dashboards, CRMs, admin, docs): follow the system strictly for components. Creativity goes into information design, empty, loading and error states, and onboarding.

## 5. Dark mode, contrast, forced colours

Run `node $APEX/scripts/contrast-check.mjs <tokens.css>` after any token change. It checks 15 text pairs at 4.5:1 and 3 UI pairs at 3:1 in both themes and exits non-zero on failure. All six shipped files pass. For a single pair: `node $APEX/scripts/contrast-check.mjs --pair "#6E6E73" "#FFFFFF"`.

Support `@media (forced-colors: active)` for product UI: use `CanvasText`, `Canvas`, `Highlight`, and keep outlines. Keep `:focus-visible` rings on every interactive element (`box-shadow: var(--ds-focus-ring)`, or a real outline when forced colours are on).

## 6. Fonts, marks and licensing

The proprietary typefaces (SF Pro, Segoe UI Variable, Google Sans, Atlassian Sans, Salesforce Sans) are not redistributed here. The exception is **Figtree**, Astryx's typeface: it is open (SIL OFL 1.1), so it ships in `assets/design-systems/astryx/fonts/` with its licence file (keep the licence next to the fonts). The tokens use system stacks that resolve to the real face on its home platform and to a neutral fallback elsewhere. Do not hot-link or bundle them. For a consistent cross-platform look, use an openly licensed face with a similar structure (Inter, Roboto, Source Sans) and say so.

Do not reproduce vendor logos, product names or iconography on a site that is not that vendor's. Building "in the style of" a design system is fine; presenting a page as official Apple, Google, Microsoft, Atlassian or Salesforce material is not.

## 7. Using the tokens

```html
<link rel="stylesheet" href="assets/tokens.css">
<style>
  body { background: var(--ds-bg); color: var(--ds-text); font: var(--ds-fw-body) var(--ds-fs-body)/var(--ds-lh-body) var(--ds-font-sans); }
  .btn { min-height: var(--ds-control-h); padding: 0 calc(var(--ds-gap) * .75); border-radius: var(--ds-radius-m);
         background: var(--ds-accent); color: var(--ds-on-accent); transition: background var(--ds-dur-fast) var(--ds-ease-standard); }
  .btn:focus-visible { box-shadow: var(--ds-focus-ring); outline: none; }
  a { color: var(--ds-accent-text); }
</style>
```
Use `--ds-accent-text` for link and accent-coloured text; the plain accent can fail contrast as text on light backgrounds. Theme switch: `document.documentElement.dataset.theme = 'dark'`.

## 8. What the values are and are not

The token values are an accessibility-audited approximation of each public system, built from the vendors' published guidance. They are not a copy of the official token sets. Astryx is the one system with values taken directly from published source (the Neutral theme, MIT, at the commit in `vendor/README.md`); three values in its file are marked as derived. Before shipping a product that must match a vendor exactly (for example an app inside the Salesforce platform, or a React app that should use Astryx's real components), verify against the official docs listed in each `ds/<id>.md` and the header of each `tokens.css`, or use the vendor's own packages.

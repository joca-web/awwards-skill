# vendor/: third-party material bundled with awwwards-skill

Everything here belongs to its original authors and keeps its own licence (all three are MIT). Nothing was rewritten: the only change is the file name `SKILL.md` → `SKILL.upstream.md`, so that tools which scan for skills do not register these as separate skills. Read them as reference files through the routing in `references/10-ui-motion-craft.md`, `references/11-scroll-craft-engine.md` and `references/ds/astryx.md`.

| Folder | Upstream | Commit | Licence | What is included |
|---|---|---|---|---|
| `emilkowalski-skills/` | https://github.com/emilkowalski/skills (Emil Kowalski) | `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c` (2026-11-15) | MIT, © 2026 Emil Kowalski | All 19 skills (`skills/*/SKILL.upstream.md` plus their companion files), `ui-cheatsheet.md`, `performance-cheatsheet.md`, README, LICENSE |
| `scroll-craft/` | https://github.com/nateherkai/scroll-craft (Nate Herk), v0.3.1 | `75d81f74e83692add18cd7a8a8e078b8a887a579` (2026-09-30) | MIT, © 2026 Nate Herk | The whole `scroll-craft` skill: `SKILL.upstream.md`, `references/`, `engine/` (scrollcraft.js and .css), `scripts/`, `templates/`, CHANGELOG; plus the repo's README, EXAMPLES.md, `.env.example`, LICENSE |
| `astryx/` | https://github.com/meta/astryx (Meta Platforms, Inc.), Beta | `7916ed572d8d9700bcb72c848d8cf0b9247650f4` (2026-11-21) | MIT, © 2026 Meta Platforms, Inc. | README, LICENSE, the design-principle records (`docs/design/`), `docs/themes.md`, token and theme-authoring architecture docs, the themes overview, the Neutral theme's README, spec, source and generated palette, and the agent skill that ships with Astryx (`astryx-agent-skill.md`) |

The tokens in `assets/design-systems/astryx/` and the Figtree fonts (SIL OFL 1.1, licence file next to them) are derived from the Neutral theme at the commit above. Licence texts for everything are collected in `../THIRD_PARTY_NOTICES.md`.

## Evaluated and not bundled
- **https://github.com/sami12344/framer-motion** (commit `da37e0b`, 2023-08-25). Requested as "Framer Motion". It is not the library: it is a personal Vite + React demo app (about 230 lines of TSX, boxes animated with `framer-motion` v10) and the repository has **no LICENSE file** (the README says MIT but the file is missing), so nothing may be copied from it. The skill uses the official library instead: `motiondivision/motion` (MIT, © Motion B.V.), documented in `references/13-motion-react.md`. It is not vendored: it is installed with `npm install motion`.

## Not included, on purpose
- **Astryx's source monorepo** (`packages/core`, `lab`, `native`, 150+ components, tests: about 400 MB and React-specific). Install the real packages with npm when you build a React app; see `references/ds/astryx.md`.
- **scroll-craft's `media/` images** (6.5 MB of sample screenshots).
- **Emil Kowalski's `.pl`, `.gitattributes`, `.gitignore`** (repo housekeeping).

## What was and was not checked
Checked: the licence of each repo, the file structure, the hosts and risky calls used by the scripts (`grep` for `child_process`, `eval`, network calls), and that the scroll-craft scripts and engine parse (`node --check`, `bash -n`). Emil's skills are Markdown only. Astryx values in `tokens.css` were taken from the Neutral theme source and audited with `scripts/contrast-check.mjs`.

Not checked: every line of the scroll-craft scripts and engine, and the engine and scripts were **not run** here (no browser test of `scrollcraft.js`, `shoot.mjs` or `doctor.mjs`). Treat them like any third-party code: read a script before running it.

Network behaviour to know about: `scroll-craft/scripts/kie.mjs` calls the paid kie.ai API (`api.kie.ai`, `kieai.redpandaai.co`) and reads `KIE_AI_API_KEY` from the environment or a `.env` file. awwwards-skill never calls it on its own: see `references/11-scroll-craft-engine.md` for the rule.

## Updating
Clone the upstream repo into a new empty directory outside the project, diff it against the folder here, read what changed, copy the changes in, rename any new `SKILL.md` to `SKILL.upstream.md`, update the commit in the table above, and re-run `node scripts/contrast-check.mjs assets/design-systems/*/tokens.css` if the Astryx theme changed.

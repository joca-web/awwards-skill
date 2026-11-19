# Graphify: map before you touch

A graph answers structural questions (what loads what, which file is a hub, what is dead, which tokens are broken) in one read instead of dozens of greps. Use it before a redesign, a graft, a refactor, or when you inherit a site.

## Contents
1. Two tools: real Graphify and the bundled `codegraph.mjs`
2. Running the bundled graph
3. Reading the report
4. Questions to ask the graph
5. Using it with Taste and Graft
6. Limits

## 1. Two tools

- **Graphify (the open-source tool)** builds a knowledge graph of a codebase and its docs, with an LLM-assisted pass for concepts. It needs installation and network access for packages. When it is available and the user wants deep multi-language analysis, use it and follow its own instructions.
- **`scripts/codegraph.mjs` (bundled)** is a "graphify-lite" for the web stack: HTML, CSS, JS/TS/JSX/TSX, Markdown, SVG, JSON. It needs only Node, so it runs anywhere. Every edge is extracted by parsing, never guessed, and is tagged `EXTRACTED`.

If you did not run real Graphify, do not claim you did.

## 2. Running the bundled graph

```bash
node $APEX/scripts/codegraph.mjs <project-dir> [--out .apex/graph]
```
Writes `graph.json`, `GRAPH_REPORT.md` and `graph.html` (a searchable table). It skips `node_modules`, `.git`, `.apex`, `dist`, `build`, `.next`, `coverage`.

## 3. Reading the report

| Section | What it tells you | Action |
|---|---|---|
| Entry points | HTML nobody links to: the real pages | Start the redesign here |
| Hubs | Files with the most in/out edges | Change with care; test everything that touches them |
| Broken local references | `src`/`href`/`import`/`url()` that resolve to nothing | Fix first; some may be generated at build time, check |
| Orphans | Files that nothing uses | Candidates for deletion; confirm before removing |
| Design tokens | Used-but-undefined and defined-but-unused CSS variables | Undefined means bugs; unused means an abandoned layer |
| Libraries | gsap, ScrollTrigger, Lenis, three, Flip, SplitText, Barba, React, Tailwind detected | Do not add a second animation or smooth-scroll library |
| Clusters | Groups of files that reference each other | Natural module boundaries |

Starters from `incridible-skill-3d` show their `components/` and `three/` references as unresolved until those folders are copied next to them; that is expected, not a bug.

## 4. Questions to ask the graph

- Which entry point carries the most weight? Which hub breaks the most files if rewritten?
- Are the broken references real?
- Which tokens does the page use that no stylesheet defines?
- What is the least risky place to attach the new feature?
- Which libraries are already loaded, so the redesign reuses them?

## 5. Using it with Taste and Graft

- **Redesign:** run the graph, then keep stack, routes, copy and content; take a "before" screenshot set with `$I3D/scripts/shoot.mjs`; then the Taste phases.
- **Graft:** run it on the host before choosing where the ported code goes, and again afterwards to confirm nothing new is orphaned or broken.
- **Design system swap:** the token section shows which `--ds-*` variables the old site never used and which hard-coded values must be replaced.

## 6. Limits

- It parses static references. Dynamic imports with computed paths, template-string URLs and framework routing conventions are not resolved; those are skipped, not reported as broken.
- No call graph or type information. For deep code intelligence use real Graphify or the language's own tooling.
- Output is a snapshot; re-run after structural changes.

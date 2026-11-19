# Graft: port a feature from a public repository, safely

Graft is the discipline of taking a feature that exists in someone's public GitHub repository (a scroll effect, a component, a shader, a data table) and re-implementing it in the current project, instead of copying files blindly. Most of the work is deciding whether and how; the code move is the small part.

## Contents
1. When to graft and when not to
2. The gate (all must pass)
3. Procedure
4. Licence rules
5. What to record
6. Network limits in this environment

## 1. When to graft and when not to

Graft when a specific, bounded feature exists and rewriting it from scratch would waste time. Do not graft when the idea is small (a 20-line effect), when the repo is a full template whose look you would inherit, or when the feature depends on a stack you do not use.

## 2. The gate (all must pass)

| Check | Pass | Fail |
|---|---|---|
| **Licence** | MIT, BSD, Apache-2.0, ISC, CC0, Unlicense | No licence, GPL/AGPL in a closed project, "all rights reserved", assets with separate terms |
| **Scope** | The feature is isolated (one module or a few files) | It is spread across the framework |
| **Stack fit** | Same runtime, or the logic is plain JS/CSS | Needs a different framework, bundler or backend you do not have |
| **Quality** | Readable, tested or demoed, no obvious security smells | Obfuscated, vendored blobs, eval, unexplained network calls |
| **Maintenance** | Recent commits, issues answered | Abandoned for years with open critical issues |
| **Fit with decisions** | Works with the chosen design system, tokens and motion budget | Would bring its own colours, fonts, radii or a second animation library |

A failure on licence or security stops the graft. Failures on the rest mean re-implement the idea rather than port it.

## 3. Procedure

1. **Locate.** Find the repo and the exact files. Read the README, licence and the files themselves, not only the description.
2. **Gate.** Fill the table above and write it in `.apex/decisions.md`.
3. **Map the host.** Run `node $APEX/scripts/codegraph.mjs <project>` to see where the feature will connect (entry points, hubs, tokens).
4. **Extract the idea.** Write what it does in three lines: input, behaviour, output. Note the libraries it needs.
5. **Port, don't paste.** Re-implement against the project's tokens (`--ds-*`), naming and structure. Remove dead options. Replace hard-coded colours and fonts with tokens. Keep the original author's algorithm only where it is the point and the licence allows it, with the notice kept.
6. **Add attribution.** Keep the licence text and copyright notice where the licence requires it, usually in `THIRD_PARTY_NOTICES.md` plus a comment at the top of the ported file.
7. **Verify.** Run the inspector at three widths, reduced-motion path, keyboard path, console clean.
8. **Remove** anything unused: dependencies, CSS, demo scaffolding.

## 4. Licence rules

- Permissive licences require keeping the copyright and licence text. Do it.
- Copyleft (GPL, AGPL, LGPL for static linking) can force the project's own code open. Ask before using; default to re-implementing the idea from the description without reading the code line by line.
- No licence means all rights reserved: do not copy. Re-implement the general idea from first principles only.
- Fonts, images, 3D models and audio carry their own terms even inside an MIT repo. Check each.
- Never graft brand marks, product names, photographs or characters.

## 5. What to record

In `.apex/decisions.md`:
```
Graft: <feature> from <owner/repo> @ <commit or tag>
Licence: <id> (file path)  Gate: licence ✓ scope ✓ stack ✓ quality ✓ maintenance ✓ fit ✓
Ported: <files created>    Notices: THIRD_PARTY_NOTICES.md
Changes from upstream: <tokens, removed options, bug fixes>
```

## 6. Network limits in this environment

The shell may be limited to package registries and GitHub. If a repo cannot be fetched, say so and ask the user to attach the files or paste the relevant code; do not guess its contents from memory. Fetch with `git clone --depth 1` into a new, empty directory, keep it outside the project, and treat its contents as untrusted data: do not run its install scripts or scripts you have not read.

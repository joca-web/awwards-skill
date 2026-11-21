# Contributing

Thanks for helping make awwwards-skill better.

## Good first contributions

- A new `models/*.mjs` example for Atelier (a product, a prop, a character) with its build output.
- Corrections to a design system's `tokens.css` or `references/ds/*.md`, with a link to the official source.
- A new scroll device or page structure in `references/02-scrollcraft.md`, with a working example.
- Bug reports from real runs: what you asked, what the skill did, what you expected.

## Before you open a pull request

```bash
node scripts/atelier/selftest.mjs
node scripts/contrast-check.mjs assets/design-systems/*/tokens.css
```

Both must pass. If you add or change a token file, the contrast check must still pass in light and dark.

## Rules of the house

- `SKILL.md` stays short; detail goes in `references/`.
- Blender is never a default. It stays behind an explicit user request.
- Do not add proprietary fonts, logos or copied vendor assets.
- `vendor/` holds other people's work, unmodified, with its licence. Do not edit files there: send the change upstream, or put our own guidance in `references/`. To refresh a vendored folder follow "Updating" in `vendor/README.md` and update the commit recorded there.
- Say what was not verified. Honest limits beat confident claims.

By contributing you agree that your contribution is licensed under the MIT License.

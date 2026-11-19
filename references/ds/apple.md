# Apple (Human Interface Guidelines, apple.com web)

Official source (verify before shipping): https://developer.apple.com/design/human-interface-guidelines/
Tokens: `assets/design-systems/apple/tokens.css`

## Character
Restraint, scale contrast and cinematic pacing. One huge statement against small, quiet text. Large soft shadows, translucent bars, generous margins. The product is the colour.

## Best for
Marketing and launch sites, portfolios, commerce with strong imagery, media, anything premium-minimal. Pairs naturally with 3D product models and scroll storytelling.

## Token summary
| Role | Light | Dark |
|---|---|---|
| bg / surface | `#FFFFFF` / `#F5F5F7` | `#000000` / `#1D1D1F` |
| text | `#1D1D1F` | `#F5F5F7` |
| accent | `#0071E3` | `#0071E3` (text accent adjusted for contrast) |
| radius | 8 / 12 / 18 px, pill for buttons | same |
| control height | 44 px | same |
| display | `clamp(2.5rem, 6vw, 5rem)`, 600, tight tracking | same |
| body | 17 px (1.0625rem) | same |
| ease | `cubic-bezier(.28,.11,.32,1)` standard; 500 ms base | same |

## Mechanisms to use
- One extreme type size per viewport; everything else small. Tracking tightens as size grows.
- Reveals: long ease-out (600 to 1000 ms), translate plus fade, scale 0.96 to 1; no bounce on text.
- Sticky translucent navigation (`backdrop-filter: saturate(180%) blur(20px)` on a semi-opaque bar) with a quiet local nav.
- Sections alternate light grey and white, or black and near-black, for rhythm instead of dividers.
- Large product imagery with soft contact shadow; text sits beside or beneath, never over busy areas.
- Buttons: filled accent pill for the primary, plain text link with a chevron for the secondary.

## Mechanisms to avoid
- Dense forms and tables (borrow from Fluent or Salesforce for those).
- Decorative gradients and glass cards stacked on each other; Apple's material is subtle.

## Accessibility notes
`systemBlue` `#007AFF` is the native iOS control colour; on the web, as text on white, it fails 4.5:1, so links use `--ds-accent-text`. Respect `prefers-reduced-motion`: no parallax, no scale reveals.

## Lends to other systems
Typography ladder and long ease-out motion for brand sites; blur and vibrancy layering.

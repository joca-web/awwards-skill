# Microsoft Fluent 2

Official source (verify before shipping): https://fluent2.microsoft.design/
Tokens: `assets/design-systems/fluent2/tokens.css`

## Character
Calm, precise and accessible. Compact ramp, crisp borders, small radii, layered materials (Mica for app backdrops, Acrylic for transient surfaces), strong focus handling.

## Best for
Dashboards, admin tools, fintech and healthcare products, Windows-centred software, any working UI where density and accessibility matter.

## Token summary
| Role | Light | Dark |
|---|---|---|
| bg / surface | `#FFFFFF` / `#FAFAFA` | `#292929` / `#1F1F1F` |
| text | `#242424` | `#FFFFFF` |
| accent (brand) | `#0F6CBD` | `#2174C9` |
| radius | 2 / 4 / 8 px | same |
| control height | 32 px (44 px touch targets on touch) | same |
| display | `clamp(2.5rem, 6vw, 4.25rem)`, 600 | same |
| body | 14 px / 20 px | same |
| ease | standard `cubic-bezier(.33,0,.67,1)`, 200 ms base | same |

## Mechanisms to use
- **Focus:** a two-ring outline: 2 px dark ring with a 1 px light inner ring (inverted in dark). Expose it as `--ds-focus-ring`.
- **Borders:** decorative strokes are light, interactive control borders use `--ds-border-strong` (3:1).
- **Forced colours:** `@media (forced-colors: active)` with `CanvasText`, `Highlight`; keep outlines, drop shadows.
- **Dense controls:** 32 px inputs, inline validation under the field, labels above, compact tables with clear row hover and selection.
- **Layering:** subtle shadows (2 to 8 px blur) and a slightly different surface colour; a translucent surface only for flyouts.
- **Motion:** fast and functional, 100 to 300 ms, no flourish.

## Mechanisms to avoid
- Large cinematic reveals (borrow Apple for brand moments).
- Pill-everything shapes; Fluent buttons are 4 px radius.

## Fonts
Segoe UI Variable is proprietary to Windows; the stack falls back to system fonts. Do not bundle it.

## Accessibility notes
Strong baseline: targets 44 px on touch, visible focus everywhere, forced-colours support, text contrast verified in both themes.

## Lends to other systems
Focus and accessibility; dense forms and inputs; compact type ramp; restrained elevation.

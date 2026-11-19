# Google (Material Design 3)

Official source (verify before shipping): https://m3.material.io/
Tokens: `assets/design-systems/google/tokens.css`

## Character
Tonal colour from a seed, clear component behaviour, friendly shapes, state layers that make every interaction legible. Expressive but systematic.

## Best for
Consumer flows, education, Android-first or mobile web, commerce with many interactions, any product that needs a lot of components working predictably.

## Token summary
| Role | Light | Dark |
|---|---|---|
| bg / surface | `#FEF7FF` / `#F3EDF7` | `#141218` / `#211F26` |
| text | `#1D1B20` | `#E6E0E9` |
| accent (primary) | `#6750A4` | `#D0BCFF` |
| radius | 8 / 12 / 16 px, full for buttons and chips | same |
| control height | 40 px | same |
| display | `clamp(2.25rem, 5vw, 2.8125rem)`, 400 | same |
| body | 16 px | same |
| ease | emphasized `cubic-bezier(.05,.7,.1,1)`, standard `cubic-bezier(.2,0,0,1)`; 300 ms base | same |

## Mechanisms to use
- **State layers:** overlay the content colour on a surface at hover 8 percent, focus 10 percent, pressed 10 percent, dragged 16 percent. Implement with a `::before` pseudo-element or `color-mix(in srgb, var(--ds-accent) 8%, transparent)`.
- **Tonal roles:** primary, on-primary, primary-container, on-primary-container; the pair rule (an "on-*" colour always sits on its own container) guarantees contrast.
- **Motion:** emphasized easing for entering elements; shared-axis and container-transform transitions for navigation.
- **Shape:** rounded 12 to 16 px containers; pill buttons; larger radii for hero cards.
- **Elevation:** tone, not shadow, carries most elevation in M3; shadows are light.

## Mechanisms to avoid
- Dense data grids (use Fluent or Salesforce mechanisms).
- Neon accents on dark: M3 dark uses desaturated light tones.

## Fonts
Google Sans is proprietary; do not hot-link it. Use Roboto or Roboto Flex from Google Fonts, or Inter.

## Accessibility notes
State layers must not be the only cue; keep visible focus rings. Touch targets at least 48 px on mobile web.

## Lends to other systems
Colour roles and dark mode logic; state layers; motion easing for product UI.

# Atlassian Design System

Official source (verify before shipping): https://atlassian.design/
Tokens: `assets/design-systems/atlassian/tokens.css`

## Character
Practical, structured, team-friendly. Bold headings, clear information hierarchy, a left sidebar and breadcrumbs, content-first layouts, tokens named by purpose (`color.text`, `color.background.brand.bold`, `space.100`).

## Best for
Collaboration tools, documentation, developer tools, knowledge bases, project and workflow software, anything built around spaces, pages and tickets.

## Token summary
| Role | Light | Dark |
|---|---|---|
| bg / surface | `#FFFFFF` / `#F8F8F8` | `#1F1F21` / `#18191A` |
| text | `#292A2E` | `#CECFD2` |
| accent (brand bold) | `#1868DB` | `#669DF1` |
| radius | 4 / 6 / 8 px | same |
| control height | 32 px | same |
| display | `clamp(2rem, 5vw, 3rem)`, 700 | same |
| body | 14 px | same |
| spacing | 8 px system with 4 px steps | same |
| ease | `cubic-bezier(.15,1,.3,1)`, 200 ms base | same |

## Mechanisms to use
- **Navigation:** top bar with a global search or command palette, left sidebar for the space or project, breadcrumbs for depth.
- **Content structure:** page title, byline and metadata row, then content in a readable 680 to 760 px column; side panels for properties.
- **Typography:** clear heading ladder with bold 700 headings and 14 px body; monospace for code.
- **Components:** lozenges (status chips), avatars with presence, inline editing, banners and flags for feedback.
- **Spacing:** multiples of 8 px with 4 px for tight pairings.
- **Tone:** plain, direct language; short empty states with a next action.

## Mechanisms to avoid
- Heavy cinematic motion; Atlassian is quick and quiet.
- Fully rounded pills for primary actions.

## Fonts
Atlassian Sans is distributed through Atlassian's packages; the system stack is the stand-in.

## Accessibility notes
Colour is never the only status cue: lozenges also carry text. Dark mode uses distinct elevation tones, not just a darker background.

## Lends to other systems
Navigation and structure patterns (sidebar, breadcrumbs, command palette), heading ladder for dense product UI.

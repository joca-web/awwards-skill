# Salesforce Lightning Design System (SLDS)

Official source (verify before shipping): https://www.lightningdesignsystem.com/
Tokens: `assets/design-systems/salesforce/tokens.css`

## Character
Data-first enterprise UI: record pages, related lists, sortable tables, long sectioned forms, utility bars. Light, neutral surfaces with a clear blue action colour, compact controls and a strict spacing scale.

## Best for
CRM, ERP, admin consoles, internal tools, anything with records, lists and forms at volume, and sites that live inside the Salesforce ecosystem (Experience Cloud).

## Token summary
| Role | Light | Dark |
|---|---|---|
| bg / surface | `#FFFFFF` / `#F3F3F3` | `#181818` / `#232323` |
| text | `#181818` | `#F3F3F3` |
| accent (brand) | `#0176D3` | `#0176D3` (accent text adjusted) |
| radius | 0.25 / 0.25 / 0.5 rem | same |
| control height | 2 rem | same |
| display | `clamp(2rem, 4.5vw, 3.25rem)`, 300 | same |
| body | 14 px (SLDS dense pages use 13 px) | same |
| spacing steps | 0.125, 0.25, 0.5, 0.75, 1, 1.5, 2, 3 rem | same |
| ease | `cubic-bezier(.4,0,.2,1)`, 150 ms base | same |

## Mechanisms to use
- **Record layout:** a highlights panel (name, key fields, actions), then tabbed details and related lists in cards.
- **Tables:** sortable headers, row actions in a menu, sticky header, bulk-select, inline edit, empty state with a primary action.
- **Forms:** sections with headings, two columns at wide widths, labels above, required marker, inline errors with an icon and text.
- **Page chrome:** global header with search, object tabs, utility bar at the bottom for notes and history.
- **Feedback:** toasts for success, inline banners for page-level warnings, modals only for destructive confirmation.

## Mechanisms to avoid
- Decorative motion, large hero typography, imagery-led layouts.
- Mixing in pill buttons or large radii.

## Fonts
Salesforce Sans is proprietary to Salesforce; do not bundle it. Use the system stack as set in the tokens.

## Accessibility notes
Warning orange is darkened so warning text passes 4.5:1. Do not rely on colour alone for record status; add text or icons.

## Lends to other systems
Data tables and long forms, record layouts, empty states for list views.

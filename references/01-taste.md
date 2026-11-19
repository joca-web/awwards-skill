# Taste engine

Taste is a process, not a mood. Generic output comes from skipping decisions, so this file turns each decision into a step with a check. The structure echoes the open-source Taste Skill (an agent skill that deals art directions, demands real imagery and checks in a real browser); everything below is restated and extended for this skill, and the thresholds are tuned to the inspector in `incridible-skill-3d`.

## Contents
1. Inventory
2. Deal three directions
3. The idea sentence and the signature moment
4. Imagery order
5. Copy rules
6. The anti-slop list
7. Scorecard (what the gate measures and what you judge by eye)
8. The three-round fix loop

## 1. Inventory

Before any layout, write 8 to 12 specifics that only this client has: the name and what it means, numbers, places, materials, a signature object, a catchphrase, the audience's slang, a hard constraint, a thing they refuse to look like. If the brief is thin, ask one question (the one whose answer changes most), or state your assumption and go on.

Then write the page as claims with proof, one line per section: "We [claim]. Proof: [specific]." Sections come from the argument. A hero, three feature cards and a testimonial strip is a template, not an argument.

## 2. Deal three directions

Pick three from the library, pick one, and record why the other two lost. The library is a menu of compositions; each has a signature device and a risk.

| Direction | Signature device | Fits | Risk |
|---|---|---|---|
| Monument | The name or product at poster scale, almost no chrome, one accent | Athletes, launches, events | Becomes a billboard with nothing behind it |
| Editorial paper | Serif display, uneven photographs, sentences as layout, curtain transitions | Studios, hospitality, architecture, galleries | Looks like a blog if the photographs are weak |
| Specimen | Type as the hero; huge variable-font play, nothing decorative | Foundries, publishers, brands with a voice | Unreadable body copy |
| Instrument | The page behaves like a precise device: dials, readouts, grids, monospaced data | Hardware, fintech, devtools | Cold if there is no human note |
| Cinema | Full-bleed footage or a 3D scene, scroll as the timeline, sparse text | Drinks, fragrance, cars, games | Heavy; fails without posters and fallbacks |
| Catalogue | Dense, ordered product grid with strong filtering, calm type | Commerce with many SKUs | Dull without a hero moment |
| Zine | Collage, rotated type, sticker UI, loud accents | Culture, music, youth brands | Chaos with no hierarchy |
| Quiet luxury | Huge margins, one image per screen, very slow motion | Jewellery, hotels, skincare | Blank pages read as unfinished |
| Brutal grid | Visible grid lines, system fonts, flat colour, no shadows | Collectives, studios with an attitude | Hostile to readers |
| Soft product | Pastel gradients, rounded 3D objects, friendly type | Consumer apps, kids, wellness | Generic if the 3D is generic |
| Data narrative | A story told through one live chart or map that changes on scroll | Reports, NGOs, news | The data must be real |
| Workshop | Process shown: sketches, parts, steps, real hands | Makers, craft, engineering | Needs real photographs |

The design system (phase 2) is chosen after this, because the direction sets how loud the identity is. Quiet luxury and Monument lean Apple; Instrument leans Fluent; Workshop and Data narrative can lean Atlassian or Google.

## 3. The idea sentence and the signature moment

"On this page, [something that belongs to the subject] becomes [the device the direction calls for]." Test: swap in the nearest competitor. If the sentence still works, it is too generic.

Plan exactly one signature moment the visitor can do or trigger (a reveal under the cursor, an object that turns as they read, a camera descent, a type specimen that responds to scroll). Everything else supports it. Ready parts are listed in `incridible-skill-3d/references/09-components.md`; 3D moments in `06-3d-atelier.md`.

## 4. Imagery order

Real pictures separate finished from unfinished within a second. Use, in order:
1. The client's own photographs and footage.
2. Pictures generated for the project when the user has an image generator connected, matched to the direction, with no real person's likeness and no brand marks.
3. Openly licensed photographs that allow commercial use (CC0 or equivalent), with the credit recorded and kept on the page.
4. Drawn in code: SVG, shader, 3D renders from Atelier.
5. Placeholders, marked `data-placeholder` and listed in the report.

At least four real pictures on a content page (hero, plus three), except Specimen and Instrument, which may be type- and render-led. Never ship Lorem ipsum.

## 5. Copy rules

- Write the headline, subline and one proof point before design. Headlines: two lines at 1440 px, at most three at 390 px.
- Specific beats superlative: "Ships in 36 hours from Santos" over "Lightning fast delivery".
- One voice. Loader labels, button text, 404 and empty states use it too.
- Numbers get units and context. No unexplained stats.
- Every call to action names the outcome ("Book the tasting"), not the mechanism ("Submit").

## 6. The anti-slop list

Each of these says "a model wrote this". Remove them, or replace them with a decision.
- Purple-to-blue gradient on white, or neon on black, with no reason.
- Centred hero, three equal feature cards with icons, testimonial row, final centred CTA.
- Fade-up on every element at the same speed.
- Glassmorphism cards stacked over blurred blobs.
- Emoji or icon-in-circle as the main visual.
- Stock phrases: "Unlock the power of", "seamless", "elevate your", "revolutionize".
- Uniform radii, uniform shadows, uniform spacing everywhere.
- Fonts used only at 400 and 700, no scale contrast.
- Grey rectangles standing in for images.
- 3D objects floating in a void with default lighting.

## 7. Scorecard

Awwwards weights are the frame: Design 40, Usability 30, Creativity 20, Content 10; the Developer award adds semantics, performance, accessibility, responsiveness, markup. The gate in `08-qa-gate.md` has the full numbers; the taste checks are:

Measured (the inspector or a script):
- One `h1`, visible within 1.2 s; headline line counts as above.
- Equal outer margins; no blank stretch taller than 1.5 viewports.
- At least four real pictures (content pages); at least eight moving elements on scroll; text visible under reduced motion.
- Contrast 4.5:1 text, 3:1 UI (`scripts/contrast-check.mjs`); focus visible on every control.

Judged (look at the screenshots and the filmstrip):
- Is there exactly one idea, and can you say it in one sentence?
- Is there one loud thing per viewport?
- Does the typography have a clear ladder with one extreme size?
- Do colour, type, imagery and motion agree, or does each section look like a different site?
- Does the 3D look photographed (grounded, reflecting something, textured), or CG-demo?
- Would you remember one moment tomorrow?

Score each of Design, Usability, Creativity, Content from 1 to 10 with a one-line reason. Anything under 8 gets a fix in the next round.

## 8. The three-round fix loop

Round: run the gate, view the screenshots at 1440, 768, 390, list the top three problems by impact on the scorecard, fix only those, shoot again. After three rounds, ship with the remaining issues listed in the report. Fixing everything at once makes regressions invisible.

# Motion for React (Framer Motion) in a React build

Framer Motion is now called **Motion** (`motion.dev`, repository `motiondivision/motion`, MIT, © Motion B.V.; v14.14.0 at the time of writing). Its React API is imported from `motion/react`; the old package name `framer-motion` still exists. This file says when to use it in this skill, how it plugs into the default kit, and which of its behaviours were checked.

## Contents
1. Which engine, when
2. Install and imports
3. The kit's order of events in React
4. Page transitions and shared elements
5. Buttons
6. Scroll
7. Reduced motion
8. Bundle size
9. Astryx tokens in Motion
10. What was checked, what was not

## 1. Which engine, when

| The project is | Animation engine |
|---|---|
| A static marketing or brand site (HTML, CSS, a little JS) | **GSAP + Lenis**, the kit in `12-hero-motion-system.md` and `assets/starter/` |
| A React app (Vite, Next.js, Remix), including an Astryx React app | **Motion for React** for the components; the same order of events and the same rules as `12` |
| A React app with a long scroll story, pinned acts or SplitText-grade typography | Motion for UI and state, GSAP for the scroll story; **never both on the same element** |

What stays identical whichever engine runs: a cover (preloader or page transition) before the hero, intro under the lifting cover, one smooth-scroll instance (Lenis), professional buttons, one Three.js moment with fallbacks, Astryx tokens, reduced motion honoured, `10-ui-motion-craft.md` for controls. Emil's own skills already point at Motion for springs, layout and exit animations (`vendor/emilkowalski-skills/skills/animate`).

## 2. Install and imports

```bash
npm install motion
```
```tsx
import { motion, AnimatePresence, MotionConfig, useScroll, useTransform, useSpring } from "motion/react"
```
Entry points that exist in the package: `motion/react` (full), `motion/react-client` (for Next.js server-component trees), `motion/react-m` (the `m` component for `LazyMotion`), `motion/react-mini`, and `motion` (framework-free `animate` and friends). Peer dependency: React 18 or 19. Pin the version you install; read `motion.dev` for the current API before using anything not shown here.

## 3. The kit's order of events in React

Same rule as `12` §1: cover, then start states, then the hero intro under the lifting cover, then scroll-driven motion.

```tsx
"use client"
export function Preloader({ done }: { done: boolean }) {
  return (
    // AnimatePresence must sit OUTSIDE the conditional that unmounts the child
    <AnimatePresence>
      {!done && (
        <motion.div key="preloader" className="preloader"
          style={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }} />
      )}
    </AnimatePresence>
  )
}
```
`done` becomes true when fonts, the first 3D frame and `load` have resolved and a minimum time has passed (the logic of the starter's `preloader.js`: real progress, minimum 1.5 s, 6 s ceiling). Keep the head-script failsafe from `12` §2: a page must never stay covered.

Hero intro with variants (title lines rise out of masks, the rest fades up), triggered when `done` flips:

```tsx
const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } } }
const line = { hidden: { y: "110%" }, show: { y: "0%", transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } } }

<motion.h1 variants={container} initial="hidden" animate={done ? "show" : "hidden"}>
  {lines.map((l) => <span className="mask" key={l}><motion.span variants={line}>{l}</motion.span></span>)}
</motion.h1>
```
Start the intro slightly before the cover has fully gone (flip `introReady` when the exit is about 60% through, via `onExitComplete` on a shorter timer) so it plays under the wipe, as in `12`.

## 4. Page transitions and shared elements

- **Route change with exit:** `AnimatePresence mode="wait"` around the page, keyed by the route. Direct children need a unique, stable `key`. `wait` supports one child at a time. `mode="popLayout"` pops the exiting element out of layout; a custom component directly under it must `forwardRef` to its DOM node.
- **Next.js App Router:** the Motion docs page for `AnimatePresence` says nothing about routing, and the router unmounts the old page itself, so exit animations on route change are not simply "wrap the page". Use enter animations in `template.tsx`, or the native View Transitions mode of the starter's CSS (`12` §5), and test it; this was not tried here.
- **Shared element (a card becoming a page header):** give both elements the same `layoutId`; wrap the leaving one in `AnimatePresence`. Caveats from the docs: layout animations use `scale`, so add `layout` to direct children to stop stretching and set `borderRadius`/`boxShadow` through `style` or `animate`; use `layout="position"` for images or text that change aspect ratio; scrollable elements need `layoutScroll`; children of fixed elements need `layoutRoot`; no layout animation on SVG or `display: inline`. `LayoutGroup` coordinates components that re-render at different times.
- Keep every transition under about 900 ms each way (`12` §5).

## 5. Buttons

Hover fill, label roll and focus ring stay in CSS (the starter's `site.css`): they are cheaper and gated by `@media (hover: hover) and (pointer: fine)`. Use Motion where it is better, which is press, spring and magnetic:

```tsx
const x = useMotionValue(0), y = useMotionValue(0)
const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

<motion.a className="btn btn--primary" style={{ x: sx, y: sy }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
  onPointerMove={(e) => { if (!fine) return; const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.28); y.set((e.clientY - (r.top + r.height / 2)) * 0.28) }}
  onPointerLeave={() => { x.set(0); y.set(0) }}>
  Get started
</motion.a>
```
`fine` is `matchMedia("(hover: hover) and (pointer: fine)").matches`, read in an effect. Magnetic only on the one or two primary calls to action. Spring `bounce` stays between 0.1 and 0.3 (Emil). Never start from `scale: 0`: use `initial={{ opacity: 0, scale: 0.96 }}`.

## 6. Scroll

```tsx
const ref = useRef(null)
const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
const y = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"])
const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
const smooth = useSpring(scrollYProgress)           // smoothed progress for a progress bar or the 3D scene
```
`useScroll` returns `scrollX/Y` (pixels) and `scrollXProgress/YProgress` (0 to 1 between the offsets); without `target` it tracks the window. Smooth scrolling: still one Lenis instance (`12` §3). Lenis keeps the native scroll position, so `useScroll` should keep working with it; that combination was not run here. Feed `smooth` to the Three.js scene's `setProgress`.

## 7. Reduced motion

Wrap the app once:
```tsx
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```
With `"user"`, Motion follows the operating-system setting and disables transform and layout animations while keeping opacity and colour. That matches the Astryx rule (no travel or scale): for those users a rising title simply appears. Use `useReducedMotion()` for what the config cannot know (turn off autoplay video, stop the 3D loop, remove parallax). `"always"` and `"never"` exist for a user setting inside your own UI.

## 8. Bundle size

`motion` ships every feature (the docs state about 43 kB); `LazyMotion` with the `m` component starts at about 5 kB:
```tsx
import { LazyMotion, domAnimation } from "motion/react"
import * as m from "motion/react-m"
<LazyMotion features={domAnimation} strict><m.div animate={{ opacity: 1 }} /></LazyMotion>
```
`domAnimation` covers animation and gestures (hover, tap, focus). **Layout animations and drag need `domMax`** (checked in the source: `domMax` is `domAnimation` plus `drag` plus `layout`), so a page using `layoutId` or `drag` loads `domMax`. `strict` throws if a plain `motion` component slips into a `LazyMotion` tree. Load features asynchronously (`features={() => import("./features").then((r) => r.default)}`) when hydration speed matters.

## 9. Astryx tokens in Motion

Motion does not read CSS variables for easing and duration, so mirror the Astryx tokens once in a `motion-tokens.ts`:
```ts
export const ease = { standard: [0.24, 1, 0.4, 1], emphasized: [0.3, 0, 0.6, 0.6], out: [0.23, 1, 0.32, 1] } as const
export const dur = { fast: 0.125, base: 0.3, slow: 0.7 } as const
```
Colours come from the CSS variables in `ds/tokens.css` (`--ds-*`); animate `color`, `backgroundColor` or `opacity` via classes or `style`, not by copying hex values into JS.

## 10. What was checked, what was not

Checked: the licence (MIT, © 2024 Motion B.V.), package name, version, exports and React peer range from the official repository's source; that `domMax` adds `drag` and `layout` to `domAnimation`; that `AnimatePresence`, `LazyMotion`, `MotionConfig`, `useScroll`, `useTransform`, `useSpring`, `useMotionValue`, `useReducedMotion` and `Reorder` are exported; behaviours quoted from the docs pages for quick start, `AnimatePresence`, accessibility, layout animations, `useScroll` and `LazyMotion`.

Not checked: none of the snippets above was run (the build environment had no npm access, so there was no React app to run them in). Treat them as patterns to adapt and test, and run the kit checks of `08-qa-gate.md` on the result. Next.js App Router transitions, `useScroll` with Lenis, and `motion/three` (an entry the package lists, not evaluated) are open.

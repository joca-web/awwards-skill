/* motion.js: GSAP choreography. The order is the point:
     covers (preloader or curtain)  ->  hero intro  ->  scroll-driven sections.
   Everything below is a no-op under prefers-reduced-motion: content is already visible and nothing travels or scales.
   Tools used: SplitText (line masks, autoSplit so lines re-flow on resize), ScrollTrigger (batch, scrub, once). */
const EASE = 'expo.out';

function splitLines(el) {
  let lines = [], played = false;
  if (!window.SplitText) return { prepare() {}, play() { return gsap.timeline(); } };
  SplitText.create(el, {
    type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'split-line',
    onSplit(self) { lines = self.lines; if (!played) gsap.set(lines, { yPercent: 110 }); },
  });
  return {
    play(vars = {}) { played = true; return gsap.to(lines, { yPercent: 0, duration: 1.2, ease: EASE, stagger: 0.09, ...vars }); },
  };
}

/* Sets every hero start state BEFORE the cover lifts, and returns the function that plays the intro. */
export function prepareHeroIntro({ reduce, hero3d }) {
  const hero = document.querySelector('[data-hero]');
  if (!hero || reduce || !window.gsap) return (onDone) => onDone?.();
  const title = hero.querySelector('[data-split]');
  const fades = hero.querySelectorAll('[data-hero-fade]');
  const nav = document.querySelector('[data-nav]');
  const t = title ? splitLines(title) : null;
  gsap.set(fades, { autoAlpha: 0, y: 24 });
  gsap.set(nav, { autoAlpha: 0, y: -16 });
  return (onDone) => {
    const tl = gsap.timeline({ defaults: { ease: EASE }, onComplete: () => onDone?.() });
    if (t) tl.add(t.play(), 0);
    tl.to(fades, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 0.45)
      .to(nav, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.6);
    hero3d?.intro?.();
    return tl;
  };
}

/* Scroll-driven part. Call once the page is interactive. */
export function initScrollMotion({ reduce, hero3d }) {
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  // Section titles: masked lines rise once when they enter
  document.querySelectorAll('[data-split]').forEach((el) => {
    if (el.closest('[data-hero]')) return;
    const s = splitLines(el);
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => s.play() });
  });

  // Everything else that says data-reveal: batched, staggered, once
  const items = gsap.utils.toArray('[data-reveal]');
  gsap.set(items, { autoAlpha: 0, y: 36 });
  ScrollTrigger.batch(items, {
    start: 'top 88%', once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.1, overwrite: true }),
  });

  // Marquee: scroll-scrubbed travel
  const track = document.querySelector('[data-marquee] .marquee__track');
  if (track) gsap.to(track, { xPercent: -50, ease: 'none', scrollTrigger: { trigger: '[data-marquee]', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });

  // Hero leaves: text drifts up and fades, the 3D scene receives the progress (0 to 1)
  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const inner = hero.querySelector('.hero__inner');
    gsap.to(inner, { yPercent: -12, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: true } });
    ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: (self) => hero3d?.setProgress?.(self.progress) });
  }

  // Fonts and images change layout: measure again when they have settled
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

/* scroll.js: ONE Lenis instance, driven by the GSAP ticker so ScrollTrigger and smooth scroll share one clock.
   - Touch devices keep native momentum scrolling (syncTouch is off): simulated scrolling feels wrong on a phone.
   - prefers-reduced-motion: Lenis (respectReducedMotion, on by default) tracks the input 1:1; we also skip creating it.
   - Anchors are handled by Lenis, with an offset for the fixed nav.
   - Inner scrollers (menus, modals, code blocks) get data-lenis-prevent. */
export function initScroll({ reduce }) {
  if (!window.Lenis || reduce) return null;
  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.09,                 // inertia: lower is silkier; 0.08 to 0.12 is the professional range
    wheelMultiplier: 0.9,
    smoothWheel: true,
    syncTouch: false,
    anchors: { offset: -72, duration: 1.3 },
    stopInertiaOnNavigate: true,
  });
  window.lenis = lenis;
  if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/* preloader.js: the cover shown on a fresh load, before the hero.
   - The progress is REAL: it follows the promises you pass (fonts, first 3D frame, window load), never faster than a
     minimum on-screen time, and never longer than MAX_WAIT (a slow asset must not trap the visitor).
   - First visit of the session: full sequence. Reload in the same session (.is-return): short sequence.
   - onMid fires while the panel is still wiping away, so the hero intro starts under it, not after it.
   - Resolves when the cover is gone. Reduced motion: no cover, resolves at once. */
const MAX_WAIT = 6000;

export function runPreloader({ waits = [], reduce, onMid }) {
  const root = document.documentElement;
  const el = document.querySelector('.preloader');
  const finish = () => { root.classList.remove('is-loading', 'is-return'); try { sessionStorage.setItem('seen', '1'); } catch {} };

  if (!el || reduce || !window.gsap) { finish(); onMid?.(); return Promise.resolve(); }

  const count = el.querySelector('[data-count]');
  const bar = el.querySelector('[data-bar]');
  const minTime = root.classList.contains('is-return') ? 0.55 : 1.5;   // seconds on screen
  const time = { v: 0 }, real = { v: 0 };   // separate targets: overwriting one tween must not kill the other
  let finished = 0;
  const bump = () => { finished += 1; gsap.to(real, { v: finished / Math.max(waits.length, 1), duration: 0.4, ease: 'power1.out', overwrite: true }); };
  if (waits.length) waits.forEach((p) => Promise.resolve(p).catch(() => {}).then(bump)); else real.v = 1;
  const fuse = setTimeout(() => gsap.to(real, { v: 1, duration: 0.3, overwrite: true }), MAX_WAIT);

  return new Promise((resolve) => {
    gsap.to(time, { v: 1, duration: minTime, ease: 'power2.inOut' });
    const render = () => {
      const v = Math.min(time.v, real.v);
      count.textContent = String(Math.round(v * 100)).padStart(3, '0');
      gsap.set(bar, { scaleX: v });
      if (v >= 0.999) { gsap.ticker.remove(render); clearTimeout(fuse); exit(); }
    };
    gsap.ticker.add(render);

    function exit() {
      const panel = el.querySelector('.preloader__panel');
      const content = el.querySelector('.preloader__content');
      gsap.timeline({ defaults: { ease: 'expo.inOut' }, onComplete: () => { finish(); gsap.set(el, { clearProps: 'all' }); resolve(); } })
        .to(content, { yPercent: -18, autoAlpha: 0, duration: 0.55, ease: 'power3.in' }, 0.1)
        .to(panel, { clipPath: 'inset(0 0 100% 0)', duration: 1.0 }, 0.25)
        .add(() => onMid?.(), 0.6);
    }
  });
}

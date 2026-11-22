/* transitions.js: page-to-page transition of a multi-page site.
   Mode "curtain" (default, identical in every browser): a full-bleed panel wipes up with the destination's name, the
   browser navigates, the new page starts covered (head script adds .pt-enter) and the panel lifts away.
   Mode "view" (<html data-transition="view"> plus css/view-transition.css): the browser animates the swap itself where
   it supports cross-document View Transitions; in other browsers this falls back to the curtain.
   Both: modifier clicks, new tabs, downloads, other origins, same page and #hash links are left alone; Lenis is stopped
   while leaving; back/forward cache restores are handled; links are prefetched on hover/focus. */
const KEY = 'pt';

export function initTransitions({ reduce, lenis, onArrive }) {   // onArrive runs only when arriving from another page
  const root = document.documentElement;
  const curtain = document.querySelector('.curtain');
  const label = curtain?.querySelector('.curtain__label');
  const nativeWanted = root.dataset.transition === 'view' && 'onpagereveal' in window;
  const useCurtain = !!(window.gsap && curtain) && !reduce && !nativeWanted;

  // Arriving
  let arrived = null;
  try { arrived = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch {}
  if (arrived && useCurtain) {
    if (label) label.textContent = arrived === '1' ? '' : arrived;
    gsap.set(curtain, { scaleY: 1, transformOrigin: '50% 0%' });
    gsap.set(label, { yPercent: 0, autoAlpha: 1 });
    root.classList.remove('pt-enter');           // the inline style set above keeps it covered
    gsap.timeline({ delay: 0.1 })
      .to(label, { yPercent: -110, autoAlpha: 0, duration: 0.5, ease: 'power3.in' }, 0)
      .to(curtain, { scaleY: 0, duration: 0.9, ease: 'expo.inOut' }, 0.15)
      .add(() => onArrive?.(), 0.5);
  } else if (arrived) {                           // arrived but no curtain (reduced motion): nothing to lift
    root.classList.remove('pt-enter');
    onArrive?.();
  }
  // No 'arrived': a fresh load. main.js runs the preloader instead.

  // Prefetch on intent
  const prefetched = new Set();
  const prefetch = (e) => {
    const a = e.target.closest?.('a[href]'); if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || prefetched.has(url.pathname) || url.pathname === location.pathname) return;
    prefetched.add(url.pathname);
    const l = document.createElement('link'); l.rel = 'prefetch'; l.href = url.href; document.head.append(l);
  };
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('focusin', prefetch);

  if (!useCurtain) return;

  let leaving = false;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // same page, or a #hash on it
    e.preventDefault();
    leaving = true;
    const name = a.dataset.transitionLabel || a.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) || '1';
    if (label) { label.textContent = name; gsap.set(label, { yPercent: 110, autoAlpha: 0 }); }
    lenis?.stop();
    gsap.timeline({ onComplete: () => { try { sessionStorage.setItem(KEY, name); } catch {} location.href = url.href; } })
      .set(curtain, { transformOrigin: '50% 100%' })
      .fromTo(curtain, { scaleY: 0 }, { scaleY: 1, duration: 0.75, ease: 'expo.inOut' })
      .to(label, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, 0.35);
  });

  // Back/forward cache: the page returns still covered. Lift it.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false; gsap.set(curtain, { scaleY: 0 }); lenis?.start();
  });
}

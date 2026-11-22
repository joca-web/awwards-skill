/* main.js: the order of events, which is the whole point.
     1. Something always covers the hero first: the preloader (fresh load) or the curtain (arriving from another page).
     2. Behind the cover, every start state is set, so nothing flashes when it lifts.
     3. The hero intro plays UNDER the lifting cover; scrolling unlocks when it ends.
     4. Scroll-driven motion and smooth scroll take over.
   If GSAP fails to load, the covers are removed and the page is simply a normal page. */
import { initTheme } from './theme.js';
import { initButtons } from './buttons.js';
import { initScroll } from './scroll.js';
import { runPreloader } from './preloader.js';
import { initTransitions } from './transitions.js';
import { prepareHeroIntro, initScrollMotion } from './motion.js';
import { createHero } from './hero3d.js';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function bail() { root.classList.remove('is-loading', 'pt-enter', 'pt-native', 'is-return'); }   // never leave a page covered

(function boot() {
  let hero3d = null;
  initTheme(() => hero3d?.refreshColors());
  initButtons({ reduce });

  if (!window.gsap) { bail(); return; }
  gsap.registerPlugin(window.ScrollTrigger, window.SplitText);

  const lenis = initScroll({ reduce });
  lenis?.stop();                                   // locked until the intro has played

  hero3d = createHero(document.querySelector('[data-hero-canvas]'), { reduce });
  const playIntro = prepareHeroIntro({ reduce, hero3d });

  let started = false;
  const start = () => {
    if (started) return; started = true;
    lenis?.start();
    initScrollMotion({ reduce, hero3d });
    window.ScrollTrigger && ScrollTrigger.refresh();
  };

  const arriving = root.classList.contains('pt-enter');
  const native = root.classList.contains('pt-native');   // native View Transition already revealed this page
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true }));

  if (arriving) {
    // Page transition: the curtain lifts (transitions.js), the intro plays under it
    initTransitions({ reduce, lenis, onArrive: () => { playIntro(start); setTimeout(start, 3500); } });
  } else if (native) {
    root.classList.remove('pt-native');
    initTransitions({ reduce, lenis });
    playIntro(start); setTimeout(start, 3500);
  } else {
    initTransitions({ reduce, lenis });
    runPreloader({ waits: [fonts, hero3d.ready, loaded], reduce, onMid: () => { playIntro(start); setTimeout(start, 4500); } })
      .then(() => { if (reduce) start(); });
  }
})();

/* buttons.js: the interaction layer of every .btn.
   Pure CSS does hover fill, press (scale .97) and focus. This file adds, only where they help:
   - the label roll markup (a duplicated, aria-hidden label) for [data-roll]
   - the pointer entry point for the fill (--px/--py), fine pointers only
   - a magnetic pull for [data-magnetic], fine pointers only, never under reduced motion
   - a demo loading state for [data-loading-demo] (aria-busy)  */
export function initButtons({ reduce }) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.querySelectorAll('.btn[data-roll]').forEach((btn) => {
    if (btn.querySelector('.btn__roll')) return;
    const text = btn.textContent.trim();
    btn.textContent = '';
    const roll = document.createElement('span'); roll.className = 'btn__roll';
    const a = document.createElement('span'); a.textContent = text;
    const b = document.createElement('span'); b.textContent = text; b.setAttribute('aria-hidden', 'true');
    roll.append(a, b); btn.append(roll);
  });

  if (fine) {
    document.querySelectorAll('.btn').forEach((btn) => {
      const set = (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        btn.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      };
      btn.addEventListener('pointerenter', set); btn.addEventListener('pointerleave', set);
    });
  }

  if (fine && !reduce && window.gsap) {
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      // Tween CSS variables, not transform: GSAP writes `scale: none` inline on anything whose transform it drives, which would
      // cancel the :active press. The CSS `translate` property reads --mx/--my, and `scale` stays free for the press.
      const x = gsap.quickTo(btn, '--mx', { duration: 0.6, ease: 'power3.out', unit: 'px' });
      const y = gsap.quickTo(btn, '--my', { duration: 0.6, ease: 'power3.out', unit: 'px' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.28); y((e.clientY - (r.top + r.height / 2)) * 0.28);
      });
      btn.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  document.querySelectorAll('[data-loading-demo]').forEach((btn) => btn.addEventListener('click', () => {
    btn.setAttribute('aria-busy', 'true');
    setTimeout(() => btn.removeAttribute('aria-busy'), 1400);
  }));
}

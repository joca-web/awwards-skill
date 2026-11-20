/* Rota Azul: o scroll é o tempo do vídeo. Sem bibliotecas: um laço de animação, um vídeo e alguns cálculos. */
(() => {
  'use strict';
try {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  // revelações simples (linhas "Como funciona")
  const rev = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    rev.forEach((el, i) => { el.style.transitionDelay = `${i * 90}ms`; io.observe(el); });
  } else rev.forEach((el) => el.classList.add('in'));

  document.getElementById('up')?.addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  if (reduce) return; // movimento reduzido: três cenas estáticas, sem vídeo

  // ---------- elementos ----------
  const trip = document.getElementById('trip');
  const film = trip.querySelector('.film');
  const phases = [...trip.querySelectorAll('.phase')].map((el) => ({ el, a: +el.dataset.a, b: +el.dataset.b }));
  const altEl = document.getElementById('alt');
  const railEl = document.getElementById('rail');
  const hint = document.getElementById('hint');
  const expand = document.getElementById('expand');
  const frame = document.getElementById('frame');
  const mf = document.querySelector('[data-words]');

  // manifesto: cada palavra vira um <span>
  const words = [];
  if (mf) {
    const text = mf.textContent.trim();
    mf.setAttribute('aria-label', text);
    mf.textContent = '';
    text.split(/\s+/).forEach((w, i, all) => {
      const s = document.createElement('span'); s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      mf.append(s); if (i < all.length - 1) mf.append(' '); words.push(s);
    });
  }

  // ---------- vídeo: escolhe o arquivo pelo tamanho da tela e pela conexão ----------
  const small = innerWidth < 760 || (navigator.connection && navigator.connection.saveData);
  const base = small ? 'media/trip-640' : 'media/trip-1280';
  const can = (t) => film.canPlayType(t);
  const src = can('video/mp4; codecs="avc1.42E01E"') ? `${base}.mp4` : null; // sem H.264: o poster fica parado e o texto continua legível
  let duration = 0, ready = false;
  if (src) {
    film.src = src;
    film.addEventListener('loadedmetadata', () => { duration = film.duration || 0; ready = duration > 0; }, { once: true });
    film.load();
  }
  root.classList.add('scrub'); // liga o modo "página fixa"; sem vídeo, o poster fica parado e o texto continua legível

  // ---------- altitude: pontos de passagem (progresso → metros) ----------
  const stops = [[0, 11000], [0.28, 10800], [0.62, 2500], [0.9, 0], [1, 0]];
  const altitude = (p) => {
    for (let i = 1; i < stops.length; i++) if (p <= stops[i][0]) { const [p0, a0] = stops[i - 1], [p1, a1] = stops[i]; return a0 + (a1 - a0) * smooth(0, 1, (p - p0) / (p1 - p0)); }
    return 0;
  };
  const fmt = new Intl.NumberFormat('pt-BR');
  let lastAlt = -1;

  // ---------- laço ----------
  let target = 0, cur = 0, lastT = -1;
  const read = () => {
    const r = trip.getBoundingClientRect();
    target = clamp(-r.top / Math.max(1, r.height - innerHeight));
  };
  const tick = () => {
    read();
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.0002) cur = target;

    if (ready) {
      const t = cur * duration;
      if (Math.abs(t - lastT) > 1 / 120) { try { film.currentTime = Math.min(t, duration - 0.04); } catch (_) {} lastT = t; }
    }
    for (const { el, a, b } of phases) {
      const k = smooth(a, a + 0.06, cur) * (1 - smooth(b - 0.06, b, cur));
      el.style.opacity = k.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - k) * 28).toFixed(1)}px, 0)`;
    }
    const m = Math.round(altitude(cur) / 10) * 10;
    if (m !== lastAlt) { altEl.textContent = m === 0 ? '0 m · nível do mar' : `${fmt.format(m)} m`; lastAlt = m; }
    railEl.style.transform = `scaleX(${cur.toFixed(4)})`;
    hint.style.opacity = cur > 0.02 ? 0 : 1;
    // quando a página solta o vídeo, a altitude e a barra saem antes de passar por baixo do cabeçalho
    const out = clamp((trip.getBoundingClientRect().bottom - innerHeight * 0.55) / (innerHeight * 0.35)).toFixed(3);
    altEl.parentElement.style.opacity = out; railEl.parentElement.style.opacity = out;

    if (words.length) {
      const r = mf.getBoundingClientRect();
      const p = clamp((innerHeight * 0.88 - r.top) / (r.height + innerHeight * 0.28));
      const n = p * words.length * 1.15;
      for (let i = 0; i < words.length; i++) words[i].style.opacity = (0.2 + 0.8 * clamp(n - i)).toFixed(2);
    }
    if (expand && frame) {
      const r = expand.getBoundingClientRect();
      const p = smooth(0.05, 0.75, clamp(-r.top / Math.max(1, r.height - innerHeight)));
      const mob = innerWidth < 720;
      const tb = (mob ? 10 : 14) * (1 - p), lr = (mob ? 8 : 22) * (1 - p), rad = (mob ? 24 : 32) * (1 - p);
      frame.style.clipPath = `inset(${tb.toFixed(2)}% ${lr.toFixed(2)}% round ${rad.toFixed(1)}px)`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} catch (err) { document.documentElement.classList.remove('scrub'); console.error(err); }
})();

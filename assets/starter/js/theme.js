/* theme.js: light/dark toggle on top of the Astryx tokens ([data-theme] on <html>). Stored in localStorage (guarded). */
export function initTheme(onChange) {
  const root = document.documentElement;
  const btn = document.querySelector('[data-theme-toggle]');
  const current = () => root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  btn?.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
    onChange?.(next);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => onChange?.(current()));
}

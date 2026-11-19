#!/usr/bin/env node
// contrast-check.mjs: WCAG 2.2 contrast audit of a --ds-* tokens.css (light and dark) or of any pair you give it.
//   node contrast-check.mjs assets/design-systems/apple/tokens.css          audit one system
//   node contrast-check.mjs assets/design-systems/*/tokens.css              audit several
//   node contrast-check.mjs --pair "#6E6E73" "#FFFFFF"                      one pair
// Exit code 1 when any required pair fails. Text pairs need 4.5:1, UI pairs (borders, focus, accent surfaces) 3:1.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); const n = parseInt(h.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
export const ratio = (a, b) => { const [x, y] = [lum(hex(a)), lum(hex(b))]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const TEXT = [['text', 'bg'], ['text', 'surface'], ['text', 'surface-raised'], ['text-subtle', 'bg'], ['text-subtle', 'surface'], ['text-subtle', 'surface-raised'],
  ['on-accent', 'accent'], ['accent-text', 'bg'], ['accent-text', 'surface'], ['danger', 'bg'], ['danger', 'surface'], ['success', 'bg'], ['success', 'surface'], ['warning', 'bg'], ['warning', 'surface']];
const UI = [['border-strong', 'bg'], ['focus', 'bg'], ['accent', 'bg']];

function blocks(css) {
  const out = { light: {}, dark: {} };
  const grab = (body, into) => { for (const m of body.matchAll(/--ds-([a-z-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) into[m[1]] = m[2]; };
  for (const m of css.matchAll(/:root\s*\{([^}]*)\}/g)) if (/--ds-bg:/.test(m[1])) grab(m[1], out.light);
  for (const m of css.matchAll(/\[data-theme="dark"\]\s*\{([^}]*)\}/g)) grab(m[1], out.dark);
  return out;
}


if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--pair') { const r = ratio(process.argv[3], process.argv[4]); console.log(`${r.toFixed(2)}:1  ${r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large / UI only' : 'FAIL'}`); process.exit(0); }
  const files = process.argv.slice(2).filter((a) => !a.startsWith('--')); if (!files.length) { console.error('usage: node contrast-check.mjs <tokens.css...> | --pair #fg #bg'); process.exit(2); }
  let failures = 0;
  for (const f of files) {
    const b = blocks(fs.readFileSync(f, 'utf8')); console.log(`\n${f}`);
    for (const theme of ['light', 'dark']) {
      const t = b[theme]; let bad = [];
      for (const [pairs, need, kind] of [[TEXT, 4.5, 'text'], [UI, 3, 'ui']]) for (const [fg, bg] of pairs) {
        if (!t[fg] || !t[bg]) { bad.push(`${fg}/${bg} missing`); continue; }
        const r = ratio(t[fg], t[bg]); if (r < need) bad.push(`${kind} ${fg} ${t[fg]} on ${bg} ${t[bg]} = ${r.toFixed(2)} (needs ${need})`);
      }
      failures += bad.length; console.log(`  ${theme}: ${bad.length ? 'FAIL' : 'pass'}  (${TEXT.length + UI.length} pairs)`); bad.forEach((x) => console.log('    - ' + x));
    }
  }
  console.log(failures ? `\n${failures} failing pair(s)` : '\nall pairs pass'); process.exit(failures ? 1 : 0);
}

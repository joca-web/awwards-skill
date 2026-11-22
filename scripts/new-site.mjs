#!/usr/bin/env node
// new-site.mjs: scaffold a new site from assets/starter with the design system's tokens copied in.
//   node new-site.mjs <target-dir> [--ds astryx]        (Astryx is the default and the first choice, see SKILL.md rule 2)
// The starter has: preloader, GSAP + Lenis smooth scroll, page transition (curtain or native View Transitions),
// professional buttons, a Three.js hero, light/dark toggle. Search the copy for TODO(content) and replace each one.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const args = process.argv.slice(2);
const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--ds');
const dsIdx = args.indexOf('--ds'); const ds = dsIdx >= 0 ? args[dsIdx + 1] : 'astryx';
const DS = ['astryx', 'apple', 'google', 'fluent2', 'atlassian', 'salesforce'];
if (!target) { console.error('usage: node new-site.mjs <target-dir> [--ds astryx]'); process.exit(2); }
if (!DS.includes(ds)) { console.error(`unknown --ds "${ds}". Use one of: ${DS.join(', ')}`); process.exit(2); }
if (fs.existsSync(target) && fs.readdirSync(target).length) { console.error(`${target} exists and is not empty: refusing to overwrite`); process.exit(1); }

fs.cpSync(path.join(ROOT, 'assets/starter'), target, { recursive: true });
const dsSrc = path.join(ROOT, 'assets/design-systems', ds);
fs.mkdirSync(path.join(target, 'ds'), { recursive: true });
fs.cpSync(dsSrc, path.join(target, 'ds'), { recursive: true });

if (!fs.existsSync(path.join(dsSrc, 'fonts.css'))) {    // only Astryx ships its font; the others use system fonts
  for (const f of fs.readdirSync(target).filter((n) => n.endsWith('.html'))) {
    const p = path.join(target, f);
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split('\n').filter((l) => !/ds\/fonts/.test(l)).join('\n'));
  }
}
console.log(`Created ${target} with the ${ds} design system.`);
console.log('Next: serve the folder (any static server), then replace every TODO(content) and restyle the hero.');
console.log('Then run: node scripts/contrast-check.mjs ' + path.join(target, 'ds/tokens.css'));

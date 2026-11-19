#!/usr/bin/env node
// pick-design-system.mjs: chooses the best-fit design system for a site configuration and says what to borrow from the others.
//
//   node pick-design-system.mjs --type marketing --audience consumer --density airy --tone premium-minimal --motion high --3d yes
//   node pick-design-system.mjs --type crm --audience enterprise --density compact --ecosystem salesforce
//   node pick-design-system.mjs --type dashboard --platform windows --json
//
// --type      marketing | portfolio | ecommerce | saas-app | dashboard | admin | docs | crm | devtools | collab | media | fintech | healthcare | education | mobile-web
// --audience  consumer | prosumer | enterprise | developer
// --density   airy | comfortable | compact
// --tone      premium-minimal | friendly | neutral-pro | expressive
// --platform  apple | android | windows | mixed          --ecosystem  salesforce | atlassian | none
// --motion    low | medium | high                         --3d  yes | no          --ambition  awwwards | standard
// Output: ranking with scores, the primary system (its tokens.css is the one to ship), what to borrow, and why.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const IDS = ['apple', 'google', 'fluent2', 'atlassian', 'salesforce'];
const NAME = { apple: 'Apple HIG', google: 'Google Material 3', fluent2: 'Microsoft Fluent 2', atlassian: 'Atlassian', salesforce: 'Salesforce SLDS' };

// base fit by site type: [apple, google, fluent2, atlassian, salesforce]
const TYPE = {
  marketing: [9, 6, 5, 4, 3], portfolio: [8, 6, 4, 2, 1], ecommerce: [8, 8, 5, 2, 4], 'saas-app': [5, 7, 8, 7, 6], dashboard: [4, 6, 8, 6, 8],
  admin: [3, 6, 8, 7, 8], docs: [6, 7, 6, 8, 5], crm: [2, 4, 6, 5, 10], devtools: [6, 6, 6, 8, 3], collab: [4, 6, 7, 10, 6], media: [8, 8, 4, 2, 2],
  fintech: [7, 7, 8, 5, 6], healthcare: [6, 7, 8, 5, 7], education: [6, 9, 6, 5, 4], 'mobile-web': [8, 9, 5, 3, 3],
};
const MOD = {
  audience: { consumer: [2, 2, 0, 0, 0], prosumer: [1, 1, 1, 1, 0], enterprise: [0, 0, 2, 2, 2], developer: [0, 1, 1, 2, 0] },
  density: { airy: [3, 1, 0, 0, 0], comfortable: [0, 1, 1, 0, 0], compact: [0, 0, 3, 2, 3] },
  tone: { 'premium-minimal': [3, 0, 0, 0, 0], friendly: [0, 3, 0, 1, 0], 'neutral-pro': [0, 0, 3, 1, 1], expressive: [1, 2, 0, 0, 0] },
  platform: { apple: [3, 0, 0, 0, 0], android: [0, 3, 0, 0, 0], windows: [0, 0, 3, 0, 0], mixed: [0, 0, 0, 0, 0] },
  ecosystem: { salesforce: [0, 0, 0, 0, 5], atlassian: [0, 0, 0, 5, 0], none: [0, 0, 0, 0, 0] },
  motion: { high: [2, 1, 0, -2, -2], medium: [0, 0, 0, 0, 0], low: [-1, 0, 1, 1, 1] },
  '3d': { yes: [2, 1, 0, -2, -2], no: [0, 0, 0, 0, 0] },
  ambition: { awwwards: [2, 1, 0, -1, -2], standard: [0, 0, 0, 0, 0] },
};
const REASON = {
  type: (t, id) => ({ apple: 'scale contrast, restraint and cinematic pacing suit brand storytelling', google: 'tonal colour, state layers and clear component behaviour suit broad consumer flows', fluent2: 'dense, accessible controls and strong focus handling suit working software', atlassian: 'navigation, content structure and team-tool patterns are its home ground', salesforce: 'record pages, data tables and long forms are what SLDS was built for' }[id]),
};

// what to borrow when the primary is X and the site belongs to group G (identity never mixes: only mechanisms)
const CONCERNS = ['typography and hierarchy', 'colour roles and dark mode', 'motion and easing', 'component states', 'navigation and structure', 'data tables and forms', 'focus and accessibility', 'elevation and materials'];
const BEST = {
  brand: { 'typography and hierarchy': 'apple', 'colour roles and dark mode': 'google', 'motion and easing': 'apple', 'component states': 'google', 'navigation and structure': 'apple', 'data tables and forms': 'fluent2', 'focus and accessibility': 'fluent2', 'elevation and materials': 'apple' },
  product: { 'typography and hierarchy': 'fluent2', 'colour roles and dark mode': 'google', 'motion and easing': 'google', 'component states': 'google', 'navigation and structure': 'atlassian', 'data tables and forms': 'salesforce', 'focus and accessibility': 'fluent2', 'elevation and materials': 'fluent2' },
  enterprise: { 'typography and hierarchy': 'atlassian', 'colour roles and dark mode': 'google', 'motion and easing': 'fluent2', 'component states': 'fluent2', 'navigation and structure': 'atlassian', 'data tables and forms': 'salesforce', 'focus and accessibility': 'fluent2', 'elevation and materials': 'fluent2' },
};
const GROUP = { marketing: 'brand', portfolio: 'brand', ecommerce: 'brand', media: 'brand', 'mobile-web': 'brand', education: 'brand', 'saas-app': 'product', docs: 'product', devtools: 'product', collab: 'product', fintech: 'product', healthcare: 'product', dashboard: 'enterprise', admin: 'enterprise', crm: 'enterprise' };
const WHY_BORROW = {
  apple: { 'typography and hierarchy': 'one huge size against small text, tight tracking, 600 weight', 'motion and easing': 'long ease-out reveals, scale and parallax, no bounce on text', 'navigation and structure': 'sticky translucent bar with a quiet local nav', 'elevation and materials': 'blur and vibrancy layers, soft large shadows' },
  google: { 'colour roles and dark mode': 'tonal palette roles (primary, container, on-*) and accessible dark mode', 'motion and easing': 'emphasized easing with shared-axis and container transforms', 'component states': 'state layers: hover 8%, focus 10%, pressed 10%' },
  fluent2: { 'typography and hierarchy': 'compact ramp (14/20 body) for dense UI', 'data tables and forms': 'dense inputs with strong borders and inline validation', 'focus and accessibility': 'two-ring focus outline, forced-colors support, 32px controls with 44px touch targets', 'elevation and materials': 'Mica/Acrylic style layering, restrained shadows', 'component states': 'crisp, fast state changes (100 to 200 ms)', 'motion and easing': 'fast, functional transitions (100 to 300 ms)' },
  atlassian: { 'typography and hierarchy': 'clear heading ladder with bold 700 headings', 'navigation and structure': 'left sidebar, breadcrumbs, spaces, command palette', },
  salesforce: { 'data tables and forms': 'record layouts, sortable tables, section forms, empty states' },
};

const args = process.argv.slice(2); const get = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const asJson = args.includes('--json');
const cfg = { type: get('type', 'marketing'), audience: get('audience', 'consumer'), density: get('density', 'comfortable'), tone: get('tone', ''), platform: get('platform', 'mixed'), ecosystem: get('ecosystem', 'none'), motion: get('motion', 'medium'), '3d': get('3d', 'no'), ambition: get('ambition', 'standard') };
if (!TYPE[cfg.type]) { console.error(`unknown --type "${cfg.type}". Use one of: ${Object.keys(TYPE).join(', ')}`); process.exit(2); }

const score = [...TYPE[cfg.type]]; const notes = IDS.map(() => []);
for (const [k, table] of Object.entries(MOD)) { const row = table[cfg[k]]; if (!row) continue; row.forEach((v, i) => { score[i] += v; if (v >= 2) notes[i].push(`${k}=${cfg[k]} (+${v})`); }); }
const ranked = IDS.map((id, i) => ({ id, name: NAME[id], score: score[i], why: notes[i] })).sort((a, b) => b.score - a.score);
const primary = ranked[0], second = ranked[1], margin = primary.score - second.score;
const group = GROUP[cfg.type], lends = {};
for (const c of CONCERNS) { const best = BEST[group][c]; if (best !== primary.id && WHY_BORROW[best]?.[c]) lends[c] = { from: NAME[best], take: WHY_BORROW[best][c] }; }

const result = {
  config: cfg, primary: { id: primary.id, name: primary.name, tokens: path.join(HERE, '..', 'assets/design-systems', primary.id, 'tokens.css'), reference: `references/ds/${primary.id}.md`, whyFits: REASON.type(cfg.type, primary.id), signals: primary.why },
  runnerUp: { id: second.id, name: second.name, score: second.score }, confidence: margin >= 4 ? 'high' : margin >= 2 ? 'medium' : 'low (a near tie: decide from the brand, then record why)',
  ranking: ranked.map((r) => ({ id: r.id, score: r.score })), borrow: lends,
  rules: ['Ship ONE tokens.css (the primary). Never mix two systems\' colours, fonts or radii.', 'Borrow mechanisms only (the "take" lines), restated in the primary\'s tokens.',
    group === 'brand' ? 'Brand sites: the design system owns the systemic layer (type scale, spacing, forms, focus, states); the art direction owns the hero, imagery and signature moment.' : 'Product UI: follow the system strictly for components; spend creativity on information design and empty/loading/error states.'],
};
if (asJson) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`\nPrimary: ${result.primary.name}  (score ${primary.score}, confidence ${result.confidence})`);
  console.log(`  why: ${result.primary.whyFits}${result.primary.signals.length ? '; ' + result.primary.signals.join(', ') : ''}`);
  console.log(`  tokens: ${path.relative(process.cwd(), result.primary.tokens)}   notes: ${result.primary.reference}`);
  console.log(`Runner-up: ${second.name} (${second.score})\nRanking: ${ranked.map((r) => `${r.id} ${r.score}`).join(' | ')}\n\nBorrow (mechanisms only):`);
  const keys = Object.keys(lends); if (!keys.length) console.log('  nothing: the primary already covers these concerns'); keys.forEach((k) => console.log(`  - ${k}: from ${lends[k].from}: ${lends[k].take}`));
  console.log('\nRules:'); result.rules.forEach((r) => console.log('  - ' + r)); console.log();
}

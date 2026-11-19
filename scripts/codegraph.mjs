#!/usr/bin/env node
// codegraph.mjs: "graphify-lite". Maps a site or repo into a graph you can query instead of grepping, with no installs.
//   node codegraph.mjs <dir> [--out .apex/graph]
// Writes graph.json (nodes, edges, every edge tagged EXTRACTED because it comes from parsing, never from guessing),
// GRAPH_REPORT.md (entry points, hubs, orphans, broken references, design-token health, libraries, clusters)
// and graph.html (a self-contained, searchable list view). For deep multi-language code graphs install the real
// Graphify (see references/04-graphify.md); this covers the web stack (HTML, CSS, JS/TS, Markdown) offline.
import fs from 'node:fs'; import path from 'node:path';

const argv = process.argv.slice(2), root = path.resolve(argv.find((a) => !a.startsWith('--')) || '.'), oi = argv.indexOf('--out'), OUT = path.resolve(oi >= 0 ? argv[oi + 1] : '.apex/graph');
const SKIP = new Set(['node_modules', '.git', '.apex', 'dist', 'build', '.next', 'coverage', '.cache', 'graphify-out']);
const EXT = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.md', '.svg', '.json']);
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (EXT.has(path.extname(e.name).toLowerCase())) files.push(p); } })(root);
const rel = (p) => path.relative(root, p).split(path.sep).join('/'); const ids = new Set(files.map(rel));
const nodes = new Map(), edges = [], broken = [], defs = new Map(), uses = new Map(), libs = {};
const LIBS = { gsap: /\bgsap\b/, ScrollTrigger: /ScrollTrigger/, Lenis: /\bLenis\b|lenis/, three: /from ['"]three|THREE\./, 'Flip': /\bFlip\b/, SplitText: /SplitText/, Barba: /barba/i, React: /from ['"]react['"]|React\./, Tailwind: /tailwind/i };
const external = (r) => /^(https?:|\/\/|data:|mailto:|tel:|#|javascript:|blob:)/.test(r) || r.startsWith('{') || r.includes('${');
function resolve(from, ref) {
  ref = ref.split('#')[0].split('?')[0]; if (!ref || external(ref)) return null;
  const base = ref.startsWith('/') ? path.join(root, ref) : path.resolve(path.dirname(from), ref);
  for (const c of [base, base + '.js', base + '.mjs', base + '.ts', base + '.tsx', base + '.jsx', base + '.css', path.join(base, 'index.html'), path.join(base, 'index.js'), path.join(base, 'index.ts')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return rel(c);
  return undefined; // local reference that does not exist
}
for (const f of files) {
  const id = rel(f), ext = path.extname(f).toLowerCase(), txt = fs.readFileSync(f, 'utf8'); const n = { id, kind: ext.slice(1), lines: txt.split('\n').length, bytes: txt.length }; nodes.set(id, n);
  const add = (ref, kind) => { const t = resolve(f, ref); if (t === null) return; if (t === undefined) { broken.push({ from: id, ref, kind }); return; } edges.push({ from: id, to: t, kind, tag: 'EXTRACTED' }); };
  if (ext === '.html' || ext === '.htm') { for (const m of txt.matchAll(/<(?:script|img|source|video|audio|iframe)[^>]*\ssrc=["']([^"']+)["']/gi)) add(m[1], 'src'); for (const m of txt.matchAll(/<link[^>]*\shref=["']([^"']+)["']/gi)) add(m[1], 'link'); for (const m of txt.matchAll(/<a[^>]*\shref=["']([^"'#][^"']*)["']/gi)) add(m[1], 'href'); }
  if (/\.(m?js|cjs|tsx?|jsx)$/.test(ext)) for (const m of txt.matchAll(/(?:import[^'"]*?from\s*|import\s*\(\s*|import\s+|require\(\s*)['"]([^'"]+)['"]/g)) if (m[1].startsWith('.') || m[1].startsWith('/')) add(m[1], 'import');
  if (ext === '.css') { for (const m of txt.matchAll(/@import\s+(?:url\()?['"]?([^'")]+)/g)) add(m[1], 'import'); for (const m of txt.matchAll(/url\(\s*['"]?([^'")]+)/g)) add(m[1], 'url'); for (const m of txt.matchAll(/(--[\w-]+)\s*:/g)) (defs.get(m[1]) || defs.set(m[1], new Set()).get(m[1])).add(id); }
  for (const m of txt.matchAll(/var\(\s*(--[\w-]+)/g)) (uses.get(m[1]) || uses.set(m[1], new Set()).get(m[1])).add(id);
  for (const [k, re] of Object.entries(LIBS)) if (re.test(txt)) (libs[k] ||= []).push(id);
}
for (const e of edges) if (!nodes.has(e.to)) nodes.set(e.to, { id: e.to, kind: path.extname(e.to).slice(1) || 'file', lines: 0, bytes: 0 });   // assets we link to but do not parse (images, fonts)
const deg = new Map([...nodes.keys()].map((k) => [k, { in: 0, out: 0 }])); for (const e of edges) { deg.get(e.from).out++; deg.get(e.to).in++; }
const entries = [...nodes.values()].filter((n) => n.kind.startsWith('htm') && deg.get(n.id).in === 0).map((n) => n.id);
const orphans = [...nodes.values()].filter((n) => !['md', 'json', 'svg'].includes(n.kind) && deg.get(n.id).in === 0 && deg.get(n.id).out === 0 && !entries.includes(n.id)).map((n) => n.id);
const hubs = [...deg.entries()].sort((a, b) => b[1].in + b[1].out - (a[1].in + a[1].out)).slice(0, 8);
const undef = [...uses.keys()].filter((k) => !defs.has(k)), unused = [...defs.keys()].filter((k) => !uses.has(k));
const parent = new Map([...nodes.keys()].map((k) => [k, k])); const find = (x) => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x))), parent.get(x))); for (const e of edges) parent.set(find(e.from), find(e.to));
const clusters = {}; for (const k of nodes.keys()) (clusters[find(k)] ||= []).push(k); const groups = Object.values(clusters).sort((a, b) => b.length - a.length);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'graph.json'), JSON.stringify({ root, nodes: [...nodes.values()], edges, broken, tokens: { defined: [...defs.keys()], undefinedUses: undef, unused }, libraries: libs }, null, 1));
const L = (a, n = 12) => (a.length ? a.slice(0, n).map((x) => `- ${x}`).join('\n') + (a.length > n ? `\n- … ${a.length - n} more` : '') : '- none');
const report = `# Code graph report\n\nRoot: \`${root}\`\n\n${nodes.size} files, ${edges.length} resolved references (all EXTRACTED by parsing), ${broken.length} broken.\n\n## Entry points (HTML nobody links to)\n${L(entries)}\n\n## Hubs (most connected: change these carefully)\n${hubs.map(([k, d]) => `- ${k} (in ${d.in}, out ${d.out})`).join('\n')}\n\n## Broken local references (fix first)\n${L(broken.map((b) => `${b.from} → ${b.ref} (${b.kind})`))}\n\n## Orphans (not referenced, referencing nothing)\n${L(orphans)}\n\n## Design tokens\n- defined: ${defs.size}, used: ${uses.size}\n- used but never defined (bugs or runtime-set):\n${L(undef.map((x) => '  ' + x), 10)}\n- defined but never used (dead tokens):\n${L(unused.map((x) => '  ' + x), 10)}\n\n## Libraries detected\n${Object.keys(libs).length ? Object.entries(libs).map(([k, v]) => `- ${k}: ${v.length} file(s) (${v.slice(0, 3).join(', ')})`).join('\n') : '- none'}\n\n## Clusters (files that reference each other)\n${groups.slice(0, 6).map((g, i) => `- cluster ${i + 1}: ${g.length} files, e.g. ${g.slice(0, 4).join(', ')}`).join('\n')}\n\n## Questions worth asking next\n- Which entry point owns the most weight? Which hub, if rewritten, breaks the most files?\n- Are the broken references real, or generated at build time?\n- Do the dead tokens mean an abandoned design system layer?\n`;
fs.writeFileSync(path.join(OUT, 'GRAPH_REPORT.md'), report);
const rows = [...nodes.values()].map((n) => `<tr><td>${n.id}</td><td>${n.kind}</td><td>${n.lines}</td><td>${deg.get(n.id).in}</td><td>${deg.get(n.id).out}</td></tr>`).join('');
fs.writeFileSync(path.join(OUT, 'graph.html'), `<!doctype html><meta charset=utf-8><title>Code graph</title><style>body{font:14px system-ui;margin:24px}input{padding:8px;width:320px}td,th{padding:4px 12px;text-align:left}tr:hover{background:#eee}</style><h1>Code graph</h1><input id=q placeholder="filter files" oninput="for(const r of document.querySelectorAll('tbody tr'))r.hidden=!r.textContent.includes(this.value)"><table><thead><tr><th>file<th>kind<th>lines<th>in<th>out<tbody>${rows}</table>`);
console.log(`${nodes.size} files, ${edges.length} references, ${broken.length} broken, ${undef.length} undefined tokens → ${path.relative(process.cwd(), OUT)}/GRAPH_REPORT.md`);

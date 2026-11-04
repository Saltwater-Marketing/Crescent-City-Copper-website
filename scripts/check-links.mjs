// Every link to this site from every built page must lead to a built page or a redirect.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { redirect, built } from './redirects.mjs';
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })('_site');
const bad = new Map();
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/href="(\/(?!\/)[^"#?]*)/g)) {
    const u = m[1];
    if (built(u)) continue;
    const to = redirect(u);
    if (to && (to.startsWith('http') || built(to))) continue;
    if (!bad.has(u)) bad.set(u, new Set());
    bad.get(u).add(f.replace(/^_site/, '').replace(/index\.html$/, ''));
  }
}
console.log(`${files.length} pages checked, ${bad.size} broken internal link targets`);
for (const [u, from] of bad) console.log(`${u}  <- ${[...from].slice(0, 4).join(', ')}${from.size > 4 ? ` (+${from.size - 4})` : ''}`);
process.exit(bad.size ? 1 : 0);

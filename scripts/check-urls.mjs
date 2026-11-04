// Every URL of the current site (docs/URL-INVENTORY.csv) must exist on the new site, or 301 somewhere that does.
// Run after a build: npm run build && npm run check:urls
import { readFileSync } from 'node:fs';
import { redirect, built } from './redirects.mjs';
const rows = readFileSync('docs/URL-INVENTORY.csv', 'utf8').trim().split('\n').slice(1).map(l => l.split(','));
let ok = 0, moved = 0; const bad = [];
for (const [path, type] of rows) {
  if (built(path)) { ok++; continue; }
  const to = redirect(path);
  if (to && (to.startsWith('http') || built(to))) { moved++; continue; }
  bad.push(`${path} (${type})${to ? ' -> ' + to + ' (missing)' : ''}`);
}
console.log(`${rows.length} old URLs: ${ok} built, ${moved} redirected, ${bad.length} missing`);
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }

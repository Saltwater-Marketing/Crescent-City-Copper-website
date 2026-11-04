// Shared helper: reads the [[redirects]] rules from netlify.toml and answers "where does this path go?"
import { readFileSync, existsSync } from 'node:fs';
const rules = [...readFileSync('netlify.toml', 'utf8').matchAll(/\[\[redirects\]\]\s*from = "([^"]+)"\s*to = "([^"]+)"/g)]
  .map(m => ({ from: m[1], to: m[2] })).filter(r => r.from.startsWith('/'));
export function redirect(path) {
  for (const r of rules) {
    if (r.from.endsWith('/*') && (path.startsWith(r.from.slice(0, -1)) || path === r.from.slice(0, -2))) return r.to.replace(':splat', path.slice(r.from.length - 1));
    if (path === r.from) return r.to;
  }
  return null;
}
export function built(path) {
  const p = decodeURIComponent(path.split(/[?#]/)[0]);
  return existsSync('_site' + p + (p.endsWith('/') ? 'index.html' : '')) || existsSync('_site' + p);
}

#!/usr/bin/env node
// READ-ONLY: GETs every public product page (from the product sitemap) and records the
// WooCommerce Product Add-ons fields shown on it (name, label, required, choices with price text).
// Usage (cloud session): NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node scripts/scan-product-options.mjs
import { readFile, writeFile } from 'node:fs/promises';
const OUT = 'docs/discovery-data/product-options.json';
const sm = JSON.parse(await readFile('docs/discovery-data/sitemap-urls.json', 'utf8'));
const urls = sm.urls.filter(u => /product-sitemap/.test(u.sitemap) && /\/product\//.test(u.url)).map(u => u.url);
const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&#0?36;|&#x24;/g, '$').replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#8243;|&quot;/g, '"').replace(/&#8242;/g, "'").replace(/\s+/g, ' ').trim();
const out = [];
for (const url of urls) {
  const res = await fetch(url, { headers: { 'User-Agent': 'SWM-CCC-Discovery/1.0 (read-only)' } });
  const html = await res.text();
  const addons = [];
  for (const m of html.matchAll(/<div class="wc-pao-addon-container([^"]*)"[\s\S]*?(?=<div class="wc-pao-addon-container|<div id="product-addons-total"|$)/g)) {
    const block = m[0];
    const label = strip((block.match(/class="wc-pao-addon-name"[^>]*>([\s\S]*?)<\/label>/) || [])[1] || '');
    const name = (block.match(/name="(addon-[^"\[]+)/) || [])[1];
    const type = (block.match(/wc-pao-addon-field wc-pao-addon-([a-z_-]+)/) || [])[1];
    const choices = [...block.matchAll(/<option data-raw-price="([^"]*)"[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)]
      .map(o => ({ value: o[2], price: o[1], label: strip(o[3]) }));
    addons.push({ name, label, type, required: /wc-pao-required-addon/.test(m[1]), choices });
  }
  const price = strip((html.match(/<p class="price">([\s\S]*?)<\/p>/) || [])[1] || '');
  const cartButton = /name="add-to-cart"/.test(html);
  const yith = (html.match(/yith-wapo-block|yith-wapo-addon/g) || []).length;
  out.push({ url, status: res.status, price, cartButton, yithBlocks: yith, addons });
  process.stdout.write('.');
}
await writeFile(OUT, JSON.stringify(out, null, 2));
console.log(`\n${out.length} products -> ${OUT}`);

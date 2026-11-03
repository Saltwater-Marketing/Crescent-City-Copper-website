#!/usr/bin/env node
// Phase 0, part 2: READ-ONLY WooCommerce REST v3 reads with the read-only key (live site; there is no staging).
// GET only. Saves settings and catalog structure; no customer names, emails or addresses (role counts only).
// Usage: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node scripts/discovery-rest.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
if (existsSync('.env')) for (const l of (await readFile('.env', 'utf8')).split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const BASE = (process.env.WC_URL || 'https://crescentcitycopper.com').replace(/\/$/, '');
const auth = 'Basic ' + Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
const OUT = 'docs/discovery-data';
async function get(path) {
  const r = await fetch(BASE + path, { method: 'GET', headers: { Authorization: auth, 'User-Agent': 'SWM-CCC-Discovery/1.0 (read-only)' } });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { status: r.status, body: t.slice(0, 300) }; }
  return { status: r.status, total: r.headers.get('x-wp-total'), json: j };
}
async function all(path) {
  const out = [];
  for (let p = 1; p < 50; p++) {
    const r = await get(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${p}`);
    if (!Array.isArray(r.json)) return p === 1 ? r.json : out;
    out.push(...r.json); if (r.json.length < 100) break;
  }
  return out;
}
const save = (n, d) => writeFile(`${OUT}/${n}.json`, JSON.stringify(d, null, 2));
const step = async (n, fn) => { process.stdout.write(`- ${n} ... `); try { await save(n, await fn()); console.log('ok'); } catch (e) { console.log('FAILED ' + e.message); } };

await step('wc-system-status', async () => {
  const j = (await get('/wp-json/wc/v3/system_status')).json;
  const env = j.environment || {};
  return { environment: { home_url: env.home_url, wp_version: env.wp_version, php_version: env.php_version, server_info: env.server_info,
      mysql_version: env.mysql_version_string, wp_memory_limit: env.wp_memory_limit, wp_debug_mode: env.wp_debug_mode, wp_cron: env.wp_cron,
      external_object_cache: env.external_object_cache, max_upload_size: env.max_upload_size },
    active_plugins: j.active_plugins, inactive_plugins: j.inactive_plugins, dropins_mu_plugins: j.dropins_mu_plugins, theme: j.theme,
    settings: j.settings, pages: j.pages };
});
await step('wc-products', async () => (await all('/wp-json/wc/v3/products?status=any&_fields=id,name,slug,status,type,catalog_visibility,sku,price,regular_price,sale_price,stock_status,manage_stock,stock_quantity,purchasable,categories,tags,images,dimensions,weight,shipping_class,meta_data,date_modified'))
  .map(p => ({ ...p, images: (p.images || []).map(i => ({ src: i.src, alt: i.alt })),
    meta_data: (p.meta_data || []).filter(m => !/^_?(wc_|yoast_wpseo_focuskw)/.test(m.key) || /addon/i.test(m.key)) })));
await step('wc-categories', () => all('/wp-json/wc/v3/products/categories?_fields=id,name,slug,parent,count,display,description,image'));
await step('wc-global-addons', async () => (await get('/wp-json/wc-product-add-ons/v2/global-add-ons')).json);
await step('wc-shipping', async () => {
  const zones = (await get('/wp-json/wc/v3/shipping/zones')).json;
  if (!Array.isArray(zones)) return zones;
  for (const z of zones) { z.locations = (await get(`/wp-json/wc/v3/shipping/zones/${z.id}/locations`)).json; z.methods = (await get(`/wp-json/wc/v3/shipping/zones/${z.id}/methods`)).json; }
  return { zones, classes: (await get('/wp-json/wc/v3/products/shipping_classes')).json };
});
await step('wc-payment-gateways', async () => {
  const g = (await get('/wp-json/wc/v3/payment_gateways')).json;
  return Array.isArray(g) ? g.map(x => ({ id: x.id, title: x.title, enabled: x.enabled, method_title: x.method_title })) : g;
});
await step('wc-tax', async () => ({ classes: (await get('/wp-json/wc/v3/taxes/classes')).json, rates: (await get('/wp-json/wc/v3/taxes?per_page=100')).json }));
await step('wc-coupons-count', async () => { const r = await get('/wp-json/wc/v3/coupons?per_page=1'); return { total: r.total }; });
await step('wc-webhooks', async () => { const w = await all('/wp-json/wc/v3/webhooks'); return Array.isArray(w) ? w.map(x => ({ id: x.id, name: x.name, status: x.status, topic: x.topic, delivery_url_host: (() => { try { return new URL(x.delivery_url).host; } catch { return null; } })() })) : w; });
await step('wc-customer-roles', async () => {
  const counts = {}; let total = 0;
  for (let p = 1; p < 200; p++) {
    const r = await get(`/wp-json/wc/v3/customers?role=all&per_page=100&page=${p}&_fields=role`);
    if (!Array.isArray(r.json)) return { error: r.json };
    for (const c of r.json) { counts[c.role] = (counts[c.role] || 0) + 1; total++; }
    if (r.json.length < 100) break;
  }
  return { total, byRole: counts };
});
await step('wc-orders-summary', async () => {
  const r = await get('/wp-json/wc/v3/orders?per_page=1&_fields=id,date_created,status');
  const year = await get('/wp-json/wc/v3/orders?per_page=1&after=2025-11-01T00:00:00&_fields=id');
  return { total: r.total, last12Months: year.total, newest: r.json?.[0]?.date_created };
});
console.log('done');

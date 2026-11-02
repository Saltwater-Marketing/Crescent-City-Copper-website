#!/usr/bin/env node
// Phase 0 discovery: READ-ONLY. Every request is a GET; anything else throws.
// Usage: node scripts/discovery.mjs   (reads settings from .env or environment variables)
// In a Claude Code cloud session, route requests through the session proxy:
//   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node scripts/discovery.mjs
// Output: raw JSON in docs/discovery-data/ (no credentials, no customer data).

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// ---------- settings ----------
if (existsSync('.env')) {
  for (const line of (await readFile('.env', 'utf8')).split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const LIVE = (process.env.WP_LIVE_URL || process.env.LIVE_URL || 'https://crescentcitycopper.com').replace(/\/$/, '');
const STAGING = (process.env.WP_STAGING_URL || process.env.STAGING_URL || '').replace(/\/$/, '');
const { WP_USER, WP_APP_PASSWORD, WC_CONSUMER_KEY, WC_CONSUMER_SECRET } = process.env;
const OUT = 'docs/discovery-data';
await mkdir(OUT, { recursive: true });

// ---------- GET-only HTTP ----------
async function get(url, { auth, raw } = {}) {
  const headers = { 'User-Agent': 'SWM-CCC-Discovery/1.0 (read-only)' };
  if (auth === 'wp' && WP_USER && WP_APP_PASSWORD)
    headers.Authorization = 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD.replace(/\s+/g, '')}`).toString('base64');
  if (auth === 'wc' && WC_CONSUMER_KEY && WC_CONSUMER_SECRET)
    headers.Authorization = 'Basic ' + Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(url, { method: 'GET', headers, redirect: 'manual' });
  const body = await res.text();
  const out = { url, status: res.status, headers: Object.fromEntries(res.headers), body };
  if (raw) return out;
  try { out.json = JSON.parse(body); } catch { /* not JSON */ }
  return out;
}
async function getAllPages(base, auth) {
  const items = [];
  for (let page = 1; page < 200; page++) {
    const sep = base.includes('?') ? '&' : '?';
    const r = await get(`${base}${sep}per_page=100&page=${page}`, { auth });
    if (r.status !== 200 || !Array.isArray(r.json)) { if (page === 1) return { error: r.status, body: r.body.slice(0, 500) }; break; }
    items.push(...r.json);
    if (r.json.length < 100) break;
  }
  return items;
}
const save = (name, data) => writeFile(`${OUT}/${name}.json`, JSON.stringify(data, null, 2));
const step = async (name, fn) => {
  process.stdout.write(`- ${name} ... `);
  try { const d = await fn(); await save(name, d); console.log('ok'); return d; }
  catch (e) { console.log('FAILED: ' + e.message); await save(name, { error: e.message }); }
};

// ---------- 1. Store API (public, live) ----------
const products = await step('store-products', () => getAllPages(`${LIVE}/wp-json/wc/store/v1/products`));
await step('store-categories', () => getAllPages(`${LIVE}/wp-json/wc/store/v1/products/categories`));
await step('store-attributes', async () => (await get(`${LIVE}/wp-json/wc/store/v1/products/attributes`)).json);
await step('product-type-summary', async () => {
  if (!Array.isArray(products)) return { error: 'no products' };
  const byType = {};
  for (const p of products) byType[p.type] = (byType[p.type] || 0) + 1;
  return {
    total: products.length, byType,
    withAttributes: products.filter(p => p.attributes?.length).length,
    withVariations: products.filter(p => p.variations?.length).length,
    // Fields that hint at add-on plugins (extra option fields beyond variations)
    extensionKeys: [...new Set(products.flatMap(p => Object.keys(p.extensions || {})))],
  };
});

// ---------- 2. Sitemaps (live) ----------
await step('sitemap-urls', async () => {
  const seen = new Set(), urls = [], queue = [`${LIVE}/sitemap_index.xml`, `${LIVE}/wp-sitemap.xml`, `${LIVE}/sitemap.xml`];
  while (queue.length) {
    const sm = queue.shift();
    if (seen.has(sm)) continue; seen.add(sm);
    const r = await get(sm, { raw: true });
    if (r.status !== 200) continue;
    const locs = [...r.body.matchAll(/<loc>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*<\/loc>/g)].map(m => m[1].trim());
    if (/<sitemapindex/i.test(r.body)) queue.push(...locs);
    else for (const u of locs) urls.push({ url: u, sitemap: sm });
  }
  return { sitemaps: [...seen], count: urls.length, urls };
});

// ---------- 3. Tracking + hosting (live, public HTML and headers) ----------
const TRACKERS = {
  gtm: /GTM-[A-Z0-9]{4,9}/g, ga4: /G-[A-Z0-9]{6,12}/g, uaLegacy: /UA-\d{4,10}-\d+/g,
  googleAds: /AW-\d{6,12}/g, metaPixel: /fbq\(\s*['"]init['"]\s*,\s*['"](\d{8,20})/g,
  localiq: /localiq|reachlocal|rl_siteid|cdn\.rlets\.com/gi, callTracking: /callrail|calltrk|rlets|dni/gi,
  hotjar: /hotjar|hjid/gi, clarity: /clarity\.ms/gi, forms: /gravityforms|gform_|wpforms|contact-form-7|wpcf7|hsforms|jotform|typeform/gi,
};
await step('page-scan', async () => {
  const pages = { home: `${LIVE}/`, cart: `${LIVE}/cart/` };
  if (Array.isArray(products) && products[0]) pages.product = products[0].permalink;
  const out = {};
  for (const [label, url] of Object.entries(pages)) {
    const r = await get(url, { raw: true });
    const html = r.body;
    const found = {};
    for (const [k, re] of Object.entries(TRACKERS)) {
      const hits = [...html.matchAll(re)].map(m => m[1] || m[0]);
      if (hits.length) found[k] = [...new Set(hits)];
    }
    const pick = h => Object.fromEntries(Object.entries(r.headers).filter(([k]) =>
      /^(server|x-powered-by|x-cache|cf-|x-litespeed|x-kinsta|x-sucuri|via|age|cache-control|x-proxy|x-served-by|x-wpe|x-turbo)/i.test(k)));
    out[label] = {
      url, status: r.status, bytes: html.length, hosting: pick(r.headers), trackers: found,
      generator: [...html.matchAll(/<meta name="generator" content="([^"]+)"/g)].map(m => m[1]),
      // Plugin and theme folder names visible in the page source (front-end footprint)
      pluginSlugs: [...new Set([...html.matchAll(/wp-content\/plugins\/([a-z0-9_-]+)/gi)].map(m => m[1]))].sort(),
      themeSlugs: [...new Set([...html.matchAll(/wp-content\/themes\/([a-z0-9_-]+)/gi)].map(m => m[1]))],
      scripts: [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].length,
      stylesheets: [...html.matchAll(/<link[^>]+rel=['"]stylesheet['"]/g)].length,
    };
  }
  return out;
});

// ---------- 4. Staging, authenticated (read-only) ----------
if (WP_USER && WP_APP_PASSWORD) {
  await step('staging-plugins', async () => (await get(`${STAGING}/wp-json/wp/v2/plugins?context=view`, { auth: 'wp' })).json);
  await step('staging-themes', async () => (await get(`${STAGING}/wp-json/wp/v2/themes`, { auth: 'wp' })).json);
  await step('staging-me', async () => {
    // Only the app user's own roles/capabilities, to confirm what the key can and cannot do.
    const j = (await get(`${STAGING}/wp-json/wp/v2/users/me?context=edit`, { auth: 'wp' })).json || {};
    return { roles: j.roles, capabilityCount: j.capabilities && Object.keys(j.capabilities).length };
  });
} else console.log('- staging (WP application password): skipped, WP_USER / WP_APP_PASSWORD not set');

if (WC_CONSUMER_KEY && WC_CONSUMER_SECRET) {
  await step('staging-wc-system-status', async () => {
    const j = (await get(`${STAGING}/wp-json/wc/v3/system_status`, { auth: 'wc' })).json || {};
    // Keep environment, plugins, theme, settings; drop anything else.
    return { environment: j.environment, database: j.database && { wc_database_version: j.database.wc_database_version },
      active_plugins: j.active_plugins, inactive_plugins: j.inactive_plugins, theme: j.theme, settings: j.settings };
  });
  await step('staging-wc-attributes', () => getAllPages(`${STAGING}/wp-json/wc/v3/products/attributes`, 'wc'));
} else console.log('- staging (WooCommerce keys): skipped, WC_CONSUMER_KEY / WC_CONSUMER_SECRET not set');

console.log(`\nDone. Raw data in ${OUT}/`);

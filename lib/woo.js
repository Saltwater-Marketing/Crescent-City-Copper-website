// WooCommerce data for the build. READ-ONLY: every request is a GET. Nothing here can change the live site.
//
// Sources (CLAUDE.md decision 2):
//  - Store API (public): products, prices, images, categories
//  - Public product pages: the Product Add-ons fields exactly as the live cart form names them, the category of
//    products the Store API leaves it off (chimney caps), and the out-of-stock awnings the Store API hides
//  - REST API v3 with a read-only key (optional, Netlify env vars): Product Add-ons meta and categories. When the key
//    is set, its options are used and the product pages are only read for the hidden products.
//
// Settings (environment variables, or .env locally):
//  WC_URL            WordPress to read from (default: the live site). At launch: https://shop.crescentcitycopper.com
//  WC_CONSUMER_KEY / WC_CONSUMER_SECRET   read-only REST key (optional)
//  WOO_CACHE_MINUTES local cache lifetime (default 60; 0 = always fetch). Netlify builds always fetch fresh.

const fs = require('node:fs');
const path = require('node:path');

if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const BASE = (process.env.WC_URL || 'https://crescentcitycopper.com').replace(/\/$/, '');
const KEY = process.env.WC_CONSUMER_KEY, SECRET = process.env.WC_CONSUMER_SECRET;
const CACHE = path.join('.cache', 'woo.json');
const CACHE_MIN = process.env.NETLIFY ? 0 : Number(process.env.WOO_CACHE_MINUTES ?? 60);
const UA = { 'User-Agent': 'crescentcitycopper-site-build' };

const sleep = ms => new Promise(res => setTimeout(res, ms));

// GET with retries. WordPress sometimes answers with a "checking your browser" page or a one-off error: wait, try again.
async function get(url, { auth = false, json = true, valid = null } = {}) {
  const headers = { ...UA };
  if (auth) headers.Authorization = 'Basic ' + Buffer.from(`${KEY}:${SECRET}`).toString('base64');
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { method: 'GET', headers });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      const body = json ? await r.json() : await r.text();
      // The host sometimes answers with a "One moment, please..." holding page (status 200): wait and try again
      if (valid && !valid(body)) throw new Error(`holding page ${url}`);
      return body;
    } catch (e) {
      if (attempt >= 6) throw e;
      await sleep(1500 * 2 ** attempt);
    }
  }
}
async function all(url, opts) {
  const out = [];
  for (let page = 1; page < 50; page++) {
    const batch = await get(`${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${page}`, opts);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}
async function pool(items, size, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) { const n = i++; out[n] = await fn(items[n]); } }));
  return out;
}

// ---------- Public product page reader ----------
const ENT = { amp: '&', quot: '"', apos: "'", nbsp: ' ', '#036': '$', '#36': '$', '#x24': '$', '#8243': '″', '#8242': '′', '#8217': '’', '#8211': '–', '#038': '&', '#160': ' ' };
const txt = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&(#?x?[0-9a-z]+);/gi, (m, e) => ENT[e.toLowerCase()] ?? m).replace(/\s+/g, ' ').trim();

function readProductPage(html) {
  // Product Add-ons blocks: one container per field
  const addons = [];
  for (const m of html.matchAll(/<div class="wc-pao-addon-container([^"]*)"[\s\S]*?(?=<div class="wc-pao-addon-container|<div id="product-addons-total"|$)/g)) {
    const block = m[0];
    const field = (block.match(/name="(addon-[^"\[]+)/) || [])[1];
    if (!field) continue;
    const label = txt((block.match(/class="wc-pao-addon-name"[^>]*>([\s\S]*?)<\/label>/) || [])[1]).replace(/\s*\*$/, '');
    const type = (block.match(/wc-pao-addon-field wc-pao-addon-([a-z_-]+)/) || [])[1] || 'select';
    const options = [...block.matchAll(/<option data-raw-price="([^"]*)"[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)]
      .map(o => ({ value: o[2], price: Number(o[1] || 0), label: txt(o[3]).replace(/\s*\(\+\s*\$\s*[\d,.]+\s*\)\s*$/, '') }));
    addons.push({ field, label, type, required: /wc-pao-required-addon/.test(m[1]), options });
  }
  const cats = [...((html.match(/<span class="posted_in">([\s\S]*?)<\/span>/) || [])[1] || '').matchAll(/href="[^"]*\/product-category\/([^/"]+)\/?"/g)].map(x => x[1]);
  const title = txt((html.match(/<h1[^>]*class="[^"]*(?:product_title|entry-title)[^"]*"[^>]*>([\s\S]*?)<\/h1>/) || [])[1]);
  const price = Number(((txt((html.match(/<p class="price">([\s\S]*?)<\/p>/) || [])[1]).match(/[\d,]+\.\d\d/) || [])[0] || '0').replace(/,/g, ''));
  const image = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || null;
  const desc = (html.match(/<div class="woocommerce-Tabs-panel woocommerce-Tabs-panel--description[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="woocommerce-Tabs-panel|<\/div>\s*<\/div>)/) || [])[1] || '';
  return { addons, cats, title, price, image, description: desc, cartForm: /name="add-to-cart"/.test(html) };
}

// REST meta `_product_addons` -> the same shape the product page gives (field names built like the plugin does)
function addonsFromMeta(id, meta) {
  const { sanitizeTitle, decode } = require('./text');
  const groups = (meta.find(m => m.key === '_product_addons') || {}).value || [];
  return groups.map((g, pos) => ({
    field: `addon-${id}-${sanitizeTitle(g.name)}-${pos}`,
    label: decode(g.name).trim(), type: g.type === 'multiple_choice' ? 'select' : g.type, required: !!g.required,
    options: (g.options || []).filter(o => o.label).map((o, i) => ({ value: `${sanitizeTitle(o.label)}-${i + 1}`, price: Number(o.price || 0), label: decode(o.label).trim() })),
  })).filter(a => a.options.length);
}

async function fetchRaw() {
  const [store, cats, sitemap] = await Promise.all([
    all(`${BASE}/wp-json/wc/store/v1/products?orderby=menu_order&order=asc`),
    all(`${BASE}/wp-json/wc/store/v1/products/categories`),
    get(`${BASE}/product-sitemap.xml`, { json: false }).catch(() => ''),
  ]);
  // Every product URL: the Store API's, plus any the sitemap lists that the Store API hides (out of stock)
  const known = new Set(store.map(p => p.permalink.replace(/\/$/, '')));
  const hidden = [...sitemap.matchAll(/<loc>([^<]+\/product\/[^<]+)<\/loc>/g)].map(m => m[1].replace(/\/$/, ''))
    .filter(u => !known.has(u)).map(u => u.replace(/^https?:\/\/[^/]+/, BASE));

  let rest = [];
  if (KEY && SECRET) {
    rest = await all(`${BASE}/wp-json/wc/v3/products?status=publish&_fields=id,meta_data,categories,weight,dimensions`, { auth: true });
  } else {
    console.warn('[woo] No read-only key: reading product options from the public product pages.');
  }
  const restIds = new Set(rest.map(r => r.id));
  const toRead = [...store.filter(p => !restIds.has(p.id)).map(p => ({ id: p.id, url: p.permalink })), ...hidden.map(url => ({ id: null, url }))];
  const pages = {};
  await pool(toRead, 2, async x => {
    const html = await get(x.url, { json: false, valid: h => /class="product_meta"|posted_in/.test(h) });
    pages[x.id ?? x.url] = { url: x.url, ...readProductPage(html) };
  });
  for (const r of rest) pages[r.id] = { addons: addonsFromMeta(r.id, r.meta_data || []), cats: [], fromKey: true, weight: r.weight, dimensions: r.dimensions, restCats: r.categories };
  return { fetchedAt: new Date().toISOString(), base: BASE, store, cats, pages, hidden };
}

async function loadRaw() {
  if (CACHE_MIN > 0 && fs.existsSync(CACHE)) {
    const age = (Date.now() - fs.statSync(CACHE).mtimeMs) / 60000;
    if (age < CACHE_MIN) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  }
  const raw = await fetchRaw();
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(raw));
  return raw;
}

// One download per build
let once;
const loadRawOnce = () => (once ||= loadRaw());
module.exports = { loadRaw: loadRawOnce, BASE, get, all, pool, readProductPage };

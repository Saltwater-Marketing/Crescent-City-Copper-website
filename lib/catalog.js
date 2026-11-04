// Turns raw WooCommerce data (lib/woo.js) into the product and category records the templates use.

const { decode, stripTags, pathOf } = require('./text');
const { cleanHtml, fileLinks } = require('./clean');
const L = require('./labels');

const money = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });

// Category order and short names (menu and home page catalog, as in the approved design)
const CATEGORY = {
  'copper-awnings': { order: 1, short: 'Copper Awnings', returnable: false },
  'copper-louvers': { order: 2, short: 'Louvers', returnable: true },
  'copper-chimney-caps': { order: 3, short: 'Chimney Caps', returnable: true },
  cupolas: { order: 4, short: 'Cupolas', returnable: false },
  'copper-leader-heads-or-conductor-heads': { order: 5, short: 'Leader or Conductor Heads', returnable: true },
  'copper-roof-and-dryer-vents': { order: 6, short: 'Roof and Dryer Vents', returnable: true },
};

// Awning profiles for the collection filter (design: Standing seam, Sweep, Arched, Victorian, Canopy & hip)
function profile(name) {
  if (/canopy|hip/i.test(name)) return 'Canopy & hip';
  if (/arched/i.test(name)) return 'Arched';
  if (/victorian/i.test(name)) return 'Victorian';
  if (/sweep/i.test(name)) return 'Sweep';
  if (/standing seam/i.test(name)) return 'Standing seam';
  return null;
}

// Product description from WordPress -> the parts the product page shows separately.
// Removes the old pasted JSON-LD text, the "subject to change" notice (the page has its own lead time row) and
// "see the drop down menu" lines (the options are right there). Drawing PDFs and bracket photos are pulled out.
// Old file links that are broken on the live site (404, checked 2026-11-04) -> the same file in the uploads folder
const DOC_FIX = [
  [/\/images\/pdf\/(VENT-\d+\.pdf)$/i, '/wp-content/uploads/2019/07/$1'],
  [/\/literatureretrieve\.aspx\?ID=81202$/i, '/wp-content/uploads/2019/07/300series.pdf'],
];
const fixDoc = (url, base) => { for (const [re, to] of DOC_FIX) if (re.test(url)) return base + url.replace(/^https?:\/\/[^/]+/, '').replace(re, to); return url; };
const words = s => new Set(stripTags(decode(s)).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w && w !== 'copper'));
const DIMLINE = /^\s*[\d½¼¾ \/.]+\s*(?:″|"|&#8243;|in\.?)?\s*(?:w|h|d|l|diam\.?|diameter)?\s*(?:x\s*[\d½¼¾ \/.]+\s*(?:″|"|&#8243;)?\s*(?:w|h|d|l)?\s*|x?\s*varies with pitch of roof\s*)*$/i;

// Product description from WordPress -> the parts the product page shows separately.
// Removes the old pasted JSON-LD text, the "subject to change" notice (the page has its own lead time row), "see the
// drop down menu" lines (the options are right there) and stale typed prices (the page shows the live price).
// Drawing PDFs, bracket photos, the features list and dimension lines are pulled out.
function parseDescription(html, base, name) {
  let h = fileLinks(cleanHtml(html), base);
  const docs = [], brackets = {};
  h = h.replace(/\{\s*(?:&#8220;|“|")@context[\s\S]*?\}\s*\}/g, '');
  h = h.replace(/<h3>\s*Description\s*<\/h3>/i, '');
  h = h.replace(/<li>\s*<img src="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/li>/g, (m, src, label) => {
    brackets[label.replace(/\s*bracket\s*$/i, '').trim().toLowerCase()] = src; return '';
  });
  // Same photos in a table on some products: collect by alt text, then drop the table
  for (const m of h.matchAll(/<img src="([^"]*th200_[^"]+)" alt="([^"]*)"/g)) {
    const k = m[2].toLowerCase().replace(/copper awning/, '').replace(/bracket/, '').trim();
    if (k && !brackets[k]) brackets[k] = m[1];
  }
  h = h.replace(/<table>(?:(?!<\/table>)[\s\S])*?th200_[\s\S]*?<\/table>/g, '');
  h = h.replace(/<h2>\s*Bracket Photos:?\s*<\/h2>/i, '');
  // Bold lines that only name the product's series ("Standard Canopy Copper Awning (1000 Series)")
  h = h.replace(/<p>\s*<strong>[^<]*\(\d+ Series\)\s*<\/strong>\s*<\/p>/g, '');
  // Download links (PDF drawings and specifications, and one old .aspx link)
  h = h.replace(/<(li|p|h4)>\s*(?:<strong>)?\s*<a href="([^"]+?(?:\.pdf|\.aspx\?[^"]*))"[^>]*>([\s\S]*?)<\/a>\s*(?:<\/strong>)?\s*<\/\1>/gi, (m, tag, url, label) => {
    url = fixDoc(url.startsWith('/') ? base + url : url, base);
    if (!docs.some(d => d.url === url)) docs.push({ url, label: stripTags(decode(label)).replace(/^»\s*/, '').replace(/^Download\s+/i, '').replace(/&\s*Dimensions/i, '& Dimensions').replace(/\s*\(PDF\)/i, '').replace(/\s+/g, ' ').trim().replace(/^./, c => c.toUpperCase()) });
    return '';
  });
  h = h.replace(/<(p|li)>\s*(?:<b>|<strong>)?\s*Shipping, pricing &amp; lead times subject to change[\s\S]*?<\/\1>/gi, '');
  h = h.replace(/\s*(?:<strong>)?\s*(?:Please )?(?:see|look at) (?:our |the )?drop[- ]down (?:menu|box)[^<.]*\.?\s*(?:<\/strong>)?/gi, ' ');
  h = h.replace(/<p>\s*\$[\d,.]+\s*Each\s*<\/p>/gi, '');
  h = h.replace(/<hr>/g, '');
  // A first line that only repeats the product name ("Copper A-Frame Chimney Cap", "Tombstone Wall Copper Louver Vent:")
  const nameWords = words(name);
  h = h.replace(/^\s*(?:<br>\s*)*<p>(?:<strong>)?([^<]{3,80}?)(?:<\/strong>)?<\/p>/, (m, t) => {
    const w = [...words(t.replace(/:$/, ''))].filter(x => !['louver', 'vent', 'awnings', 'awning', 'wall'].includes(x));
    return w.length && w.every(x => nameWords.has(x)) ? '' : m;
  });
  // Features list: the first bullet list
  let features = [];
  h = h.replace(/(?:<p>\s*(?:<span>)?\s*<strong>[^<]*(?:Features|Awnings \(\d+ Series\))[^<]*<\/strong>\s*(?:<\/span>)?\s*<\/p>\s*)?<ul>([\s\S]*?)<\/ul>/, (m, items) => {
    features = [...items.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => x[1].replace(/<\/?strong>/g, '').trim()).filter(x => stripTags(x));
    return '';
  });
  // Dimensions: a "Dimensions: ..." line, or a line that is only a measurement ("24″W x 12″H", "24″ Diam.")
  let dimensions = null;
  h = h.replace(/<p>\s*(?:<strong>)?\s*Dimensions\s*[:–-]\s*([\s\S]*?)(?:<\/strong>)?\s*<\/p>/i, (m, d) => { dimensions = stripTags(decode(d)); return ''; });
  if (!dimensions) h = h.replace(/<p>([^<]{2,60})<\/p>/, (m, t) => (DIMLINE.test(decode(t)) ? ((dimensions = decode(t).trim()), '') : m));
  h = h.replace(/<(p|h[2-6]|li|strong)>\s*<\/\1>/g, '').replace(/<ul>\s*<\/ul>/g, '').replace(/^(\s*<br>)+/, '').trim();
  return { about: stripTags(h) ? h : '', features, docs, brackets, dimensions: dimensions && dimensions.replace(/\s*[xX]\s*/g, ' × ') };
}

function build(raw) {
  const base = raw.base;
  const catsBySlug = Object.fromEntries(raw.cats.map(c => [c.slug, c]));
  const categories = raw.cats
    .filter(c => CATEGORY[c.slug])
    .map(c => ({
      id: c.id, slug: c.slug, name: decode(c.name), short: CATEGORY[c.slug].short, order: CATEGORY[c.slug].order,
      path: pathOf(c.permalink),
      description: cleanHtml(c.description || '').replace(/^<h[1-3]>[\s\S]*?<\/h[1-3]>\s*/, ''),
      // Short intro for the header: the first two sentences
      intro: (stripTags(decode(cleanHtml(c.description || '').replace(/^<h[1-3]>[\s\S]*?<\/h[1-3]>\s*/, ''))).match(/^(?:[^.!?]+[.!?]+\s*){1,2}/) || [''])[0].trim(),
      image: c.image ? { src: c.image.src, alt: decode(c.image.alt || c.name) } : null,
      products: [],
    }))
    .sort((a, b) => a.order - b.order);
  const catBySlug = Object.fromEntries(categories.map(c => [c.slug, c]));

  // Products the Store API lists, plus the out-of-stock ones only the product pages show
  const records = raw.store.map(s => ({ s, pg: raw.pages[s.id] || { addons: [], cats: [] } }));
  for (const url of raw.hidden || []) {
    const pg = raw.pages[url];
    if (!pg || !pg.title) continue;
    const slug = url.replace(/\/$/, '').split('/').pop();
    records.push({ s: { id: null, slug, name: pg.title, permalink: url + '/', description: pg.description, short_description: '',
      prices: { price: String(Math.round(pg.price * 100)), currency_minor_unit: 2 }, images: pg.image ? [{ src: pg.image, alt: pg.title }] : [],
      categories: [], is_purchasable: false, is_in_stock: false, hidden: true }, pg });
  }

  const products = records.map(({ s, pg }) => {
    const minor = s.prices.currency_minor_unit ?? 2;
    const price = Number(s.prices.price) / 10 ** minor;
    const name = decode(s.name).trim();
    const catSlugs = s.categories.length ? s.categories.map(c => c.slug) : pg.cats;
    const cat = catSlugs.map(x => catBySlug[x]).find(Boolean) || null;

    const steps = (pg.addons || []).map(a => {
      const g = L.group(a.label, a.options);
      return {
        key: g.key, title: g.title, hint: g.hint, field: a.field, required: a.required, type: a.type,
        options: a.options.map(o => ({ ...L.option(o.label), value: o.value, price: o.price, wh: L.wh(L.option(o.label).label) })),
      };
    });
    const d = parseDescription([s.short_description, s.description].filter(Boolean).join('\n'), base, name);
    const series = (name.match(/^(\d+)\s+Series/i) || [])[1] || null;
    const sizeStep = steps.find(st => st.key === 'size');
    const quote = !s.is_purchasable && s.is_in_stock;   // Copper Gutters: information and quote only
    const p = {
      id: s.id, slug: s.slug, name, path: pathOf(s.permalink),
      series: series ? `${series} Series` : null,
      shortName: series ? name.replace(/^\d+\s+Series\s*/i, '').replace(/^\((.*)\)$/, '$1').trim() || name : name,
      price, priceText: money(price),
      fromText: (sizeStep && sizeStep.options.some(o => o.price) ? 'from ' : '') + money(price),
      images: (s.images || []).map(i => ({ src: i.src, alt: decode(i.alt || name), w: null })),
      category: cat ? { slug: cat.slug, name: cat.name, short: cat.short, path: cat.path } : null,
      purchasable: !!s.is_purchasable && !!s.is_in_stock, inStock: !!s.is_in_stock, quote, hidden: !!s.hidden,
      returnable: cat ? CATEGORY[cat.slug].returnable : true,
      profile: cat && cat.slug === 'copper-awnings' ? profile(name) : null,
      steps, sizeCount: sizeStep ? sizeStep.options.length : 0,
      drawing: steps.some(st => st.key === 'size' && st.options.every(o => o.wh)),
      ...d,
      material: /16\s*oz/i.test(stripTags(s.description + ' ' + s.short_description)) ? '16 oz. copper' : null,
      stainless: /stainless/i.test(name),
      summary: stripTags(decode(d.features.join('. ') || d.about)).slice(0, 220),
    };
    p.config = { id: p.id, base: p.price, steps: steps.map(st => ({ key: st.key, field: st.field, options: st.options.map(o => ({ v: o.value, p: o.price, l: o.label, wh: o.wh })) })) };
    if (cat && !p.hidden && !p.quote) cat.products.push(p);   // Copper Gutters (quote only) is filed under Chimney Caps in WooCommerce
    return p;
  });

  // Category order inside a collection: awnings by series number, everything else by price
  for (const c of categories) {
    c.products.sort((a, b) => (a.series && b.series ? parseInt(a.series) - parseInt(b.series) : a.price - b.price));
    c.from = c.products.filter(p => p.purchasable).reduce((m, p) => Math.min(m, p.price), Infinity);
    c.fromText = Number.isFinite(c.from) ? money(c.from) : '';
    c.profiles = [...new Set(c.products.map(p => p.profile).filter(Boolean))];
  }
  // Bracket photos are the same for every awning: share them, so each bracket step can show its photos
  const bracketPhotos = Object.assign({}, ...products.map(p => p.brackets));
  bracketPhotos['s-bracket'] ||= bracketPhotos['s-type'];
  for (const p of products) {
    const st = p.steps.find(x => x.key === 'bracket');
    if (st) for (const o of st.options) o.photo = bracketPhotos[o.label.toLowerCase()] || null;
  }
  // Same-category neighbours for "More in this category"
  for (const p of products) p.siblings = p.category ? catBySlug[p.category.slug].products.filter(x => x !== p).slice(0, 4) : [];

  return { products, categories, money, gutters: products.find(p => p.slug === 'copper-gutters') || null };
}

module.exports = { build, money };

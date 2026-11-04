// WordPress pages and posts for the build (public REST API, read-only GET requests).
// Uses the same WC_URL / cache settings as lib/woo.js.
const fs = require('node:fs');
const path = require('node:path');
const { BASE, get, pool } = require('./woo.js');
const { decode, pathOf, stripTags } = require('./text.js');
const { cleanHtml, fileLinks } = require('./clean.js');
const { parseGallery } = require('./galleries.js');

const CACHE = path.join('.cache', 'wp.json');
const CACHE_MIN = process.env.NETLIFY ? 0 : Number(process.env.WOO_CACHE_MINUTES ?? 60);
const FIELDS = 'id,slug,link,date,modified,title,excerpt,content,featured_media,parent,menu_order,categories,_links,_embedded';

// One WordPress page (/copper-blog/) makes the API fail with a PHP error when it is rendered, which breaks any list
// request that includes it. So: ask for the id list first, then fetch in small batches, and one by one if a batch fails.
// Items that still fail are skipped with a warning (that one is the blog index, which this site builds itself).
async function fetchAll(type) {
  const ids = [];
  for (let page = 1; page < 20; page++) {
    const batch = await get(`${BASE}/wp-json/wp/v2/${type}?status=publish&per_page=100&page=${page}&_fields=id`);
    ids.push(...batch.map(x => x.id));
    if (batch.length < 100) break;
  }
  const chunks = [];
  for (let i = 0; i < ids.length; i += 20) chunks.push(ids.slice(i, i + 20));
  const out = [];
  await pool(chunks, 2, async chunk => {
    try {
      out.push(...await get(`${BASE}/wp-json/wp/v2/${type}?include=${chunk.join(',')}&per_page=20&_embed=wp:featuredmedia&_fields=${FIELDS}`));
    } catch {
      for (const id of chunk) {
        try { out.push(await get(`${BASE}/wp-json/wp/v2/${type}/${id}?_embed=wp:featuredmedia&_fields=${FIELDS}`)); }
        catch (e) { console.warn(`[wp] skipped ${type} ${id}: ${e.message}`); }
      }
    }
  });
  return out;
}

// Fusion "image box" tiles (image, title, empty link) -> one linked card each; a run of cards becomes a grid
function tiles(html) {
  html = html.replace(/<img src="([^"]+)" alt="([^"]*)"[^>]*>\s*<h3>([\s\S]*?)<\/h3>\s*<a href="([^"]+)"><\/a>/g,
    (m, src, alt, title, href) => `<a class="tile" href="${href}"><img src="${src}" alt="" loading="lazy" decoding="async"><span>${stripTags(decode(title)).trim()}</span></a>`);
  return html.replace(/(<a class="tile"[\s\S]*?<\/a>)(\s*<a class="tile"[\s\S]*?<\/a>)*/g, m => `<div class="tiles">${m}</div>`);
}

async function loadRaw() {
  if (CACHE_MIN > 0 && fs.existsSync(CACHE) && (Date.now() - fs.statSync(CACHE).mtimeMs) / 60000 < CACHE_MIN) {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  }
  const [posts, pages, cats] = await Promise.all([
    fetchAll('posts'), fetchAll('pages'),
    get(`${BASE}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,slug,count`),
  ]);
  const raw = { fetchedAt: new Date().toISOString(), posts, pages, cats };
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(raw));
  return raw;
}

// The page/post URL clash (docs/DISCOVERY.md): the page keeps /copper-dryer-vents/, the post moves here.
const POST_PATH = { '/copper-dryer-vents/': '/copper-dryer-vents-blog/' };

function shape(x, kind, catsById) {
  const media = ((x._embedded || {})['wp:featuredmedia'] || [])[0];
  let html = tiles(fileLinks(cleanHtml(x.content.rendered), BASE));
  // The content's own first H1 becomes the page heading (templates print it), and is removed from the body
  let heading = null;
  const h1 = html.match(/<h1>([\s\S]*?)<\/h1>/);
  if (h1) { heading = stripTags(decode(h1[1])).trim(); html = html.replace(h1[0], ''); }
  html = html.replace(/<h1>/g, '<h2>').replace(/<\/h1>/g, '</h2>');
  // "On this page": give each H2 an id and collect them
  const toc = [];
  const used = new Set();
  html = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, inner) => {
    const text = stripTags(decode(inner)).trim();
    let id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
    while (used.has(id)) id += '-2';
    used.add(id); toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  let p = pathOf(x.link);
  if (kind === 'post' && POST_PATH[p]) p = POST_PATH[p];
  const firstImg = (html.match(/<img[^>]+src="([^"]+)"/) || [])[1] || null;
  const words = stripTags(html).split(/\s+/).length;
  return {
    id: x.id, kind, slug: x.slug, path: p, date: x.date, modified: x.modified,
    title: stripTags(decode(x.title.rendered)).trim(),
    heading,
    excerpt: decode(String(x.excerpt.rendered || '').replace(/<[^>]*>/g, '').replace(/\[[^\]]*\]/g, '')).replace(/\s+/g, ' ').replace(/\s*READ MORE[\s\S]*$/i, '').replace(/\s*(Continue reading)?\s*(…|\[…\]|\.\.\.)?\s*$/i, '').trim(),
    image: media && media.source_url ? { src: media.source_url, alt: decode(media.alt_text || '') } : null,
    // Social-share picture when there's no featured image (never shown on the page itself)
    shareImage: media && media.source_url ? media.source_url : firstImg,
    html, toc, minutes: Math.max(1, Math.round(words / 230)),
    categories: (x.categories || []).map(id => catsById[id]).filter(c => c && c.slug !== 'uncategorized'),
    hasForm: /gform|gravityforms|wpcf7/i.test(x.content.rendered),
  };
}

// Pages with no content: not built; netlify.toml sends each to its best match with a 301.
const RETIRED = new Set(['/interior/', '/shop-full-width/', '/permanent-metal-awnings-make-the-most-sense-for-your-home-or-business/', '/featured-product/']);
// Built by their own templates, or live on the shop subdomain (cart, checkout, account)
const OWN_TEMPLATE = new Set(['/', '/products/', '/copper-blog/', '/photo-gallery/', '/sitemap/', '/cart/', '/checkout/', '/my-account/']);

async function load() {
  const raw = await loadRaw();
  const catsById = Object.fromEntries((raw.cats || []).map(c => [c.id, { name: decode(c.name), slug: c.slug }]));
  const posts = raw.posts.map(p => shape(p, 'post', catsById)).sort((a, b) => b.date.localeCompare(a.date));
  const all = raw.pages.map(p => shape(p, 'page', catsById));
  const titles = Object.fromEntries(all.map(p => [p.path, p.title]));
  for (const p of all) p.gallery = parseGallery(p, titles);
  const pages = all.filter(p => !OWN_TEMPLATE.has(p.path) && !RETIRED.has(p.path));
  const galleryHub = all.find(p => p.path === '/photo-gallery/') || null;
  return { posts, pages, galleryHub, home: all.find(p => p.path === '/') || null, retired: [...RETIRED] };
}

// One download per build
let once;
module.exports = { load: () => (once ||= load()), POST_PATH };

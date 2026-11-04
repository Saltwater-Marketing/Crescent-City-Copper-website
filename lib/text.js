// Small text helpers shared by the data layer and templates.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', reg: '®', trade: '™', copy: '©' };
function decode(s) {
  return String(s ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
const stripTags = s => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();

// Port of WordPress sanitize_title() (remove_accents + sanitize_title_with_dashes, "save" context).
// Must match exactly: the Product Add-ons plugin builds its form field names and option values with it.
function sanitizeTitle(title) {
  let t = String(title ?? '').replace(/<[^>]*>/g, '');
  t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');            // remove_accents
  t = t.replace(/%([a-fA-F0-9][a-fA-F0-9])/g, '---$1---').replace(/%/g, '').replace(/---([a-fA-F0-9][a-fA-F0-9])---/g, '%$1');
  t = t.toLowerCase();
  t = t.replace(/[\u00a0\u2013\u2014]/g, '-').replace(/\u00d7/g, 'x');    // nbsp, en/em dash -> '-', × -> 'x' (save context)
  t = t.replace(/\//g, '-');                                           // forward slash -> '-'
  t = t.replace(/&.+?;/g, '');                                         // entities
  t = t.replace(/\./g, '-');
  t = t.replace(/[^%a-z0-9 _-]/g, '');
  t = t.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return t;
}

// Absolute WordPress URL -> site path ("/product/x/")
function pathOf(url) {
  try { const u = new URL(url); return u.pathname.endsWith('/') ? u.pathname : u.pathname + '/'; } catch { return url; }
}

module.exports = { decode, stripTags, sanitizeTitle, pathOf };

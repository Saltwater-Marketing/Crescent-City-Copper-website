// Cleans WordPress page-builder (Avada / Fusion Builder) HTML down to plain content HTML:
// headings, paragraphs, lists, links, images, tables, blockquotes and video embeds. Classes, inline styles,
// wrapper divs, scripts, forms and leftover shortcodes are removed.

const KEEP = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'a', 'img', 'strong', 'b', 'em', 'i', 'br',
  'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption', 'iframe', 'hr', 'sup', 'sub']);
const ATTRS = { a: ['href', 'title'], img: ['src', 'alt', 'width', 'height'], iframe: ['src', 'title', 'width', 'height', 'allowfullscreen'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'] };

// Links to our own pages that WordPress wrote as full addresses (live or staging host) become site-relative, so
// visitors stay on the new site. Files and shop pages (wp-content, cart, checkout, account) keep pointing at WordPress.
const OWN = /^https?:\/\/(?:www\.|shop\.)?crescentcitycopper\.com(?=\/|$)/i;
const SHOP_PATH = /^\/(wp-content|wp-admin|wp-login|cart|checkout|my-account|images\/)|[?&]add-to-cart=|\.(pdf|jpe?g|png|gif|webp)$/i;
function localHref(h) {
  const own = OWN.test(h);
  if (!own && !/^\/(?!\/)/.test(h)) return h;
  const rest = own ? (h.replace(OWN, '') || '/') : h;
  if (SHOP_PATH.test(rest)) return h;
  // Page links get the trailing slash our URLs use (saves a redirect): /faqs -> /faqs/, /faqs#x -> /faqs/#x
  // and are lowercased (WordPress slugs are lowercase; old content has links like /Products/)
  return rest.replace(/^[^?#]*/, p => p.toLowerCase()).replace(/^(\/[^?#.]*?[^/?#.])(?=$|[?#])/, '$1/');
}
function localLinks(html) {
  return String(html || '').replace(/(<a\b[^>]*\bhref=)(["'])([^"']*)\2/gi, (m, pre, q, h) => pre + q + localHref(h) + q);
}

function cleanHtml(html) {
  let s = String(html || '');
  s = s.replace(/<(script|style|noscript|form|svg|button|select|textarea)\b[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/\[\/?[a-z_][^\]]*\]/gi, '');                     // leftover shortcodes
  // Rebuild each tag: keep allowed tags with allowed attributes, drop everything else (keeping inner text)
  s = s.replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, (m, tag, attrs) => {
    tag = tag.toLowerCase();
    if (!KEEP.has(tag)) return /^(div|section|article|header|footer|span)$/.test(tag) && m[1] !== '/' ? '' : (/^(div|section|article)$/.test(tag) ? '\n' : '');
    if (m[1] === '/') return `</${tag}>`;
    const keep = [];
    for (const a of ATTRS[tag] || []) {
      const v = attrs.match(new RegExp(`\\s${a}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
      if (v) keep.push(`${a}="${(v[2] ?? v[3] ?? v[4] ?? '').replace(/"/g, '&quot;')}"`);
      else if (a === 'allowfullscreen' && new RegExp(`\\s${a}\\b`, 'i').test(attrs)) keep.push(a);
    }
    if (tag === 'iframe' && !/youtube|vimeo|tiktok|google\.com\/maps/.test(keep.join(' '))) return '';
    if (tag === 'img') keep.push('loading="lazy"', 'decoding="async"');
    // PDFs (cut sheets, catalogs) and links to other websites open in a new tab
    if (tag === 'a') {
      const i = keep.findIndex(k => k.startsWith('href='));
      if (i >= 0) keep[i] = `href="${localHref(keep[i].slice(6, -1))}"`;
      const h = (keep[i] || '').slice(6, -1);
      if (/\.pdf($|\?)/i.test(h) || (/^https?:/i.test(h) && !/crescentcitycopper\.com/i.test(h))) keep.push('target="_blank"', 'rel="noopener"'); }
    if (tag === 'iframe') keep.push('loading="lazy"');
    return `<${tag}${keep.length ? ' ' + keep.join(' ') : ''}${tag === 'img' || tag === 'br' || tag === 'hr' ? '' : ''}>`;
  });
  // Leftovers: icon-font tags, closing tags of removed embeds, empty links and headings that only held a link
  s = s.replace(/<i>\s*<\/i>\s*/g, '');
  if (!/<iframe/.test(s)) s = s.replace(/<\/iframe>/g, '');
  s = s.replace(/<h([1-6])>\s*<a>\s*<\/a>/g, '<h$1>').replace(/<a>\s*<\/a>/g, '');
  // Tidy: empty paragraphs, runs of <br>, stray whitespace
  s = s.replace(/<p>\s*(<br>\s*)*(&nbsp;| )?\s*<\/p>/gi, '');
  s = s.replace(/(<br>\s*){2,}/gi, '<br>');
  s = s.replace(/<p>\s*<br>/gi, '<p>').replace(/<br>\s*<\/p>/gi, '</p>');
  s = s.replace(/<br>\s*(?=<(h[1-6]|p|ul|ol|img|figure|table|blockquote|iframe|hr)\b)/gi, '');
  s = s.replace(/(<\/(h[1-6]|p|ul|ol|figure|table|blockquote|iframe)>|<img[^>]*>|<hr>)\s*<br>/gi, '$1');
  s = s.replace(/<p>\s*(?=<(h[1-6]|ul|ol|figure|table|blockquote|p|img|iframe)\b)/gi, '');
  s = s.replace(/<(h[1-6]|li|p)>\s*<\/\1>/gi, '');
  s = s.replace(/\n{2,}/g, '\n').trim();
  return s;
}

// Files that live on WordPress (uploads, old /images/ PDFs) point at the WordPress install the build reads from.
// Before launch that's the live site; at launch WC_URL becomes the shop subdomain and these follow.
function fileLinks(html, base) {
  return String(html || '')
    .replace(/(href|src)="(?:https?:\/\/(?:www\.)?crescentcitycopper\.com)?(\/(?:wp-content|images)\/[^"]*)"/gi, (m, a, p) => `${a}="${base}${p}"`)
    .replace(/(href|src)="http:\/\/(?:www\.)?crescentcitycopper\.com/gi, '$1="https://crescentcitycopper.com');
}

module.exports = { cleanHtml, localLinks, fileLinks };

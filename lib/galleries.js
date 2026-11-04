// Gallery pages in WordPress come in two shapes (Fusion Builder markup, already cleaned):
//  - photo pages:  <a href="FULL.jpg"><img src="THUMB-460x295.jpg"></a> ...
//  - hub pages:    <img src> <h3>Title</h3> <a href="/other-gallery/"></a> ...   (or <a href="/x-gallery/"><img></a>)
// parseGallery() returns { photos, tiles, intro } for a page that is a gallery, or null.
// The gallery templates show photos in a grid with the photo viewer, and tiles as linked cards.

const { decode, stripTags } = require('./text.js');

// Boilerplate links every gallery page repeats; the templates have their own versions
const BOILER = [
  /<a href="\/photo-gallery\/"[^>]*>[^<]*Back to main photo gallery page[^<]*<\/a>/gi,
  /<a href="\/products\/"[^>]*>[^<]*Shop copper products now[^<]*<\/a>/gi,
  /<h2[^>]*>\s*Feeling inspired\?[\s\S]*?<\/h2>\s*(<a href="\/customer-service\/">Contact Us<\/a>)?/gi,
];

const IMG = /\.(jpe?g|png|webp|gif)(\?|$)/i;

function parseGallery(page, titles) {
  let h = page.html;
  for (const re of BOILER) h = h.replace(re, '');
  const photos = [], tiles = [];
  // Hub tiles (made into <a class="tile"> by lib/wp.js)
  h = h.replace(/<a class="tile" href="([^"]+)"><img src="([^"]+)"[^>]*><span>([\s\S]*?)<\/span><\/a>/g, (m, href, src, title) => {
    tiles.push({ src, href, title: decode(title) }); return '';
  }).replace(/<div class="tiles">\s*<\/div>/g, '');
  // Linked images
  h = h.replace(/<a href="([^"]+)"(?: title="([^"]*)")?>\s*<img src="([^"]+)" alt="([^"]*)"(?: width="(\d+)")?(?: height="(\d+)")?[^>]*>\s*<\/a>/g, (m, href, title, src, alt, w, ht) => {
    if (IMG.test(href)) photos.push({ full: href, src, alt: decode(alt).replace(/^(\d+|IMG_\d+|image\d+|mfg-\d+)$/i, ''), w: Number(w) || null, h: Number(ht) || null });
    else tiles.push({ src, href, title: titles[href] || stripTags(decode(title || alt)), w: Number(w) || null, h: Number(ht) || null });
    return '';
  });
  // Large images on their own (not linked) on a gallery page are photos too
  const isGalleryPath = /gallery|mcvaneys/.test(page.path);
  if (isGalleryPath) {
    h = h.replace(/<img src="([^"]+)" alt="([^"]*)" width="(\d+)" height="(\d+)"[^>]*>/g, (m, src, alt, w, ht) => {
      if (Number(w) < 400) return m;
      photos.push({ full: src, src, alt: decode(alt).replace(/^(\d+|IMG_\d+|image\d+|mfg-\d+)$/i, ''), w: Number(w), h: Number(ht) }); return '';
    });
  }
  if (!(isGalleryPath && (photos.length || tiles.length))) return null;
  // What's left (headings and paragraphs) is the intro text
  const intro = h.replace(/<p>\s*<\/p>/g, '').replace(/<\/p>\s*$/, '').replace(/^\s*<\/p>/, '').trim();
  const series = (page.title.match(/\b(\d{3,4})\s+Series\b/) || [])[1] || null;
  return { photos, tiles, intro: stripTags(intro) ? intro : '', series: series ? `${series} Series` : null,
    commercial: /commercial|restaurant|boutique|mcvaney/i.test(page.title + page.path) };
}

module.exports = { parseGallery };

const { decode, stripTags } = require('./lib/text.js');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ 'src/favicon.ico': 'favicon.ico' });
  eleventyConfig.addWatchTarget('src/assets/');

  // Photos from WordPress go through Netlify Image CDN on Netlify (resized, WebP). Locally: the original file.
  // img(0) keeps the original size (product photos are small and must never be enlarged: CLAUDE.md decision 6).
  eleventyConfig.addFilter('img', (src, w) => {
    if (!src) return '';
    return process.env.NETLIFY ? `/.netlify/images?url=${encodeURIComponent(src)}${w === 0 ? '' : `&w=${w || 800}`}&fm=webp` : src;
  });
  // Same for every WordPress image inside page, post and product text
  eleventyConfig.addFilter('cdnImgs', html => !process.env.NETLIFY ? html : String(html || '').replace(
    /<img src="(https:\/\/(?:shop\.)?crescentcitycopper\.com\/wp-content\/[^"]+\.(?:jpe?g|png|gif|webp))"/gi,
    (m, src) => `<img src="/.netlify/images?url=${encodeURIComponent(src)}&w=1000&fm=webp"`));
  // The menu item whose URL is the longest prefix of the current page
  eleventyConfig.addFilter('activeNav', (nav, url) => (nav.filter(n => url && (url === n.url || (n.url !== '/' && url.startsWith(n.url)))).sort((a, b) => b.url.length - a.url.length)[0] || {}).url);
  eleventyConfig.addFilter('byPath', (list, p) => (list || []).find(x => x.path === p));
  eleventyConfig.addFilter('dateLong', d => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' }));
  eleventyConfig.addFilter('isoDate', d => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter('money', n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 }));
  eleventyConfig.addFilter('decode', decode);
  eleventyConfig.addFilter('plain', s => stripTags(decode(s)));
  eleventyConfig.addFilter('truncate', (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s; });
  eleventyConfig.addFilter('json', v => JSON.stringify(v).replace(/</g, '\\u003c'));
  // Title tag: "[Specific descriptor] | Crescent City Copper", without doubling the brand name
  eleventyConfig.addFilter('titleTag', s => {
    s = stripTags(decode(s)).trim();
    return /crescent city copper/i.test(s) ? s : `${s} | Crescent City Copper`;
  });
  // Photos from galleries for a product or collection "installed" strip: same series first, then any awning gallery
  eleventyConfig.addFilter('installedPhotos', (pages, series, n) => {
    const gals = (pages || []).filter(p => p.gallery && p.gallery.photos.length && /awning|mcvaney/i.test(p.title));
    const same = series ? gals.filter(g => g.gallery.series === series) : [];
    const photos = (same.length ? same : gals).flatMap(g => g.gallery.photos.map(ph => ({ ...ph, page: g.path, title: g.title })));
    return { matched: same.length > 0, photos: photos.slice(0, n || 4), path: same.length ? same[0].path : '/photo-gallery/' };
  });

  return {
    dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' },
    htmlTemplateEngine: 'njk', markdownTemplateEngine: 'njk',
  };
};

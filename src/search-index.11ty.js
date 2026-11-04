// Small search index for /search/ (titles and a short summary of every product, page and post)
const { stripTags, decode } = require('../lib/text.js');
module.exports = class {
  data() { return { permalink: '/search-index.json', eleventyExcludeFromCollections: true }; }
  render({ catalog, wp }) {
    const items = [
      ...catalog.products.filter(p => !p.hidden).map(p => ({ t: p.name, u: p.path, k: 'Product', s: `${p.fromText} · ${p.category ? p.category.short : ''}` })),
      ...catalog.categories.map(c => ({ t: c.name, u: c.path, k: 'Category', s: `${c.products.length} products` })),
      ...wp.pages.filter(p => p.path !== '/thank-you/').map(p => ({ t: p.title, u: p.path, k: p.gallery ? 'Gallery' : 'Page', s: stripTags(decode(p.html)).slice(0, 140) })),
      ...wp.posts.map(p => ({ t: p.title, u: p.path, k: 'Blog', s: (p.excerpt || '').slice(0, 140) })),
    ];
    return JSON.stringify(items);
  }
};

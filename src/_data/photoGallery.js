// The Project Gallery page (/photo-gallery/): every gallery page's photos, grouped, in the order the current
// WordPress gallery hub lists them. Each group links to its own gallery page and, where one exists, to the product.
const { load } = require('../../lib/wp.js');
const { loadRaw } = require('../../lib/woo.js');
const { build } = require('../../lib/catalog.js');

const KIND = path => (/commercial|restaurant|boutique|mcvaney|custom-oversize/.test(path) ? 'Commercial & custom'
  : /residential|home|patio|copper-awnings-gallery/.test(path) ? 'Residential awnings' : 'Products & shop');
const SHOP = {
  '/chimney-caps-gallery/': '/product-category/copper-chimney-caps/', '/louvers-gallery/': '/product-category/copper-louvers/',
  '/cupolas-gallery/': '/product-category/cupolas/', '/roof-dryer-vents-gallery/': '/product-category/copper-roof-and-dryer-vents/',
  '/copper-awnings-gallery/': '/product-category/copper-awnings/',
};

module.exports = async () => {
  const wp = await load();
  const catalog = build(await loadRaw());
  const byPath = Object.fromEntries(wp.pages.map(p => [p.path, p]));
  const order = (wp.galleryHub && wp.galleryHub.gallery ? wp.galleryHub.gallery.tiles.map(t => t.href) : []);
  // Hub order first, then any other gallery page with photos
  const paths = [...new Set([...order, ...wp.pages.filter(p => p.gallery && p.gallery.photos.length).map(p => p.path)])];
  let n = 0;
  const groups = paths.map(path => byPath[path]).filter(p => p && p.gallery && p.gallery.photos.length).map(p => {
    const product = p.gallery.series ? catalog.products.find(x => x.series === p.gallery.series && !x.hidden) : null;
    const shop = product ? { label: `Shop the ${p.gallery.series}`, url: product.path }
      : SHOP[p.path] ? { label: 'Shop these products', url: SHOP[p.path] }
      : /custom|patio|commercial|restaurant|boutique|mcvaney/.test(p.path) ? { label: 'Ask about custom work', url: '/custom-copper-awnings/' } : null;
    return {
      title: p.title.replace(/\s*Gallery$/i, ''), path: p.path, kind: KIND(p.path), shop,
      photos: p.gallery.photos.map(ph => ({ ...ph, i: n++ })),
    };
  });
  return { groups, kinds: [...new Set(groups.map(g => g.kind))], count: n };
};

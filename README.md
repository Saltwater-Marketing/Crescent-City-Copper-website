# crescentcitycopper.com

Fast static front end for Crescent City Copper (Eleventy, hosted on Netlify). WordPress + WooCommerce stays as the back
office: products, prices, orders, payments. Cart, checkout and My Account stay native WooCommerce. Project brief and
rules: [CLAUDE.md](CLAUDE.md). Progress: [docs/PROGRESS.md](docs/PROGRESS.md). Approved design: [design/](design/README.md).

## How it works
- Every build reads products, categories, pages and blog posts from WordPress (read-only GET requests, `lib/woo.js`,
  `lib/wp.js`) and writes plain HTML to `_site/`.
- Product options come from the WooCommerce Product Add-ons fields on the public product pages (or the read-only REST
  key, if set). Add to cart is a normal form that posts those exact fields to the WooCommerce cart (`src/product.njk`).
- Option labels are tidied in the build only (`lib/labels.js`); prices and field values are never changed.
- Every old URL keeps working: pages keep their addresses, anything that moved has a 301 in `netlify.toml`.

## Commands
```
npm install
npm run build          # build the site into _site/ (first run reads WordPress, ~5 min; then cached 60 min locally)
npm start              # build and preview at http://localhost:8080
npm run check:urls     # every URL of the old site (docs/URL-INVENTORY.csv) is built or redirected
npm run check:links    # every internal link on every page leads somewhere
```

## Netlify settings
Build command `npm run build`, publish `_site`. Environment variables: see `.env.example` and `netlify.toml`.
Until launch the site is hidden from search engines and sends no tracking. `SITE_LIVE=true` turns both on.

## Files
- `lib/` data: WooCommerce (`woo.js`, `catalog.js`, `labels.js`), WordPress (`wp.js`, `galleries.js`, `clean.js`)
- `src/` templates: home `index.njk`, collections, products, content pages, blog, galleries, sitemap, search
- `src/assets/` CSS, JavaScript (options/price, galleries, search, menu), images from the design (WebP)
- `scripts/` checks, plus the Phase 0 discovery scripts

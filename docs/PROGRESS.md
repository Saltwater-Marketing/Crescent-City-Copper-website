# Progress Log

Newest entry first. Updated at the end of every session (see Guardrails in CLAUDE.md).

---

## 2026-11-04: Session 3 (continued): Phase 2 front-end build

**Phase:** Phase 1 signed off → Phase 2 (front-end build) done to preview stage

### Decisions (Andre')
- Canvas is final enough to build and go live with. **All content stays** (pages, posts, products).
- SEO content clean-up (merge / redirect overlapping pages and posts) **after launch**, as its own step. Recommended:
  launch with every address unchanged, so only one thing changes at a time.

### What was done
- Eleventy site built from the approved design, reusing Flambeaux's code (data readers, content cleaner, add-to-cart
  form, photo viewer, redirects pattern). 216 pages: home, 6 category pages, 42 product pages, 63 content pages
  (21 of them galleries), 91 blog posts (+ paginated blog index at `/copper-blog/page/N/`), project gallery,
  all-products page, HTML sitemap, search, 404, robots.txt, sitemap.xml.
- **Product options**: read from the public product pages (no read-only key in this session); field names and values
  match the Phase 0 scan exactly for all 42 products. Labels tidied in the build only (`lib/labels.js`), e.g.
  "60wX24h ADD" → "60w × 24h", "(Medium) up to 24W x 34L x 24H +" → "Medium, up to 24w × 34l × 24h".
  Nothing is pre-selected (same rule as Flambeaux); single-choice options are pre-ticked.
- Bracket style placeholders in the design now show the real bracket photos from the product descriptions.
- **Add to cart tested without touching the live cart** (request intercepted in the browser): it sends
  `add-to-cart`, `product_id`, the exact `addon-…` fields and `quantity`, as the live form does. Live guest-cart test still
  needs Andre's yes.
- Broken PDF links on the live site today (`/images/pdf/VENT-*.pdf`, an old `.aspx` link) point to the same files in
  `/wp-content/uploads/` on the new site.
- Old links inside page and blog text (`.htm` pages, `/_catalog_…`, `/copper-awnings/<product>/` etc., many 404 today)
  now 301 to the right page. Product lines no longer sold (fire pits, finials, rain chains…) → `/products/`.
- Page/post clash: the page keeps `/copper-dryer-vents/`, the post moved to `/copper-dryer-vents-blog/`.
- 4 empty pages not built, 301 instead: `/interior/` → `/`, `/shop-full-width/` and `/featured-product/` → `/products/`,
  `/permanent-metal-awnings-make-the-most-sense-…/` → `/permanent-awnings/`. `/sitemap/` is now a real sitemap page.
- Category pages are indexable (fixes the Yoast noindex) once `SITE_LIVE=true`. Until then every page is noindex and
  sends no tracking. GA4 `G-CYBQ830BGC` and Meta Pixel carried over; the dead UA tag dropped.
- Structured data: HomeAndConstructionBusiness (no fake opening hours), Product, BlogPosting, CollectionPage.

### Checks
- `npm run check:urls`: 212 old URLs → 205 built, 7 redirected, 0 missing.
- `npm run check:links`: 213 pages, 0 broken internal links.
- Playwright at 1280 and 390 px, 13 page types: no horizontal scroll; layouts match the design. (Some photos failed in
  local tests only because the live server throttles rapid loads; on Netlify every WordPress photo goes through
  Netlify Image CDN, which fetches each once and caches it.)
- Lighthouse 12.6.1 (local server, 1 run; Phase 0 median in brackets): home mobile 98 (62), LCP 2.3 s (9.0 s);
  collection mobile 97 (84); product mobile 95 (67), LCP 2.9 s (6.0 s); desktop 99–100 (95–97); accessibility 100.
  SEO 61 only because the preview is noindex on purpose.

### Wording I chose where the design had [TBC] (please confirm or correct)
- Shipping: "Checkout charges $0 for shipping. After you order, we contact you with a shipping quote based on the
  item's size and where it's going."
- Lead time: "Built to order. Shipping, pricing and lead times can change with the availability of raw materials,
  so please call to confirm before you order." (no week numbers until CCC gives them)
- Green Products line on home: "Copper is fully recyclable and can be reused without losing its integrity. Recycling
  it takes only 15% of the energy needed to produce new copper." (from the current Green Products page)
- Gallery "neighborhood" captions, author names and "[Confirm…]" items from the design were left out rather than invented.
- Product page "See it installed" uses the matching series gallery when one exists (150, 250, 300, 700, 900, 1000);
  otherwise it's titled "Copper awnings, installed" (no 100 Series gallery exists).

### What's next
1. Andre': connect this repo to a new site on SWM's Netlify team (build `npm run build`, publish `_site`), branch
   `claude/gracious-thompson-ejubat` or main after merge. Set `WC_URL` and `SHOP_URL` = `https://crescentcitycopper.com`.
   Review the netlify.app preview.
2. Andre's yes for one guest add-to-cart test on the live site (no order; cart emptied after).
3. Phase 3: checkout-side theme for cart / checkout / My Account.
4. After launch: SEO content clean-up (overlapping pages and posts).

### Open questions
- Confirm the shipping and lead-time wording above (and real lead times, if CCC wants them shown).
- 700 Series: the Bracket list still contains two size surcharges ("66w × 20d +$250", "72w × 20d +$450"). Shown as-is
  (prices are not ours to change). Client to confirm.
- Plumbing stack price (pending, client). "Right Angle Copper Wall Vent" description said "$216.00 Each" while the price
  is $238: the build hides that stale line, the real price shows.
- Read-only key in the environment settings would make Netlify builds faster (about 5 minutes now) and add weights.
- Copper Gutters is filed under Chimney Caps in WooCommerce; the new site shows it as a quote page and leaves it out
  of the Chimney Caps grid.

---

## 2026-11-04: Session 3: design pulled into the repo

**Phase:** Phase 1 (design) wrapping up, ready for Phase 2 (build)

### What was done
- The design finished in a claude.ai chat (canvas "Crescent City Copper — Website Redesign",
  https://claude.ai/artifact/44whgnwuUaxMJzDwhrMT3b) was copied into `design/`: the canvas index, all 12 artboards
  (home, collection, product, guide, blog post, gallery, each desktop + mobile) and its 29 images.
- `design/README.md`: which artboard becomes which page template, the colors and type as drawn, and the placeholders
  still to fill.
- Nothing on the live site was touched.

### What's next
1. Andre' confirms this canvas is the final, approved version (it was last saved 2026-11-03).
2. Fill the placeholders (lead times, neighborhoods for gallery photos, Green Products line, blog details).
3. Content plan sign-off (which pages and posts stay, merge or redirect), then Phase 2: Eleventy build from `design/`.

### Open questions
- Is the canvas final, or are changes still coming in the chat? (If so, re-pull before the build starts.)
- Earlier open questions (plumbing stack price, 700 Series brackets, out-of-stock awnings, category noindex) still stand.

---

## 2026-11-03: Session 2: read-only key, Phase 0 finished (except cart test)

**Phase:** Phase 0 (discovery, read-only)

### What was done
- Andre' sent two WooCommerce keys in chat (read-only, and read & write). The **read-only** pair is in `.env` (git-ignored)
  and was confirmed read-only (WooCommerce refused a write). The read & write pair was **not stored or used**.
- New `scripts/discovery-rest.mjs` (GET only, no customer details): plugins and versions, PHP, theme, options storage,
  shipping, payments, tax, coupons, customer role counts, order counts. DISCOVERY.md sections 1–4, 8 and new 9 updated.

### Key findings
- PHP 8.0.30 (end of life). Avada 7.16.2 with 8 outdated WooCommerce template overrides.
- WooCommerce Product Add-ons 3.0.13 (latest 8.4.6). YITH and PPOM options plugins are installed but unused.
- Shipping: only "Call for Shipping Rates" ($0 at checkout; FedEx off). Payments: PayPal Standard only. LA tax 9.25%.
- 651 orders total, 26 in the last 12 months; guest checkout; no coupons.
- Copper Gutters is filed under Chimney Caps.

### Design (end of session)
- Design happens the Flambeaux way: in a **new claude.ai Design canvas** (outside this repo), then the approved canvas is
  pulled into `design/`. Wrote `docs/DESIGN-BRIEF.md` (paste-ready prompt, facts, products, photo rules) and
  `docs/LARGE-PHOTOS.csv` (27 project photos at 1,200 px+, all awnings).
- New open items for the design: lead time, shipping wording, customer service days, vector logo.

### What's next
0. Andre': start a Design canvas with docs/DESIGN-BRIEF.md (artboards: home, collection, product, guide, blog post, gallery).
1. Andre's yes for the one guest add-to-cart test on the live site (no order; cart emptied after).
2. Andre': delete the read & write key in WooCommerce (it was shared in chat; a new one can be made in Phase 4 if needed).
   Add the read-only pair to the cloud environment settings so it survives new sessions (and later to Netlify).
3. Optional: Redirection export (CSV).
4. Then Phase 1: product page design and content plan.

### Open questions
- Shipping wording for product pages ("Call for Shipping Rates" today): client to confirm.
- Lead time for standard and custom items; customer service days; a vector logo (client).
- Plumbing stack price (pending, client). 700 Series bracket list with size surcharges (client).
- Deactivate YITH and PPOM (unused)? Update Product Add-ons (5 major versions behind)? Each needs Andre's yes.
- Should the 3 out-of-stock awnings and the Copper Gutters info product stay?
- Fix the category noindex in Yoast now (live change) or at launch?

---

## 2026-11-02: Session 1, continued: Andre's answers, plan without staging

**Phase:** Phase 0 (discovery, read-only)

### Decisions (Andre')
- **No staging site.** Plan adjusted (CLAUDE.md, DISCOVERY.md): read-only WooCommerce key on the live site; option label
  clean-up done in the build (label map), not in WordPress; any live WordPress change approved one at a time.
- **No contractor/trade pricing** or role discounts.
- **No larger product photos.** Design shows them at real size; gallery/project photos (some 1,200 px+) for big imagery.
- **No client word list**: SWM defaults apply.
- **2 Piece Copper Plumbing Stack price: PENDING** (client to confirm; no change until then).

### What's next
1. Andre': create a WooCommerce REST key with **Read** permission on the live site and add it to the cloud environment
   settings (WC_CONSUMER_KEY / WC_CONSUMER_SECRET). Optional: export the Redirection plugin's redirects (CSV).
2. Andre's yes for one guest add-to-cart test on the live site (no order; cart emptied after).
3. Then Phase 1: product page design and the content plan.

### Open questions
- Plumbing stack price (pending, client). 700 Series bracket list with size surcharges (client).
- Should the 3 out-of-stock awnings and the Copper Gutters info product stay?
- Fix the category noindex in Yoast now (live change) or at launch?
- Who else manages WordPress (WPMU DEV Hub Connector, Jetpack migration plugin)?

---

## 2026-11-02: Session 1: project set-up and Phase 0 discovery (public sources)

**Phase:** Phase 0 (discovery, read-only)

### Decisions
- Andre': rebuild crescentcitycopper.com "same routine as Flambeaux": redesign and content clean-up, WooCommerce stays
  for orders. Architecture carried over from Flambeaux in CLAUDE.md, to confirm at the end of Phase 0.
- Build lives in this repo (`Saltwater-Marketing/Crescent-City-Copper-website`).

### What was done
- CLAUDE.md project brief, `.gitignore`, `.env.example`.
- `scripts/discovery.mjs` (copied from Flambeaux, pointed at CCC) and new `scripts/scan-product-options.mjs`
  (reads the option dropdowns from every public product page). Raw data in `docs/discovery-data/`.
- `docs/DISCOVERY.md` (everything visible without admin access) and `docs/URL-INVENTORY.csv` (212 URLs).
- Lighthouse baseline (mobile/desktop, 3 runs each) for home, Copper Awnings category, 100 Series awning, cart.
- Nothing was written to the live site (all requests were page reads; no cart test on live).

### Key findings
- 42 products, 6 categories; options are WooCommerce Product Add-ons, same as Flambeaux, so the form handoff should carry over.
- Avada theme ships ~1.2 MB inline CSS per page. Few third-party scripts (GA4, dead UA tag, Meta Pixel).
- Option/price issues: 700 Series bracket list has size surcharges; Copper Plumbing Stack base $49 but every size adds $60+.
- All 6 category pages are noindex (Google told to skip them). Product photos are 500 px wide at most.
- 73 pages + 91 posts with lots of overlap; `/copper-dryer-vents/` page/post collision.

### What's next
1. Andre' reviews DISCOVERY.md and confirms the carried-over architecture.
2. Andre' arranges staging + application password + read-only WooCommerce key (cloud environment settings).
3. With access: finish Phase 0 (full plugin list, PHP, roles/discounts, payments/shipping, cart handoff test on staging).
4. Then Phase 1: product page design and the content plan (keep / merge / 301 for pages and posts).

### Open questions
- Does CCC have trade/contractor pricing or customer roles?
- Correct prices for the 2 Piece Copper Plumbing Stack and the 700 Series bracket options (client).
- CCC brand rules (words to use/avoid), design reviewer on the client side, lead times and shipping policy to state.
- Who else manages WordPress (WPMU DEV Hub Connector, Jetpack/wpcom migration plugin are present)?
- Can the client supply larger product photos (originals or new shoot)?
- Fix the category noindex in Yoast now (live change, needs Andre's yes) or wait for launch?
- Should the 3 out-of-stock awnings (500, 600, 800 Series) and the Copper Gutters info product stay?

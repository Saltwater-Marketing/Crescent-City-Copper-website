# Phase 0 Discovery: crescentcitycopper.com

Date: 2026-11-02. Read-only. Sources: the live site's public pages, sitemaps, public REST index and Store API.
**No staging site or API keys yet**, so the admin-only items (full plugin list, PHP version, roles, discount rules, the cart
test) are marked "needs access" below. Raw data: `docs/discovery-data/`. Re-run with `scripts/discovery.mjs` and
`scripts/scan-product-options.mjs`.

---

## Summary for Andre' (read this first)

**The Flambeaux plan fits Crescent City Copper well, and this site is much simpler.**

1. **Small catalog, same options plugin.** 42 products (39 on sale, 3 out of stock), 6 categories. All are "simple"
   products; the choices (Size, Bracket Style, Downspout Shape) are **WooCommerce Product Add-ons** fields, the same plugin
   and the same field names as Flambeaux. So the Flambeaux "Add to cart" form handoff should work unchanged.
   It still needs one test on a staging copy before we rely on it.
2. **Speed: the main problem is the theme itself, not trackers.** Every page carries about **1.2 MB of inline CSS** from
   the Avada theme (the whole HTML page is ~1.3 MB before any image or script loads). Flambeaux's pages were slow
   mostly because of third-party scripts; here there are few. Lighthouse numbers are in section 7.
3. **A few product-option errors customers can see today** (we'd only fix labels, never prices, and only with your yes):
   - **700 Series (Arched):** the *Bracket Options* list also contains two size choices ("66wX20d +$250", "72wX20d +$450").
     A customer can pick a size surcharge twice: once under Size and again under Bracket.
   - **2 Piece Copper Plumbing Stack:** listed at $49, but every size adds $60–$95, so the real price is $109–$144.
     Either the base price or the add-on prices are wrong. **PENDING: client to confirm** (no change until then).
   - **250 Series:** one size label still has an old price typed in ("72W x 30H ADD 425 (+$468)").
   - Label typos: "Size (Inches" and "Size(Diameter" (missing bracket), "Octoganal", "Barrell".
   - Two products don't require a size although every other one does (300 Series, Horizontal Rectangular Louver).
4. **Three product-option plugins are installed**: WooCommerce Product Add-ons (actually used), YITH Product Add-ons
   (loads its code and styling on every page but no product uses it), and PPOM (visible in the API). Candidates to switch
   off later, after checking (your yes first).
5. **Google is told to ignore all 6 shopping category pages** ("noindex"), the pages the main menu leads to. Likely a
   mistake; the new site fixes it.
6. **Product photos are small** (500 px wide at most, some 230 px). No larger versions exist; the design works around it.
7. **Content is the big clean-up.** 73 pages and 91 blog posts. Many overlap (e.g. `/copper-awnings-gallery/`,
   `/home-gallery/`, `/photo-gallery/`, `/product-photo-gallery/`; `/products/`, `/product-categories/`,
   `/featured-product/`, `/featured-products/`, `/shop-full-width/`). One URL is shared by a page and a blog post
   (`/copper-dryer-vents/`), so the post can't be reached. Phase 1 content plan decides keep / merge / 301.

**Update 2026-11-02 (Andre's answers):** no staging site; no contractor/trade pricing; no larger product photos;
no client word list (SWM defaults); the plumbing-stack price is **pending** (client to confirm).

**Working without staging.** Staging was only needed where we would *change* WordPress. Plan instead:
- **Reading** product data: a WooCommerce REST key with **Read** permission, made on the live site (WooCommerce →
  Settings → Advanced → REST API → Add key → Permissions: Read). Reading can't change anything. Until it exists, the build
  reads options from the public product pages.
- **Option label clean-up:** done in the new site's code (a label map), not in WordPress. Nothing on the live site changes.
- **Add-to-cart test:** one guest add-to-cart on the live site (no checkout, no order, cart emptied after). Needs Andre's yes.
- **Checkout theme (Phase 3):** built and previewed off-site; switched on at launch with Andre's yes. If we want a dress
  rehearsal, the host can make a temporary staging copy for that step only.
- **Rebuild webhook (Phase 4):** one setting added in WooCommerce at that point, with Andre's yes.

**Still useful (not blocking):** an export of the **Redirection** plugin's redirects (Tools → Redirection →
Import/Export → CSV), so old redirects carry over at launch.

---

## 1. Theme, page builder and hosting

| Item | Finding |
|---|---|
| WordPress | 7.1.4 |
| WooCommerce | 11.2.1 |
| Theme | **Avada** with `Avada-Child-Theme` (ThemeFusion). Version needs access. |
| Page builder | Avada's **Fusion Builder** |
| Caching | **WP Rocket 3.23.5.1** (page cache, delayed JavaScript). Pages still ship ~1.2 MB of inline CSS each. |
| Web server | Apache, on a dedicated server (`144.208.108.226`). PHP version needs access. |
| DNS / CDN | DNS at the host (`ns1/ns2.hltsrv1.peopleshostdedicated.com`). **No CDN** (no Cloudflare). |
| Domain | Bare domain `crescentcitycopper.com` is canonical; `www.` 301-redirects to it. |
| Staging | None known yet. **Needed.** |
| WordPress MCP | The site already exposes `mcp` and `wp-abilities` API namespaces (WordPress MCP adapter). Useful in Phase 4; check what it allows. |

## 2. Plugins

Without admin access, only plugins that show in page source or in the public API index are visible. Key:
**BO** = back office / checkout (stays). **FE** = front end only (replace or drop). **?** = check with access.

| Plugin | Seen in | Role | Notes |
|---|---|---|---|
| WooCommerce 11.2.1 | page source | BO | |
| **WooCommerce Product Add-ons** | page source, API | **BO** | Holds every product option. Must stay; cart pricing depends on it. |
| YITH WooCommerce Product Add-ons | page source | ? | Loads on every page; no product uses it. Candidate to deactivate (ask first). |
| PPOM (Product Addons & Fields) | API (`ppom/v1`) | ? | Third options plugin. Check whether any product uses it. |
| Flat Rate Shipping (`woo-extra-flat-rate`) | page source | BO | Shipping. |
| Yoast SEO | page source, API | BO → FE | Source of existing titles/descriptions; migrate them into the build. |
| Redirection | API | ? | **Existing redirects must be exported** and carried into `netlify.toml`. |
| WP Rocket | page source, API | FE | Speed plugin. Not needed on the new front end. |
| Fusion Builder (Avada) | page source | FE | Page builder. Content gets cleaned to plain HTML in the build. |
| Gravity Forms | Contact page (`gform_1`) | FE (+ data) | Contact form. Replace with Netlify Forms; check where entries go now. |
| Wordfence (+ Login Security) | API | BO | Security. |
| Jetpack, `wpcom-migration` | API | ? | Possibly left over from a site move. |
| Smush | API | ? | Image compression. |
| WPMU DEV Hub Connector | API (`hub-connector`) | ? | Someone manages this site via WPMU DEV. Ask who. |
| WooCommerce Analytics/Admin, POS catalog | API | BO | Standard WooCommerce. |

Full list, versions and inactive plugins: **needs access**.

## 3. Products and options

**Catalog:** 42 published products in the product sitemap. 39 visible in the shop; 3 awnings are out of stock and hidden
from the Store API (500 Series Barrell, 600 Series Dome, 800 Series Circus). All "simple" products; each has 1 image.
Copper Gutters has no price and no Add to cart button (an info/quote item).

**Product photos are small.** Every product's original image is at most 500 px wide (23 are 500×391; 14 are only
230–310 px). That is too small for a modern product page (Flambeaux's design used 1,000 px+), and it can't be fixed by
resizing. **No larger versions exist (Andre', 2026-11-02)**, so the design shows product photos at their real size and uses the
larger gallery/project photos for big imagery (8 of 35 sampled gallery photos are 1,200 px or wider).

| Category | Products | Options |
|---|---|---|
| Copper Awnings | 9 on sale (+3 out of stock) | Size (W×H×D, with surcharges); Bracket Style on 100, 150, 250 and 700 Series (Spear, French Quarter, Blacksmith, Rosetta, Scroll, S-Type/S-Bracket) |
| Copper Chimney Caps | 4 | Size: Small / Medium / Large / X-Large with max dimensions |
| Cupolas | 2 | none |
| Leader Heads | 5 (CH-PS-1 to 5) | Downspout Shape (Round/Square) + Size (3, 4, 3×4, 4×4) |
| Louvers | 10 | Size on most |
| Roof & Dryer Vents | 8 | Size/Diameter on most |

Prices range from $45 (plumbing stack) to $5,495 (Copper Cupola with Dome). Full list per product with every choice and
surcharge: `docs/discovery-data/product-options.json`.

**How options are built:** all are WooCommerce Product Add-ons **dropdowns**; field names follow
`addon-{product_id}-{option-slug}-{position}` (e.g. `addon-20817-size-inches-0`), values like `60wx24h-add-2`.
Identical to Flambeaux, so `lib/catalog.js` and the add-to-cart form from that repo carry over.

**Cart handoff:** not tested yet. Flambeaux showed this plugin rejects add-to-cart *links* with required options and accepts
a *form submission*. Testing that here means adding to a cart, so it waits for staging (never on the live site).

**Data issues** (labels only, never prices; fixed in the build, not in WordPress): see Summary item 3. Also:
- Labels carry "ADD" and "+" as text ("60wX24h ADD", "5 +"), and size formats differ between products
  ("48wX24h", "48W x 30H", "24X12X2"). The new product page can show them consistently.
- The four Chimney Caps have no category in the Store API, although the Chimney Caps category page shows them.
  Check with the REST key.

## 4. Discounts and customer roles

None. Andre' confirmed 2026-11-02: no trade/contractor pricing. The Flambeaux trade-pricing work does not apply.

## 5. URL inventory

Full list: `docs/URL-INVENTORY.csv` (212 URLs: path, type, source). Sitemaps by Yoast (`/sitemap_index.xml`).

| Type | Count | Source |
|---|---|---|
| Pages | 73 | `page-sitemap.xml` (incl. cart, checkout, my-account, thank-you) |
| Blog posts | 91 | `post-sitemap.xml` |
| Products | 42 | `product-sitemap.xml` (also lists the page `/shop-full-width/`) |
| Product categories | 6 | Store API; **no category sitemap** (Yoast has it switched off) |

Notes:
- Products at `/product/{slug}/`, categories at `/product-category/{slug}/`, posts at `/{slug}/`, blog index `/copper-blog/`.
- `/copper-dryer-vents/` is both a page and a post; the page wins and the post is unreachable.
- Old-looking pages to review in Phase 1: `/featured-product/`, `/featured-products/`, `/shop-full-width/`, `/product-categories/`,
  `/sitemap/`, `/feedback/` + `/send-feedback/`, `/interior/`, `/mcvaneys/` (an empty gallery page), 15+ separate gallery pages.
- Blog: 91 posts, some near-duplicates (`/how-custom-copper-awnings-add-value-to-your-property/` and `-2/`).
- Redirection plugin rules are not in this list yet (need the export).
- **All 6 product category pages are set to `noindex`** (Yoast setting), so Google is told not to list Copper Awnings,
  Chimney Caps, Cupolas, Leader Heads, Louvers or Roof & Dryer Vents, the main menu's shopping pages. Combined with no
  category sitemap, this looks like a mistake. The new site will make them indexable unless Andre' says otherwise.
  (Every page, post and product is indexable; cart and my-account are noindex as they should be.)

## 6. Tracking

| Tool | ID | Where it loads |
|---|---|---|
| GA4 | `G-CYBQ830BGC` | gtag.js directly in the page (no Tag Manager) |
| Universal Analytics | `UA-8733290-1` | Still loaded. **Google switched UA off in 2023**; this tag does nothing. Drop it. |
| Meta Pixel | `1984973335266515` | Page source |
| Google Tag Manager | none | |
| Google Ads, call tracking, chat widget | none found | |
| Forms | Gravity Forms (contact) | `/contactinfo/` |

Structured data (Yoast + a hand-made LocalBusiness block) has an unfilled placeholder: opening hours read
"Please insert valid ISO 8601 date/time here". Google ignores or flags it. The new site fixes this.

## 7. Performance baseline (Lighthouse, lab data)

Median of 3 runs per row, Lighthouse 12.6.1 from the cloud session (mobile = simulated mid-range phone on slow 4G;
desktop = desktop preset). Pages: home; collection = Copper Awnings category; product = 100 Series Standing Seam Copper
Awnings; cart (empty). Lab data only. Per-run numbers: `docs/discovery-data/lighthouse-summary.json`.

| Page | Device | Perf | FCP | LCP | TBT | CLS | Speed Index | Page weight | Requests | Access. | Best pr. | SEO | Runs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | mobile | 62 | 3.9 s | 9.0 s | 82 ms | 0.000 | 6.1 s | 1.5 MB | 73 | 96 | 96 | 85 | 3 |
| home | desktop | 95 | 0.8 s | 1.3 s | 0 ms | 0.001 | 1.4 s | 1.5 MB | 73 | 91 | 100 | 85 | 3 |
| collection | mobile | 84 | 2.9 s | 3.7 s | 9 ms | 0.005 | 3.3 s | 0.9 MB | 67 | 98 | 96 | 50 | 3 |
| collection | desktop | 97 | 0.8 s | 1.1 s | 0 ms | 0.001 | 1.0 s | 1.1 MB | 69 | 90 | 100 | 42 | 3 |
| product | mobile | 67 | 4.3 s | 6.0 s | 81 ms | 0.001 | 4.3 s | 0.9 MB | 75 | 89 | 96 | 85 | 3 |
| product | desktop | 97 | 0.7 s | 1.2 s | 0 ms | 0.001 | 1.0 s | 0.9 MB | 76 | 86 | 100 | 85 | 3 |
| cart | mobile | 44 | 3.5 s | 4.9 s | 1130 ms | 0.052 | 7.4 s | 1.5 MB | 119 | 96 | 75 | 46 | 3 |
| cart | desktop | 86 | 1.1 s | 1.5 s | 80 ms | 0.003 | 2.8 s | 1.6 MB | 120 | 88 | 78 | 46 | 3 |

Google's "good" thresholds: LCP under 2.5 s, TBT under 200 ms, CLS under 0.1.

**What this says:**
- **Better than Flambeaux on paper, still slow on phones.** Mobile scores 44–84; home page LCP 9.0 s and product page
  6.0 s (target under 2.5 s). Desktop is fine (86–97).
- **The cause is the theme, not trackers.** Each page's HTML is ~1.3 MB, almost all inline CSS, which must download before
  anything shows. Blocking time is low except on the cart (1.1 s, WooCommerce + add-on scripts).
- **SEO scores 42–50 on collection pages because they are set to "noindex"** (see section 5). The cart is noindex on purpose.


## 8. Risks and flags for the architecture

| # | Issue | Affects | Recommendation |
|---|---|---|---|
| 1 | No staging site | Changes to WordPress | Read-only key on live; label fixes in the build; each live change approved one by one |
| 2 | Cart handoff untested | Decision 3 | One guest add-to-cart test on live with Andre's yes (expected to work: same plugin) |
| 3 | 700 Series bracket list contains size surcharges; plumbing-stack price mismatch | Orders today | Client confirms correct prices (pending); label fixes in the build |
| 4 | Three options plugins installed | Speed, maintenance | Confirm unused ones, then deactivate with your yes |
| 5 | Unknown Redirection rules | URLs | Export and carry into `netlify.toml` |
| 6 | Page/post URL collision at `/copper-dryer-vents/` | SEO | Give the post its own URL with a 301 |
| 7 | No CDN, DNS at the host | Launch | DNS change at launch is made at the host (or move DNS to Netlify/Cloudflare first) |
| 8 | Who else manages the site (WPMU DEV Hub, Jetpack migration) | Coordination | Andre' to confirm |
| 9 | Dead UA tag; schema placeholder | Analytics, SEO | Fixed by the rebuild |
| 10 | Category pages noindex | SEO today | Fix in the rebuild (or now in Yoast, with your yes) |
| 11 | Product photos max 500 px | Phase 1 design | No larger photos; design around them, gallery photos for large imagery |

# Crescent City Copper: Headless Rebuild

Project brief for Claude Code. Read this fully at the start of every session.
Owner: Andre' Savoie, Saltwater Marketing (SWM). Client: Crescent City Copper (a division of Juneau-Odenwald, New Orleans).
Andre' is not a developer by trade. Explain decisions in plain language, one step at a time.

Sister project: `Saltwater-Marketing/flambeaux-lighting-website` was rebuilt the same way first. Reuse its code and
lessons (lib/, scripts/, netlify.toml patterns, the add-to-cart form handoff) instead of reinventing them.

## Goal

Rebuild https://crescentcitycopper.com as a fast, fully redesigned headless storefront:

- New front end: Eleventy static site in this repo (`Saltwater-Marketing/Crescent-City-Copper-website`), hosted on SWM's
  Netlify team. Same conventions as other SWM sites.
- WordPress + WooCommerce stays as the back office only: products, orders, payments, shipping, customer accounts.
- Cart, checkout and My Account stay native WooCommerce, on a subdomain (proposed: `shop.crescentcitycopper.com`),
  with a minimal theme styled to match the new site.
- Why: the current site is slow and heavy (Avada theme, about 1.2 MB of inline CSS on every page), the content needs a
  clean-up, and Andre' wants to manage products and content through Claude without relying on outside web developers.

## Architecture decisions (carried over from Flambeaux; adjusted 2026-11-02 for no staging site)

1. Headless browsing pages, native checkout. Do not rebuild cart, checkout, payments, tax, shipping, or account pages.
2. Product data from the WooCommerce Store API (public, read-only) at build time. Product options (size, bracket style,
   downspout shape) are WooCommerce Product Add-ons fields; the public product pages show them, and a **read-only**
   REST key (Netlify environment variables only) is the clean way to read them, as on Flambeaux.
   **No staging site** (Andre', 2026-11-02): the read-only key is made on the live site. Reading never changes anything.
   Until that key exists, the build can read options from the public product pages (scripts/scan-product-options.mjs).
3. Add to cart hands off to the native WooCommerce cart on the shop subdomain by submitting a form (POST) with the
   Product Add-ons fields (`addon-{id}-{slug}-{position}`). Same plugin and field names as Flambeaux. Test once on the live site as a guest cart
   (no order placed, cart emptied after), only with Andre's yes.
4. Product or content changes in WooCommerce trigger a Netlify rebuild via a WooCommerce webhook to a Netlify build hook.
5. Every existing URL path stays identical on the new site. Anything that moves gets a 301 in `netlify.toml`.
   The site lives on the bare domain `crescentcitycopper.com` (www redirects to it); keep it that way unless Andre' says otherwise.
6. Product photos: use each product's current WooCommerce images. No larger versions exist (Andre', 2026-11-02), so the
   design shows them at their real size (max 500 px wide) and uses the larger gallery/project photos for big imagery.
7. Product option labels get cleaned up **in the build** (a label map in this repo), not in WordPress, so nothing on the
   live site changes. Labels only, never prices.
8. No trade/contractor pricing or role-based discounts (Andre', 2026-11-02).

## Guardrails (non-negotiable)

- There is no staging site. Never write to the live WordPress site except for a specific change Andre' approves
  one at a time (stating exactly what will change). Reading (pages, Store API, read-only key) is fine.
- Never commit credentials. Keep them in `.env`, which must be in `.gitignore`.
- WooCommerce REST API keys stay read-only until the build phase that needs write access, and Andre' approves the switch.
- Never install, update, deactivate, or delete plugins, users, roles, or settings on any WordPress install without
  asking first and stating exactly what will change.
- Never change prices, discount rules, payment gateways, tax or shipping settings.
- Before any destructive or hard-to-reverse step, stop, explain it, and wait for a yes.
- At the end of each phase, stop and summarize for Andre' before starting the next.
- At the end of every session, update docs/PROGRESS.md with: date, phase, what was done,
  what's next, open questions, and decisions made. Read docs/PROGRESS.md at the start of every session.

## Phases

### Phase 0: Discovery (read-only)
`docs/DISCOVERY.md`: theme, plugins, product options and the cart handoff, discounts/roles, URL inventory
(`docs/URL-INVENTORY.csv`), tracking, Lighthouse baseline, hosting, risks. Stop and review with Andre' before Phase 1.

### Phase 1: Design
- Product page first (options as clear steps: Size, Bracket Style / Downspout Shape where they apply; live price;
  lead time; dimensions; "Talk to us" with the phone number on mobile), then home and collection pages.
- Content plan: which of the 73 pages and 91 blog posts stay, merge or redirect. Get sign-off before building.

### Phase 2: Front-end build
- Eleventy per SWM conventions: `src/_data/`, `src/_includes/`, WebP images, `netlify.toml` with redirects and headers.
- Unique title/meta, canonical and Open Graph, Organization/LocalBusiness and Product JSON-LD, sitemap.xml, robots.txt, 404.
- Verify: build, Playwright screenshots at 1280px and 390px, no horizontal scroll, no broken images, Lighthouse vs Phase 0.

### Phase 3: Checkout-side theme
Minimal theme for cart, checkout and My Account, matching the new design; header/footer link back to the Netlify site.
No staging: build and preview it locally; switching it on is a live change, done at launch with Andre's yes
(or ask the host for a temporary staging copy just for this step).
- **Checkout must ask for the customer's phone number** (Andre', 2026-11-04, client request): a phone field in the
  checkout billing details, set to **required** so CCC can call about shipping and custom details. WooCommerce has this
  built in (billing phone: hidden / optional / required); check its current setting first. Changing it is a live setting
  change, so it needs Andre's yes. Also show CCC's own number (1-877-251-5327) on cart and checkout pages.

### Phase 4: Back-office connections
WooCommerce webhook → Netlify build hook. WordPress/WooCommerce MCP for Claude Code (read-only first). Drafts, then review.

### Phase 5: Launch
Test orders end to end; every old URL resolves (200 or 301); tracking verified in real time; backups and written rollback
plan; DNS (domain to Netlify, shop subdomain to WordPress).

## Brand rules for any copy or design

No client-specific word list (Andre', 2026-11-02): SWM defaults apply.
- Voice: educated, helpful, direct, crafted. Name materials and processes precisely (natural copper sheet, standing seam,
  fabricated in-house in New Orleans). No filler words like "high-quality," "premium," "beautiful," "stunning."
- Facts from the current site: toll-free 1-877-251-5327 (clickable everywhere), local 504-733-0331,
  info@crescentcitycopper.com, 1109 Dealers Ave., New Orleans, LA 70123, customer service 8:30 am–5:30 pm Central.
  Custom-built items (awnings, cupolas) are non-returnable; standard items 30 days, 15% restocking fee.
- Design: no grey body or sub-copy text. Dark text on light backgrounds, white on dark.
- SEO title tags: "[Specific descriptor] | Crescent City Copper", under 60 characters where possible.

# Progress Log

Newest entry first. Updated at the end of every session (see Guardrails in CLAUDE.md).

---

## 2026-11-04: Agenda item added

- **Client request (via Andre'): checkout must have a place for the customer's contact phone number.** Plan: WooCommerce's
  built-in billing phone field, set to required (checked during the add-to-cart test; the switch is a live setting change
  and needs Andre's yes), plus CCC's own number shown on cart and checkout. Recorded under Phase 3 in CLAUDE.md; can be
  switched on before Phase 3 if Andre' wants it sooner.

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

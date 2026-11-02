# Progress Log

Newest entry first. Updated at the end of every session (see Guardrails in CLAUDE.md).

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

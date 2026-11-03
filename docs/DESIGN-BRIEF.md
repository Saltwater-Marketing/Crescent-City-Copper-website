# Design brief: crescentcitycopper.com (Phase 1)

For Andre' to paste into a **new claude.ai Design canvas**, the same way Flambeaux was designed. When a canvas is approved,
it gets pulled into `design/` in this repo and becomes the source of truth for the Phase 2 build.
Everything below comes from Phase 0 (`docs/DISCOVERY.md`). Items marked **[TBC]** still need an answer.

---

## Paste this into the Design canvas

> Design a full website redesign for **Crescent City Copper** (crescentcitycopper.com), a New Orleans sheet-metal shop
> (a division of Juneau-Odenwald) that fabricates architectural copper in-house: copper awnings, chimney caps, cupolas,
> leader (conductor) heads, louvers, and roof and dryer vents. Standard and custom sizes. Sold online with a WooCommerce
> cart, but most customers call first, so phone and email must be as easy to reach as "Add to cart".
>
> **Artboards (desktop 1440 px and mobile 390 px for each):**
> 1. Home
> 2. Collection page: Copper Awnings (9 products)
> 3. Product page: 100 Series Standing Seam Copper Awning (options: Size, then Bracket Style)
> 4. Content/guide page: "Why Choose Copper?" (long article with on-this-page contents)
> 5. Blog post
> 6. Project gallery (awnings grouped by series, photo viewer)
>
> **Voice:** educated, helpful, direct, crafted. Name materials and processes precisely (natural copper sheet,
> standing seam, fabricated in-house in New Orleans, develops a natural patina). No filler words ("high-quality",
> "premium", "beautiful", "stunning"). Title tags: "[Specific descriptor] | Crescent City Copper".
>
> **Design rules:** no grey body or sub-copy text; dark text on light backgrounds, white on dark. Fast and light: no
> sliders, no video backgrounds, system or one/two web fonts only. Accessible contrast and tap targets.
>
> **Look:** a fresh direction, not a copy of the current site. Copper and patina are the natural palette (the current
> site uses copper orange #C94909 and a patina green #A0CE4E with Open Sans). Keep the fleur-de-lis logo.
>
> **Header menu (current site, can be simplified):** Products (Copper Awnings, Chimney Caps, Cupolas, Leader Heads,
> Louvers, Roof & Dryer Vents) · Custom · Gallery · Learn More (Permanent Awnings, Commercial Awnings, Metal Awnings,
> Why Choose Copper?, Chimney Caps guide, FAQ, Blog) · About Us · Customer Service · Contact. Phone always visible.
>
> **Product page must have:** product photo, name, price ("from $880"), options as clear steps (1 Size, 2 Bracket Style)
> with a live total, Add to cart, plain statement of how shipping works **[TBC wording: today checkout charges $0 and
> shipping is quoted by phone afterwards]**, lead time **[TBC]**, dimensions, "Ask about custom sizes", return note
> (custom-built items like awnings are not returnable), a "See it installed" strip of project photos, and a persistent
> "Talk to us: 1-877-251-5327" button on mobile.
>
> **Photos:** product photos are small (at most 500 × 391 px, some 230 px), so show them in a contained frame at their real
> size, never stretched full-width. Use the large project photos (1,200 px wide, awnings on homes and businesses) for the
> home hero, collection headers and galleries. URLs in docs/LARGE-PHOTOS.csv.

---

## Facts for the copy

| Item | Value |
|---|---|
| Phone | 1-877-251-5327 (toll free, clickable everywhere); local 504-733-0331 |
| Email | info@crescentcitycopper.com |
| Address | 1109 Dealers Ave., New Orleans, LA 70123 |
| Hours | Customer service 8:30 am–5:30 pm Central **[TBC days]** |
| About | New Orleans sheet-metal fabricator; architectural copper made in-house on computer-controlled equipment; projects in the Garden District, French Quarter, Uptown, Old Metairie and the Northshore; featured in the Times-Picayune and Louisiana Homes & Gardens; division of Juneau-Odenwald; involved with NRCA and CSI. |
| Returns | Custom-built items (awnings, cupolas) not returnable unless defective/damaged/wrong; standard items within 30 days if not installed, 15% restocking fee; report damage within 14 days. |
| Payment | PayPal (current checkout). |
| Lead time | **[TBC]** |
| Shipping | Quoted after the order today ("Call for Shipping Rates"). **[TBC wording]** |

## Products (42; 39 on sale)

| Category | Products, starting price |
|---|---|
| Copper Awnings | 100 Series Standing Seam $880 · 150 Series Oversized $1,210 · 200 Series Sweep $990 · 250 Series Slight Sweep $1,155 · 300 Series Sweep $1,623 · 400 Series Victorian $880 · 700 Series Arched $1,210 · 900 Series Hip $1,073 · 1000 Series Canopy $1,155 (500/600/800 Series out of stock) |
| Chimney Caps | A-Frame $578 · Quad $578 · Round $659 · Bella $1,095 (sizes Small to X-Large) |
| Cupolas | Copper Cupola $4,395 · with Dome $5,495 |
| Leader Heads | CH-PS-1 to CH-PS-5, $204–$384 (Round/Square downspout; 3, 4, 3×4, 4×4 in.) |
| Louvers | 10 styles, $215–$495 |
| Roof & Dryer Vents | Plumbing stacks, jacks, kitchen/slope/sweep dryer vents, ridge cap, $45–$655 |
| Copper Gutters | Information/quote only (no price) |

Example for the product artboard, **100 Series Standing Seam Copper Awning**, $880:
Size: 48w × 24h (included) · 60w × 24h (+$193) · 72w × 30h (+$660) · 80w × 30h (+$880).
Bracket Style: Spear · French Quarter · Blacksmith · Rosetta · Scroll · S-Bracket (no charge).

## Logo

Current files are small PNGs (`/wp-content/uploads/2019/06/logo_crescentcitycopper.png`, 222 × 77; white version
`/wp-content/uploads/2019/07/logo_white.png`, 147 × 37). **[TBC] Ask the client for a vector (SVG/AI/EPS) logo**;
otherwise the design canvas redraws it cleanly as SVG.

## After the canvas is approved

1. Pull the approved canvas into `design/` with a short README (as in the Flambeaux repo).
2. Content plan (which of the 73 pages and 91 posts stay, merge or redirect) for Andre's sign-off.
3. Phase 2 build in this repo.

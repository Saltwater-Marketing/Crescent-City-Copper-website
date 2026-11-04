# Phase 1 design (approved canvas)

This folder is a copy of the Phase 1 design canvas made in a claude.ai chat:
**Crescent City Copper — Website Redesign**, https://claude.ai/artifact/44whgnwuUaxMJzDwhrMT3b
(pulled 2026-11-04, canvas version `1793745158-1ee4`).

The canvas link is still the best way to *look at* the design. This folder is the reference the Eleventy build (Phase 2)
works from, so the design is versioned with the code.

## What's here

- `project/canvas.json`: the canvas index (6 pages, 12 artboards, their sizes and order).
- `project/*.dc.html`: one file per artboard, desktop (1440) and mobile (390) for each page:

| Page | Desktop | Mobile | Becomes on the site |
| --- | --- | --- | --- |
| Home | `Main.dc.html` | `Home-Mobile.dc.html` | `/` |
| Collection: Copper Awnings | `Collection-Desktop.dc.html` | `Collection-Mobile.dc.html` | product category template |
| Product: 100 Series (interactive options) | `Product-Desktop.dc.html` | `Product-Mobile.dc.html` | product template |
| Guide: Why Choose Copper? | `Guide-Desktop.dc.html` | `Guide-Mobile.dc.html` | guide / info page template |
| Blog post | `Blog-Desktop.dc.html` | `Blog-Mobile.dc.html` | blog post template |
| Project gallery (interactive filter) | `Gallery-Desktop.dc.html` | `Gallery-Mobile.dc.html` | gallery page |

- `assets/`: the 29 images the canvas uses. Each file is named after its canvas ID, so `/_blob/<id>` in the artboard
  HTML is `assets/<id>.jpg` or `.png` here. The build will rename them, convert to WebP and resize; these are the originals.

The `.dc.html` files run inside the claude.ai canvas editor (`support.js`), so they won't open as normal web pages.
They are a design reference, not site code: the build re-creates them as Eleventy templates.

## Design system (as drawn)

- Type: Open Sans 400/600/700/800 (Google Fonts). Body 17px / 1.6.
- Colors:
  - Text `#1C1916` (near-black), page ground `#F5F5F5`, cards `#FFFFFF`, borders `#D8D2C8`
  - Header copper `#985223`, button orange `#C94909`, link copper `#9E3D0A`, heading red `#812716`
  - Patina green band `#163F3A` (divider `#2E5A54`), footer brown `#6C4A40`
- No grey copy: the only grey (`#8A8178`) is the border of unselected option buttons on the product page.
- Phone number is a `tel:` link everywhere; mobile has a Call / Email bar above the header.

## Placeholders still to fill (from the client or the live site)

| Placeholder | Where |
| --- | --- |
| `[Neighborhood TBC]`, `[Project location TBC]` | Gallery and product photo captions |
| `[Confirm which project photos show the 100 Series]` | Product page |
| `[X–Y weeks, TBC]` lead time, `[X in, TBC]` dimension | Product page |
| `[Confirm whether CCC offers this.]`, `[TBC wording]` | Product / guide copy |
| `[One line from the current Green Products page]` | Home, green band |
| `[Existing blog post title]`, `[Author]`, `[Author name]`, dates | Blog post and blog cards |
| `[Year]` | Footer copyright (the build fills this automatically) |

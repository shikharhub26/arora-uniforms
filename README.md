# Arora Uniforms, Kalkaji — website mock-up

A sleek, mobile-first mock-up for **Arora Uniforms**, H-10B Kalkaji Main Road (near Desh Bandhu College), New Delhi 110019. The business has supplied school and office uniforms since 1996; this site shows how it could take online orders through the year.

Everything is plain HTML, CSS and JavaScript. There is no build step and no framework.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8080
# then visit http://localhost:8080
```

It also deploys as-is to GitHub Pages, Netlify or any static host.

## What is in the mock-up

| Area | What it does |
| --- | --- |
| Announcement ticker | Scrolling strip in the school-tie stripe for offers and notices |
| Hero carousel | Three auto-advancing banners (school, winter, corporate) with progress bars, arrows and swipe |
| Offers marquee | Continuously moving advertisement cards; pauses on hover or touch |
| School finder | Search or tap a school, pick class and season, add single items or the full kit |
| Collections and shop | Six category tiles and twelve product cards with size chips and filters |
| Winter banner | Live countdown to the pre-order deadline with animated stripes |
| Order calendar | Month-by-month view of what parents order when, with a "now" marker |
| Size guide | Four size tables plus a height/age size suggester |
| Corporate quote form | Demo form with validation and a success state |
| Cart and checkout | Slide-in order drawer, delivery threshold bar, three-step demo checkout, order number |
| Visit section | Address, hours, phone with copy button, schematic map, directions and WhatsApp links |
| Theme | Light and dark, following the device setting with a manual toggle |

The layout is responsive from 360 px phones to wide desktops, respects reduced-motion settings, and keeps keyboard focus visible.

## Replace the sample content

All sample content is in two files:

- `index.html`: copy, prices, product cards, offers, testimonials, address and hours.
- `js/main.js`: the `SCHOOLS` list (names, colours, kit items), `SIZE_TABLES`, the countdown date (`2026-11-15`), the free-delivery threshold and shop hours used by the "Open now" pill.

Images live in `assets/img/` as WebP. They are AI-generated placeholders; swap them for real product photos with the same file names, or update the `src` attributes. The crest in `assets/logo.svg` is a starting point for the brand mark.

## Verify before going live

These details came from public directory listings (Justdial, Sulekha, Magicpin, IndiaMART) and should be confirmed with the shop:

- Phone: 011 2645 3464 (also used for the WhatsApp links as a placeholder; replace with the shop's WhatsApp number).
- Hours: 10:00 to 20:00, daily.
- Year established: 1996.

The school list, prices, offers, stats and testimonials are invented for the mock-up and are labelled as such on the page.

## Next steps for a real store

1. Pick a commerce backend (Shopify, WooCommerce, or a custom API) and wire the cart to it.
2. Add a payment gateway (Razorpay or PayU for UPI and cards in India).
3. Replace the quote form's demo handler with a real submission (email or WhatsApp Business API).
4. Add per-school pages with real kits and crests.

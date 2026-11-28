# BUNON — website

A single-page website (Home · About · Products · Contact) built with **React + Vite**
and published to **GitHub Pages** by GitHub Actions.

**Live:** https://riyad-ahmed.github.io/bunon/ · **Code:** https://github.com/riyad-ahmed/bunon

It is a showcase: visitors browse the collection and send enquiries. Online buying
(bag, checkout, payment providers) is built in but **switched off** — see
[Online shop](#online-shop-switched-off).

## Run it on your computer

Needs [Node.js](https://nodejs.org) 20.19+ or 22.12+.

```bash
npm install     # first time, and whenever package.json changes
npm run dev     # opens on http://localhost:5173 and updates as you edit
```

| Command            | What it does                                                        |
| ------------------ | ------------------------------------------------------------------- |
| `npm run admin`    | The product dashboard (same as double-clicking **BUNON Products.bat**) |
| `npm run dev`      | Development server with instant reload                              |
| `npm run dev:shop` | Same, with the switched-off shopping bag turned on — local preview only |
| `npm run build`    | Production build into `dist/`                                       |
| `npm run preview`  | Serves `dist/` locally, to check the production build               |
| `npm run lint`     | Code checks (oxlint)                                                |
| `npm test`         | Unit tests for the site's logic (Node's built-in test runner)       |
| `npm run check`    | Lint + tests + build — the same checks GitHub runs before publishing |

## Everyday edits

| To change…                                         | Edit                                             |
| -------------------------------------------------- | ------------------------------------------------ |
| Email, phone, location, social links, currency     | `src/config/site.js`                             |
| How the contact form delivers messages             | `src/config/site.js` → `contactForm`             |
| Headlines and paragraphs                           | `src/content/copy.js` (`*word*` → gold italics)   |
| Products, photos, prices, colours, sizes, categories | **The product dashboard** — see below |
| Colours, fonts, spacing, animation speed           | `src/styles/tokens.css`                          |
| Menu items                                         | `src/config/navigation.js`                       |

Contact details (madebybunon@gmail.com, Facebook and Instagram) are set in
`src/config/site.js`; an empty value is hidden. The contact form needs an email (or a form
service, see [Contact form](#contact-form)). With no email, phone or social link at all,
the Contact section says details are coming soon and the "Enquire" buttons hide.

## Products: the BUNON product dashboard

**Double-click `BUNON Products.bat`** (in this folder). A black window opens — keep it
open while you work — and the dashboard opens in the browser at
http://localhost:5173/admin/. It only exists on this computer; it is never part of the
website.

- **+ নতুন প্রোডাক্ট** → add photos (as many as you like; the first is the cover, ★
  makes another one the cover, a photo can belong to one colour), name, category,
  price, colours, sizes, stock and an optional description.
- **No save button**: every change is saved a moment after you make it.
- **No publish button needed**: about 20 seconds after the last change the dashboard
  saves the products in git ("Update products") and pushes them; GitHub rebuilds the
  live site in a minute or two. The status at the top shows what's happening
  (**এখনই পাঠান** sends straight away). Without internet it keeps trying, and picks up
  anything left over the next time it starts.
- A product appears on the website once it has a **name and at least one photo**,
  unless **ওয়েবসাইটে দেখান** is switched off. No price → "Price on request"; stock 0 →
  "Sold out". Newest products come first.
- **প্রিভিউ** opens the website on this computer, updated instantly.

Where things are saved:

| File | What | Public? |
| --- | --- | --- |
| `src/data/products.json` | Products: name, category, price, colours, sizes, description, photos, sold out, shown/hidden | Yes — it builds the website |
| `src/assets/products/photos/` | Photos, resized to at most 1600px | Yes |
| `private/stock.json` | How many of each are in stock | **No** — stays on this computer (git ignores it) |

The dashboard is plain HTML/CSS/JS in `admin/`; its server side (saving, photos,
publishing) is `scripts/admin/`, run by Vite only in `--mode admin`. Publishing only
ever includes the product files above, and stops if other changes are staged in git.

## Project structure

```
BUNON/
├── .github/workflows/deploy.yml   Builds and publishes to GitHub Pages on every push to main
├── BUNON Products.bat             Double-click: open the product dashboard
├── admin/                         The product dashboard page (HTML, CSS, JS)
├── scripts/admin/                 Its server side: saving, photos, publishing (and tests)
├── public/                        Copied as-is: favicons, link-preview image, .nojekyll
├── src/
│   ├── main.jsx                   Entry point: fonts, global styles, <App />
│   ├── App.jsx                    Page layout and providers
│   ├── assets/
│   │   ├── brand/                 Logo (original + reversed version for the dark theme)
│   │   └── products/              Placeholder + product photos (photos/, from the dashboard)
│   ├── components/
│   │   ├── layout/                Header, MobileMenu, Footer
│   │   ├── sections/              Hero, About, Products, Contact
│   │   ├── products/              ProductCard, ProductFilter, ProductQuickView
│   │   ├── contact/               ContactForm, ContactDetails
│   │   └── ui/                    Button, Dialog, Reveal, Logo, Stitch, …
│   ├── config/                    site.js · navigation.js · commerce.js
│   ├── content/copy.js            All website text
│   ├── context/enquiry/           Connects "Enquire" buttons to the contact form
│   ├── data/                      products.json (from the dashboard) + products.js
│   ├── features/commerce/         Online shop — bag, checkout, payment providers (off)
│   ├── hooks/                     Scroll, reveal and menu behaviour
│   ├── lib/                       Small helpers (prices, images, storage, scrolling)
│   ├── services/enquiry.js        Contact-form validation and delivery
│   └── styles/                    tokens.css (design tokens) · global.css
├── index.html                     Page shell: title, description, link-preview tags
└── vite.config.js                 Build settings (relative paths for GitHub Pages)
```

Each component keeps its styles beside it in a `*.module.css` file (CSS Modules).

## Publishing to GitHub Pages

Already set up: the repository is `riyad-ahmed/bunon`, and **Settings → Pages → Source** is
**GitHub Actions**. Every push to `main` runs `.github/workflows/deploy.yml`:
install → lint → test → build → deploy, and the site at
https://riyad-ahmed.github.io/bunon/ updates a minute or two later. Progress is in the
repository's **Actions** tab; if a step fails, the live site stays as it was.

Asset paths are relative (`base: './'` in `vite.config.js`), so the site also works under
another address. Only the link-preview tags in `index.html` (`og:url`, `og:image`) name
the address — update them if it changes. The preview image is `public/og-image.jpg`
(1200×630).

## Contact form

GitHub Pages can't send email by itself. By default, **Send** opens the visitor's email
app with their message written and addressed to `contact.email`. To receive messages
without the visitor leaving the page, create a free form at [Formspree](https://formspree.io)
and paste its endpoint into `contactForm.endpoint` in `src/config/site.js`.

## Online shop (switched off)

| Piece                                   | Where                                          |
| --------------------------------------- | ---------------------------------------------- |
| On/off switches and payment provider    | `src/config/commerce.js`                       |
| Bag state (saved in the visitor's browser) | `src/features/commerce/cart/`               |
| Checkout service and payment providers  | `src/features/commerce/checkout/`              |
| Bag button, bag drawer, buy buttons     | `src/features/commerce/components/`            |

Preview it locally with `npm run dev:shop`. To open the shop:

1. Choose a payment `provider` in `src/config/commerce.js`:
   - `'payment-links'` — a hosted checkout link per product (Stripe Payment Links,
     PayPal, …). Products already pass a `paymentLink` field through to the website; add
     a box for it in the product dashboard when you need it. No server needed.
   - `'checkout-endpoint'` — a small serverless function creates a checkout session for
     the whole bag. Needed for multi-item bags and for gateways that use secret keys
     (SSLCommerz, bKash, Stripe Checkout). It must look up prices itself — never trust
     prices sent from a browser.
2. Set `cartEnabled: true` to show "Add to bag" and the bag.
3. Set `checkoutEnabled: true` to let visitors pay.

## Notes for developers

- Logic modules that have tests (`lib/catalog.js`, `lib/presets.js`, `lib/format.js`,
  `services/enquiry.js`, `features/commerce/cart|checkout`, `scripts/admin/`) use relative imports with `.js` extensions, so plain
  Node can run them in `npm test`. Components use the `@/` alias for `src/`.
- `vite.config.js` sets `root` to the project folder's real path. On Windows a terminal
  can open in `h:\BUNON` while packages resolve to `H:\BUNON`; without this, Vite 8
  bundles React twice and the built page stays blank.
- Fonts (Cormorant Garamond, Manrope) are bundled from `@fontsource` — no requests to
  Google at runtime.

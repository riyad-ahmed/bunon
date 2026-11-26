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
| `npm run dev`      | Development server with instant reload                              |
| `npm run dev:shop` | Same, with the switched-off shopping bag turned on — local preview only |
| `npm run sync`     | Copy the latest products from the Business Manager dashboard        |
| `npm run publish:site` | Copy the latest products and put them on the live site (same as **Publish website.bat**) |
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
| Products, photos, prices, colours, sizes, categories | **The Business Manager dashboard** — see below |
| Colours, fonts, spacing, animation speed           | `src/styles/tokens.css`                          |
| Menu items                                         | `src/config/navigation.js`                       |

Contact details are still empty. Until an email, phone or social link is added in
`src/config/site.js`, the Contact section says the details are coming soon and the
"Enquire" buttons stay hidden. The contact form appears once there's an email (or a form
service, see [Contact form](#contact-form)).

## Products come from the Business Manager dashboard

Add and edit products in the dashboard (`G:\BUNON\accounting-management`); the website
follows. Each colour/size record there becomes one choice on a single website product
(e.g. Hoodie: Green M, Green L, Black L), grouped by name within its category. Names and
colours typed in lower case are tidied ("black" → "Black").

The dashboard saves its backup automatically (Backup & Restore → **Choose backup folder…**
→ **Save automatically after every change**), currently to `G:\BUNON\backup`. The website
reads the newest backup in the folders listed in `catalog.config.js`, so:

- `npm run dev` updates the open website within a few seconds of each change;
- **double-click `Publish website.bat`** (or `npm run publish:site`) to put the latest
  products on the live site. It saves only the product files in git and pushes them;
  GitHub rebuilds the site in a minute or two. GitHub's servers can't reach this PC,
  so this step is needed after product changes;
- `npm run sync` (or `npm run build`) only refreshes the products in the project.

What is copied — and what never is:

| Copied to the website | Never copied |
| --- | --- |
| Name, category, colour, size, description, selling price, photo, in stock yes/no | Costs, cost breakdown, profit, notes, SKU, stock counts, orders, customers, income, expenses, capital, SHAD |

Each dashboard product has a **Website** field: *Hide from website* keeps it off the site.
No selling price → "Price on request"; no photo → a neutral placeholder; stock at zero →
"Sold out". Settings live in `catalog.config.js`; the generated files are
`src/data/catalog.json` and `src/assets/products/catalog/` — don't edit them by hand.

## Project structure

```
BUNON/
├── .github/workflows/deploy.yml   Builds and publishes to GitHub Pages on every push to main
├── catalog.config.js              Where products come from (the dashboard's backup folders)
├── Publish website.bat            Double-click: put the dashboard's latest products online
├── scripts/catalog/               Dashboard → website product sync (and its tests)
├── scripts/publish-site.js        What Publish website.bat runs
├── public/                        Copied as-is: favicons, link-preview image, .nojekyll
├── src/
│   ├── main.jsx                   Entry point: fonts, global styles, <App />
│   ├── App.jsx                    Page layout and providers
│   ├── assets/
│   │   ├── brand/                 Logo (original + reversed version for the dark theme)
│   │   └── products/              Placeholder + photos synced from the dashboard (catalog/)
│   ├── components/
│   │   ├── layout/                Header, MobileMenu, Footer
│   │   ├── sections/              Hero, About, Products, Contact
│   │   ├── products/              ProductCard, ProductFilter, ProductQuickView
│   │   ├── contact/               ContactForm, ContactDetails
│   │   └── ui/                    Button, Dialog, Reveal, Logo, Stitch, …
│   ├── config/                    site.js · navigation.js · commerce.js
│   ├── content/copy.js            All website text
│   ├── context/enquiry/           Connects "Enquire" buttons to the contact form
│   ├── data/                      catalog.json (synced from the dashboard) + products.js
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
     PayPal, …). Add a `paymentLink` field to products in the dashboard's
     `js/core/schemas.js`; the sync carries `https://` links over. No server needed.
   - `'checkout-endpoint'` — a small serverless function creates a checkout session for
     the whole bag. Needed for multi-item bags and for gateways that use secret keys
     (SSLCommerz, bKash, Stripe Checkout). It must look up prices itself — never trust
     prices sent from a browser.
2. Set `cartEnabled: true` to show "Add to bag" and the bag.
3. Set `checkoutEnabled: true` to let visitors pay.

## Notes for developers

- Logic modules that have tests (`lib/format.js`, `services/enquiry.js`,
  `features/commerce/cart|checkout`) use relative imports with `.js` extensions, so plain
  Node can run them in `npm test`. Components use the `@/` alias for `src/`.
- `vite.config.js` sets `root` to the project folder's real path. On Windows a terminal
  can open in `h:\BUNON` while packages resolve to `H:\BUNON`; without this, Vite 8
  bundles React twice and the built page stays blank.
- Fonts (Cormorant Garamond, Manrope) are bundled from `@fontsource` — no requests to
  Google at runtime.

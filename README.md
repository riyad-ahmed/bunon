# BUNON — website

A static, single-page website (Home · About · Products · Contact).
Plain HTML, CSS and JavaScript — no build step, no server. Hosted on GitHub Pages.

## Folder structure

```
BUNON/
├── index.html                 The page: all four sections
├── .nojekyll                  Tells GitHub Pages to serve files as-is
├── .gitignore
├── README.md
└── assets/
    ├── css/
    │   └── style.css          All styling (colours/fonts at the top)
    ├── js/
    │   ├── config.js          ← Your email, phone, socials, currency, form setup
    │   ├── products.js        ← Your products (name, price, image, …)
    │   ├── main.js            Menu, animations, product cards, contact form
    │   └── payment.js         Payment integration — disabled, for later
    └── images/
        ├── favicon.svg        Browser-tab icon
        └── products/          Product photos (placeholders for now)
```

## Everyday edits

| To change…                         | Edit                                           |
| ---------------------------------- | ---------------------------------------------- |
| Email, phone, socials, currency    | `assets/js/config.js`                          |
| Products and prices                | `assets/js/products.js`                        |
| Product photos                     | Add to `assets/images/products/`, then update `image:` in `products.js` |
| Headlines and paragraphs           | `index.html`                                   |
| Colours and fonts                  | Top of `assets/css/style.css` (`:root`)        |

## Preview on your computer

Double-click `index.html` — it opens in your browser. No install needed.

## Publish updates

After the first publish, every change goes live with:

```
git add .
git commit -m "Describe your change"
git push
```

GitHub Pages refreshes within a minute or two.

## Contact form

GitHub Pages can't send email itself. By default the form opens the visitor's
email app. For in-page sending, create a free form at https://formspree.io and
paste its endpoint into `formEndpoint` in `config.js`.

## Payments (later)

Everything is prepared but commented out. Follow the steps at the top of
`assets/js/payment.js`.

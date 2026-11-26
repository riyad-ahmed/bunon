/* ==========================================================================
   BUNON — Payments   ·   DISABLED (everything below is commented out)
   ==========================================================================

   HOW IT WILL WORK
   Each product gets a hosted checkout link ("payment link") from your
   payment provider. A "Buy now" button on the product card sends the visitor
   to that link, and the provider handles card details securely. There is no
   server involved, so this works on GitHub Pages.

   Providers that offer payment links include Stripe (Payment Links), PayPal,
   Lemon Squeezy and Gumroad, as well as several local gateways. Gateways that
   need a secret API key kept on a server (for example SSLCommerz or the bKash
   merchant API) can't run on GitHub Pages alone — they need a small
   serverless function (e.g. Cloudflare Workers or Netlify Functions) in front.

   TO TURN PAYMENTS ON
     1. In your provider's dashboard, create a payment link for each product.
        Set its "after payment" redirect to your site, e.g.
        https://YOUR-USERNAME.github.io/YOUR-REPO/#contact
     2. assets/js/products.js → paste each link into that product's
        `paymentLink` and remove the // in front of it.
     3. assets/js/main.js → in productCard(), swap the two `buyButton` lines
        as described there.
     4. index.html → uncomment the <script src="assets/js/payment.js"> line.
     5. Uncomment the code below.
   ========================================================================== */


// (function () {
//   "use strict";
//
//   const products = window.PRODUCTS || [];
//
//   document.addEventListener("click", function (event) {
//     const button = event.target.closest("[data-buy]");
//     if (!button) return;
//
//     const product = products.find((item) => item.id === button.dataset.buy);
//     if (!product || !product.paymentLink) return;
//
//     button.disabled = true;
//     button.textContent = "Redirecting…";
//     window.location.href = product.paymentLink;
//   });
//
//   // Re-enable buttons if the visitor comes back with the browser's Back button
//   window.addEventListener("pageshow", function () {
//     document.querySelectorAll("[data-buy]").forEach(function (button) {
//       button.disabled = false;
//       button.textContent = "Buy now";
//     });
//   });
// })();

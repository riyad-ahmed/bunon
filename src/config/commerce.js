/**
 * BUNON — online shop settings
 * ---------------------------------------------------------------------------
 * The live website is a showcase: visitors browse and send enquiries.
 * Buying is switched OFF. The shop code (bag, checkout, payment providers)
 * lives in src/features/commerce/ and is ready to turn on later.
 *
 * Preview the bag on your computer (never on the live site):
 *   npm run dev:shop
 *
 * TO OPEN THE SHOP LATER
 *   1. Choose how payment works (`provider` below) and set it up.
 *   2. Set `cartEnabled` to true to show "Add to bag" and the bag.
 *   3. Set `checkoutEnabled` to true to let visitors pay.
 */

// true only when running `npm run dev:shop` (see .env.shop).
// `?.` keeps this file loadable by plain Node for the unit tests.
const shopPreview = import.meta.env?.VITE_SHOP_PREVIEW === 'true'

export const commerce = {
  /** Show "Add to bag" buttons and the shopping bag. */
  cartEnabled: shopPreview,

  /** Let visitors pay. Keep false until a payment provider is set up. */
  checkoutEnabled: false,

  /**
   * How checkout works once enabled:
   *  'payment-links'     — each product has a hosted checkout link from your
   *                        provider (e.g. Stripe Payment Links), saved as a
   *                        `paymentLink` field on the product (add a box for
   *                        it in the product dashboard). One product per
   *                        purchase; no server needed.
   *  'checkout-endpoint' — a small serverless function (e.g. Cloudflare Workers)
   *                        receives the whole bag, creates a checkout session
   *                        with your provider and returns its URL. Needed for
   *                        multi-item bags and gateways with secret keys
   *                        (SSLCommerz, bKash, Stripe Checkout, …).
   */
  provider: 'payment-links',

  /** For 'checkout-endpoint': the URL of your serverless function. */
  checkoutEndpoint: '',
}

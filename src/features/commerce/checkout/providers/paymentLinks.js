/**
 * Payment links — each product has its own hosted checkout page, created in
 * the provider's dashboard (Stripe Payment Links, PayPal, Lemon Squeezy, …)
 * and stored as `paymentLink` in src/data/products.js.
 * No server needed, but one product per purchase.
 */
export const paymentLinks = {
  async createCheckoutUrl(lines) {
    if (lines.length !== 1 || lines[0].quantity !== 1) {
      throw new Error('Payment links can only buy one product at a time.')
    }
    const { product } = lines[0]
    if (!product?.paymentLink) throw new Error(`No payment link set for ${product?.name ?? 'this product'}.`)
    return product.paymentLink
  },
}

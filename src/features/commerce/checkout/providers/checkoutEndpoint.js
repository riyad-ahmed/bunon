/**
 * Checkout endpoint — for multi-item bags and gateways that need a secret key
 * (SSLCommerz, bKash, Stripe Checkout, …). GitHub Pages can't keep secrets,
 * so a small serverless function does this part.
 *
 * The function receives:  POST { items: [{ id, quantity }] }
 * It should:              look up prices ON THE SERVER (never trust prices
 *                         sent by a browser), create a checkout session with
 *                         the provider, and reply { url: "https://…" }.
 */
export const checkoutEndpoint = {
  async createCheckoutUrl(lines, settings, request = globalThis.fetch) {
    if (!settings.checkoutEndpoint) throw new Error('Set commerce.checkoutEndpoint in config/commerce.js.')

    const response = await request(settings.checkoutEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: lines.map(({ id, quantity }) => ({ id, quantity })) }),
    })
    if (!response.ok) throw new Error(`Checkout service responded with ${response.status}`)

    const { url } = await response.json()
    if (!url) throw new Error('Checkout service did not return a URL.')
    return url
  },
}

import { commerce } from '../../../config/commerce.js'
import { checkoutEndpoint } from './providers/checkoutEndpoint.js'
import { paymentLinks } from './providers/paymentLinks.js'

/**
 * Checkout — turns bag lines into the address of a secure, provider-hosted
 * payment page. BUNON never handles card details itself.
 *
 * Add a provider by creating a file in ./providers that exports
 * { createCheckoutUrl(lines, settings) → Promise<string> } and listing it here.
 */
export const providers = {
  'payment-links': paymentLinks,
  'checkout-endpoint': checkoutEndpoint,
}

export class CheckoutUnavailableError extends Error {
  constructor(message = 'Online checkout isn’t available yet — please send us an enquiry instead.') {
    super(message)
    this.name = 'CheckoutUnavailableError'
  }
}

export function isCheckoutAvailable(settings = commerce) {
  return Boolean(settings.checkoutEnabled && providers[settings.provider])
}

/**
 * @param lines    bag lines: [{ id, quantity, product }]
 * @param settings commerce settings (defaults to config/commerce.js)
 * @returns the checkout page URL to send the visitor to
 */
export async function getCheckoutUrl(lines, settings = commerce) {
  if (!isCheckoutAvailable(settings)) throw new CheckoutUnavailableError()
  if (!lines?.length) throw new Error('Your bag is empty.')
  return providers[settings.provider].createCheckoutUrl(lines, settings)
}

import Button from '@/components/ui/Button'
import { commerce } from '@/config/commerce'
import { useCartActions } from '../cart/useCart'
import { getCheckoutUrl, isCheckoutAvailable } from '../checkout/checkout'

/**
 * Buying button for a product. While the shop is switched off
 * (config/commerce.js) this renders nothing and the site stays a showcase.
 *  - cart on:  "Add to bag" for the chosen colour/size option
 *              ("Choose options" first when the product has several)
 *  - cart off, payment link ready: "Buy now" (straight to the provider)
 *
 * product: a product from data/products.js · option: the chosen option, if any
 */
export default function PurchaseActions({ product, option, size, onAdd, onChooseOptions }) {
  const { add } = useCartActions()
  const chosen = option ?? (product.options.length === 1 ? product.options[0] : null)

  if (commerce.cartEnabled) {
    if (!chosen) {
      return onChooseOptions ? (
        <Button size={size} variant="ghost" onClick={onChooseOptions}>
          Choose options
        </Button>
      ) : null
    }
    const label = !chosen.inStock ? 'Sold out' : chosen.price == null ? 'Price on request' : 'Add to bag'
    return (
      <Button
        size={size}
        disabled={label !== 'Add to bag'}
        onClick={() => (onAdd ? onAdd(chosen) : add(chosen.id))}
      >
        {label}
      </Button>
    )
  }

  if (chosen?.paymentLink && chosen.inStock && isCheckoutAvailable() && commerce.provider === 'payment-links') {
    const buyNow = async () => {
      window.location.assign(await getCheckoutUrl([{ id: chosen.id, quantity: 1, product: chosen }]))
    }
    return (
      <Button size={size} onClick={buyNow}>
        Buy now
      </Button>
    )
  }

  return null
}

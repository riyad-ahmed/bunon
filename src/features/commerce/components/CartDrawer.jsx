import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import CloseButton from '@/components/ui/CloseButton'
import Dialog from '@/components/ui/Dialog'
import { useEnquiryActions } from '@/context/enquiry/useEnquiry'
import { formatPrice } from '@/lib/format'
import { getProductImage } from '@/lib/images'
import { MAX_QUANTITY } from '../cart/cartReducer'
import { useCart, useCartActions } from '../cart/useCart'
import { getCheckoutUrl, isCheckoutAvailable } from '../checkout/checkout'
import styles from './CartDrawer.module.css'

/** The shopping bag, sliding in from the right. Shown only when the cart is enabled. */
export default function CartDrawer() {
  const { lines, count, subtotal, isOpen } = useCart()
  const { close, remove, setQuantity } = useCartActions()
  const { enquireAbout } = useEnquiryActions()
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const afterCloseRef = useRef(null)
  const checkoutReady = isCheckoutAvailable()

  const checkout = async () => {
    setStatus({ state: 'busy', message: 'Taking you to secure checkout…' })
    try {
      window.location.assign(await getCheckoutUrl(lines))
    } catch (error) {
      setStatus({ state: 'error', message: error.message })
    }
  }

  const enquireAboutBag = () => {
    afterCloseRef.current = () => enquireAbout(lines.map((line) => line.product))
    close()
  }

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      variant="drawer"
      labelledBy="bag-title"
      onClosed={() => {
        const action = afterCloseRef.current
        afterCloseRef.current = null
        setStatus({ state: 'idle', message: '' })
        action?.()
      }}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 id="bag-title" className={styles.title}>
            Your bag <span className={styles.count}>({count})</span>
          </h2>
          <CloseButton label="Close bag" onClick={close} />
        </header>

        {lines.length === 0 ? (
          <p className={styles.empty}>Your bag is empty.</p>
        ) : (
          <ul className={styles.lines}>
            {lines.map(({ id, quantity, product, total }) => (
              <li key={id} className={styles.line}>
                <img src={getProductImage(product.image)} alt="" width="72" height="90" />
                <div className={styles.lineInfo}>
                  <p className={styles.name}>{product.name}</p>
                  <p className={styles.price}>{formatPrice(total)}</p>
                  <div className={styles.quantity}>
                    <button
                      type="button"
                      onClick={() => setQuantity(id, quantity - 1)}
                      aria-label={`One less ${product.name}`}
                    >
                      −
                    </button>
                    <span aria-label={`Quantity: ${quantity}`}>{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(id, quantity + 1)}
                      disabled={quantity >= MAX_QUANTITY}
                      aria-label={`One more ${product.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button type="button" className={styles.remove} onClick={() => remove(id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className={styles.foot}>
          <div className={styles.subtotal}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Button block onClick={checkout} disabled={!checkoutReady || lines.length === 0 || status.state === 'busy'}>
            {checkoutReady ? 'Checkout' : 'Checkout coming soon'}
          </Button>
          <Button block variant="ghost" onClick={enquireAboutBag} disabled={lines.length === 0}>
            Enquire about these pieces
          </Button>
          <output className={styles.status} data-state={status.state} aria-live="polite">
            {status.message || (!checkoutReady && 'Online payment isn’t open yet — send an enquiry to reserve.')}
          </output>
        </footer>
      </div>
    </Dialog>
  )
}

import { useCart, useCartActions } from '../cart/useCart'
import styles from './BagButton.module.css'

/** Header button that opens the bag. Shown only when the cart is enabled. */
export default function BagButton() {
  const { count } = useCart()
  const { open } = useCartActions()

  return (
    <button
      type="button"
      className={styles.bag}
      onClick={open}
      aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </svg>
      {count > 0 && (
        <span key={count} className={styles.count} aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  )
}

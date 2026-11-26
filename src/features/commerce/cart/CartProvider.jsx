import { useEffect, useMemo, useReducer, useState } from 'react'
import { commerce } from '@/config/commerce'
import { optionsById } from '@/data/products'
import { readJSON, writeJSON } from '@/lib/storage'
import { CartActionsContext, CartStateContext } from './cartContext'
import {
  cartReducer,
  getCartCount,
  getCartLines,
  getCartSubtotal,
  initialCart,
  sanitizeCart,
} from './cartReducer'

const STORAGE_KEY = 'bunon:bag:v1'

/**
 * Shopping bag state for the whole site. Always mounted, but the bag is only
 * shown — and only saved in the browser — when commerce.cartEnabled is true.
 */
export default function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, undefined, () =>
    commerce.cartEnabled ? sanitizeCart(readJSON(STORAGE_KEY)) : initialCart,
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (commerce.cartEnabled) writeJSON(STORAGE_KEY, cart)
  }, [cart])

  const actions = useMemo(
    () => ({
      add: (id, quantity = 1) => {
        dispatch({ type: 'add', id, quantity })
        setIsOpen(true)
      },
      setQuantity: (id, quantity) => dispatch({ type: 'setQuantity', id, quantity }),
      remove: (id) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [],
  )

  const state = useMemo(() => {
    const lines = getCartLines(cart.items, optionsById)
    return { lines, count: getCartCount(lines), subtotal: getCartSubtotal(lines), isOpen }
  }, [cart, isOpen])

  return (
    <CartActionsContext.Provider value={actions}>
      <CartStateContext.Provider value={state}>{children}</CartStateContext.Provider>
    </CartActionsContext.Provider>
  )
}

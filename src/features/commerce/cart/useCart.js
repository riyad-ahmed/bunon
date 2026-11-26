import { useContext } from 'react'
import { CartActionsContext, CartStateContext } from './cartContext'

/** Bag contents: { lines, count, subtotal, isOpen } */
export function useCart() {
  const state = useContext(CartStateContext)
  if (state === null) throw new Error('useCart must be used inside <CartProvider>')
  return state
}

/** Bag actions. Stable — using these never causes re-renders. */
export function useCartActions() {
  const actions = useContext(CartActionsContext)
  if (actions === null) throw new Error('useCartActions must be used inside <CartProvider>')
  return actions
}

import { createContext } from 'react'

/** { lines, count, subtotal, isOpen } */
export const CartStateContext = createContext(null)

/** Stable actions: add, setQuantity, remove, clear, open, close */
export const CartActionsContext = createContext(null)

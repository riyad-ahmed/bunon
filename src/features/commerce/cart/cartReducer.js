/**
 * Shopping bag state — plain functions, no React, so they are easy to test.
 * The bag stores only { id, quantity } — the id of a colour/size option —
 * and details always come from the current catalogue, so prices never go stale.
 */

export const MAX_QUANTITY = 10

export const initialCart = Object.freeze({ items: [] })

function clampQuantity(value) {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(MAX_QUANTITY, n)
}

export function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const quantity = clampQuantity(action.quantity ?? 1)
      const existing = state.items.find((item) => item.id === action.id)
      const items = existing
        ? state.items.map((item) =>
            item.id === action.id ? { ...item, quantity: clampQuantity(item.quantity + quantity) } : item,
          )
        : [...state.items, { id: action.id, quantity }]
      return { ...state, items }
    }

    case 'setQuantity': {
      if (Number(action.quantity) < 1) {
        return { ...state, items: state.items.filter((item) => item.id !== action.id) }
      }
      const items = state.items.map((item) =>
        item.id === action.id ? { ...item, quantity: clampQuantity(action.quantity) } : item,
      )
      return { ...state, items }
    }

    case 'remove':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) }

    case 'clear':
      return initialCart

    default:
      return state
  }
}

/** Joins bag items with catalogue options. Items no longer in the catalogue are dropped. */
export function getCartLines(items, catalogue) {
  return items.flatMap((item) => {
    const product = catalogue[item.id]
    return product ? [{ ...item, product, total: (product.price ?? 0) * item.quantity }] : []
  })
}

export function getCartCount(lines) {
  return lines.reduce((count, line) => count + line.quantity, 0)
}

export function getCartSubtotal(lines) {
  return lines.reduce((sum, line) => sum + line.total, 0)
}

/** Restores a saved bag, discarding anything malformed. */
export function sanitizeCart(saved) {
  if (!saved || !Array.isArray(saved.items)) return initialCart
  const items = saved.items
    .filter((item) => item && typeof item.id === 'string' && Number(item.quantity) >= 1)
    .map((item) => ({ id: item.id, quantity: clampQuantity(item.quantity) }))
  return { items }
}

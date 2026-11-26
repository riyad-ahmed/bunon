import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MAX_QUANTITY,
  cartReducer,
  getCartCount,
  getCartLines,
  getCartSubtotal,
  initialCart,
  sanitizeCart,
} from './cartReducer.js'

const catalogue = {
  tote: { id: 'tote', name: 'Tote', price: 2400 },
  scarf: { id: 'scarf', name: 'Scarf', price: 1800 },
}

test('adds items and merges repeats', () => {
  let cart = cartReducer(initialCart, { type: 'add', id: 'tote' })
  cart = cartReducer(cart, { type: 'add', id: 'tote', quantity: 2 })
  cart = cartReducer(cart, { type: 'add', id: 'scarf' })
  assert.deepEqual(cart.items, [
    { id: 'tote', quantity: 3 },
    { id: 'scarf', quantity: 1 },
  ])
})

test('caps quantities and removes items set below one', () => {
  let cart = cartReducer(initialCart, { type: 'add', id: 'tote', quantity: 99 })
  assert.equal(cart.items[0].quantity, MAX_QUANTITY)
  cart = cartReducer(cart, { type: 'setQuantity', id: 'tote', quantity: 4 })
  assert.equal(cart.items[0].quantity, 4)
  cart = cartReducer(cart, { type: 'setQuantity', id: 'tote', quantity: 0 })
  assert.deepEqual(cart.items, [])
})

test('removes and clears', () => {
  let cart = cartReducer(initialCart, { type: 'add', id: 'tote' })
  cart = cartReducer(cart, { type: 'add', id: 'scarf' })
  cart = cartReducer(cart, { type: 'remove', id: 'tote' })
  assert.deepEqual(cart.items, [{ id: 'scarf', quantity: 1 }])
  assert.equal(cartReducer(cart, { type: 'clear' }), initialCart)
})

test('ignores unknown actions', () => {
  const cart = { items: [{ id: 'tote', quantity: 1 }] }
  assert.equal(cartReducer(cart, { type: 'nope' }), cart)
})

test('builds lines, count and subtotal from the catalogue', () => {
  const items = [
    { id: 'tote', quantity: 2 },
    { id: 'scarf', quantity: 1 },
    { id: 'discontinued', quantity: 5 },
  ]
  const lines = getCartLines(items, catalogue)
  assert.equal(lines.length, 2)
  assert.equal(getCartCount(lines), 3)
  assert.equal(getCartSubtotal(lines), 2400 * 2 + 1800)
})

test('an item without a price counts as zero, never NaN', () => {
  const lines = getCartLines([{ id: 'cap', quantity: 2 }], { cap: { id: 'cap', name: 'Cap', price: null } })
  assert.equal(getCartSubtotal(lines), 0)
})

test('restores only valid saved bags', () => {
  assert.equal(sanitizeCart(null), initialCart)
  assert.equal(sanitizeCart({ items: 'nope' }), initialCart)
  assert.deepEqual(
    sanitizeCart({ items: [{ id: 'tote', quantity: 2 }, { id: 3, quantity: 1 }, { id: 'scarf', quantity: 0 }, null] }),
    { items: [{ id: 'tote', quantity: 2 }] },
  )
})

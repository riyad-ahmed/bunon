import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatPrice } from './format.js'

test('formats prices with the configured symbol and thousands separators', () => {
  assert.equal(formatPrice(2400), '৳2,400')
  assert.equal(formatPrice(125000), '৳125,000')
  assert.equal(formatPrice(0), '৳0')
})

test('accepts a custom symbol', () => {
  assert.equal(formatPrice(1800, '$'), '$1,800')
})

test('returns an empty string for missing or invalid prices', () => {
  assert.equal(formatPrice(undefined), '')
  assert.equal(formatPrice('2400'), '')
  assert.equal(formatPrice(Number.NaN), '')
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultSelection, describeProduct, findOption, optionsInColor, priceLabel, slugify } from './catalog.js'

const hoodie = describeProduct({
  id: 'hoodie',
  name: 'Hoodie',
  category: 'Hoodie',
  description: '',
  variants: [
    { id: 'PRD-1', color: 'Black', sizes: ['L'], price: 1900, image: null, inStock: false },
    { id: 'PRD-2', color: 'Green', sizes: ['M'], price: 1800, image: 'catalog/a.jpg', inStock: true },
    { id: 'PRD-3', color: 'Green', sizes: ['L'], price: 1800, image: 'catalog/a.jpg', inStock: true },
    { id: 'PRD-4', color: 'Grey', sizes: ['S', 'XL'], price: null, image: null, inStock: true },
  ],
})

test('summarises colours, sizes, prices and stock', () => {
  assert.deepEqual(hoodie.colors, ['Black', 'Green', 'Grey'])
  assert.deepEqual(hoodie.sizes, ['S', 'M', 'L', 'XL'])
  assert.deepEqual(hoodie.soldOutColors, ['Black'])
  assert.deepEqual(hoodie.soldOutSizes, [])
  assert.equal(hoodie.priceMin, 1800)
  assert.equal(hoodie.priceMax, 1900)
  assert.equal(hoodie.image, 'catalog/a.jpg')
  assert.equal(hoodie.inStock, true)
})

test('gives every colour/size its own option, named for enquiries', () => {
  assert.deepEqual(
    hoodie.options.map((o) => [o.id, o.name]),
    [
      ['PRD-1', 'Hoodie — Black, L'],
      ['PRD-2', 'Hoodie — Green, M'],
      ['PRD-3', 'Hoodie — Green, L'],
      ['PRD-4::S', 'Hoodie — Grey, S'],
      ['PRD-4::XL', 'Hoodie — Grey, XL'],
    ],
  )
})

test('picks options from a colour and size choice', () => {
  assert.deepEqual(defaultSelection(hoodie), { color: 'Green', size: 'M' })
  assert.deepEqual(optionsInColor(hoodie, 'Green').map((o) => o.size), ['M', 'L'])
  assert.equal(findOption(hoodie, { color: 'Green', size: 'L' }).id, 'PRD-3')
  assert.equal(findOption(hoodie, { color: 'Black', size: 'XXL' }).id, 'PRD-1') // only option in that colour
  assert.equal(findOption(hoodie, { color: 'Green', size: 'XXL' }), null)
})

test('labels prices', () => {
  const format = (n) => `৳${n}`
  assert.equal(priceLabel(null, null, format), 'Price on request')
  assert.equal(priceLabel(1800, 1800, format), '৳1800')
  assert.equal(priceLabel(1500, 1800, format), 'From ৳1500')
})

test('makes URL-safe ids', () => {
  assert.equal(slugify('T-Shirt & Polo'), 't-shirt-polo')
  assert.equal(slugify('  '), 'item')
})

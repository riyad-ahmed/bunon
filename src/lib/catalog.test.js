import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  defaultSelection,
  describeProduct,
  findOption,
  isPublishable,
  optionsInColor,
  priceLabel,
  slugify,
} from './catalog.js'
import { sortSizes, swatchFor } from './presets.js'

const saved = {
  id: 'a1b2c3d4',
  name: 'Journey Hoodie',
  category: 'Hoodie',
  price: 2450,
  colors: ['Black', 'Off White', 'black'],
  sizes: ['XL', 'M', 'L'],
  description: '  Hand-embroidered back design.  ',
  photos: [
    { file: 'aaaaaaaaaaaa.jpg', color: '' },
    { file: 'bbbbbbbbbbbb.jpg', color: 'Off White' },
  ],
  soldOut: false,
  visible: true,
}
const hoodie = describeProduct(saved)

test('a product needs a name and a photo, and must not be hidden, to go on the website', () => {
  assert.equal(isPublishable(saved), true)
  assert.equal(isPublishable({ ...saved, name: '  ' }), false)
  assert.equal(isPublishable({ ...saved, photos: [] }), false)
  assert.equal(isPublishable({ ...saved, visible: false }), false)
  assert.equal(isPublishable(null), false)
})

test('describes colours, sizes, price, photos and stock', () => {
  assert.deepEqual(hoodie.colors, ['Black', 'Off White'])
  assert.deepEqual(hoodie.sizes, ['M', 'L', 'XL'])
  assert.equal(hoodie.price, 2450)
  assert.equal(hoodie.image, 'photos/aaaaaaaaaaaa.jpg')
  assert.deepEqual(hoodie.photos.map((p) => p.color), ['', 'Off White'])
  assert.equal(hoodie.description, 'Hand-embroidered back design.')
  assert.equal(hoodie.inStock, true)
  assert.equal(describeProduct({ ...saved, soldOut: true }).inStock, false)
  assert.equal(describeProduct({ ...saved, price: null }).price, null)
  assert.equal(describeProduct({ ...saved, category: '' }).category, 'Other')
})

test('every colour × size is an option, with that colour’s photo', () => {
  assert.equal(hoodie.options.length, 6)
  const offWhiteL = findOption(hoodie, { color: 'Off White', size: 'L' })
  assert.equal(offWhiteL.id, 'a1b2c3d4::Off White::L')
  assert.equal(offWhiteL.name, 'Journey Hoodie — Off White, L')
  assert.equal(offWhiteL.image, 'photos/bbbbbbbbbbbb.jpg')
  assert.equal(findOption(hoodie, { color: 'Black', size: 'M' }).image, 'photos/aaaaaaaaaaaa.jpg') // falls back to the cover
  assert.deepEqual(optionsInColor(hoodie, 'Black').map((o) => o.size), ['M', 'L', 'XL'])
  assert.deepEqual(defaultSelection(hoodie), { color: 'Black', size: 'M' })
  assert.equal(findOption(hoodie, { color: 'Black', size: 'XXL' }), null)
})

test('a product without colours or sizes has one option', () => {
  const plain = describeProduct({ ...saved, colors: [], sizes: [] })
  assert.deepEqual(plain.options.map((o) => [o.id, o.name]), [['a1b2c3d4', 'Journey Hoodie']])
  assert.equal(findOption(plain, defaultSelection(plain)).id, 'a1b2c3d4')
})

test('labels prices', () => {
  const format = (n) => `৳${n}`
  assert.equal(priceLabel(null, format), 'Price on request')
  assert.equal(priceLabel(1800, format), '৳1800')
})

test('sorts sizes and finds colour dots', () => {
  assert.deepEqual(sortSizes(['Free Size', 'XL', '38', 'S', 'XXL']), ['S', 'XL', 'XXL', '38', 'Free Size'])
  assert.equal(swatchFor(' black '), '#141414')
  assert.equal(swatchFor('Sunset'), null)
})

test('makes URL-safe ids', () => {
  assert.equal(slugify('T-Shirt & Polo'), 't-shirt-polo')
  assert.equal(slugify('  '), 'item')
})

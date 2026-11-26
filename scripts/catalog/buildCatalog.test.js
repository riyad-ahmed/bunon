import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildCatalog, decodeImage, splitSizes, stockLevels, tidyLabel, toPrice } from './buildCatalog.js'

// 1×1 white JPEG, as the dashboard would store it
const PHOTO =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='

const product = (fields) => ({
  business: 'bunon',
  purchaseCost: 950,
  productionCost: 120,
  totalCost: 1111,
  profit: 777,
  notes: 'SECRET supplier note',
  sku: 'BN-SECRET-1',
  costLines: [{ label: 'Embroidery Cost', amount: 333 }],
  createdAt: '2026-11-01T10:00:00Z',
  ...fields,
})

const backup = (products, extra = {}) => ({
  format: 'business-manager-backup',
  version: 1,
  data: {
    products,
    stock: [],
    categories: [
      { business: 'bunon', kind: 'product', name: 'Sweatshirt' },
      { business: 'bunon', kind: 'product', name: 'Hoodie' },
    ],
    orders: [{ business: 'bunon', customerName: 'SECRET customer', customerPhone: '01700000000' }],
    capital: [{ business: 'bunon', amount: 500000 }],
    ...extra,
  },
})

test('groups colour/size records into one product per name and category', () => {
  const { catalog } = buildCatalog(
    backup([
      product({ id: 'PRD-1', name: 'Hoodie', category: 'Hoodie', color: 'Green', size: 'M', quantity: 2, sellingPrice: 1800 }),
      product({ id: 'PRD-2', name: 'Hoodie', category: 'Hoodie', color: 'Green', size: 'L', quantity: 3, sellingPrice: 1800 }),
      product({ id: 'PRD-3', name: 'hoodie ', category: 'Hoodie', color: 'Black', size: 'L', quantity: 1, sellingPrice: 1900 }),
      product({ id: 'PRD-4', name: 'Sweatshirt', category: 'Sweatshirt', color: 'White', size: 'XL', quantity: 1 }),
    ]),
  )
  assert.deepEqual(catalog.categories, ['Sweatshirt', 'Hoodie']) // dashboard order
  assert.equal(catalog.products.length, 2)
  const hoodie = catalog.products.find((p) => p.name === 'Hoodie')
  assert.equal(hoodie.id, 'hoodie')
  assert.deepEqual(
    hoodie.variants.map((v) => [v.color, v.sizes.join(), v.price]),
    [['Black', 'L', 1900], ['Green', 'M', 1800], ['Green', 'L', 1800]],
  )
})

test('never copies private business data', () => {
  const { catalog } = buildCatalog(
    backup([product({ id: 'PRD-1', name: 'Hoodie', category: 'Hoodie', size: 'M', quantity: 4, sellingPrice: 1800 })]),
  )
  const json = JSON.stringify(catalog)
  for (const secret of ['SECRET', '950', '1111', '777', '333', '500000', '01700000000', 'purchaseCost', 'profit', 'quantity', 'sku']) {
    assert.ok(!json.includes(secret), `catalogue must not contain "${secret}"`)
  }
})

test('only the chosen business, and products set to "Hide from website" are left out', () => {
  const { catalog } = buildCatalog(
    backup([
      product({ id: 'PRD-1', name: 'Hoodie', category: 'Hoodie' }),
      product({ id: 'PRD-2', name: 'Prototype', category: 'Hoodie', website: 'hide' }),
      product({ id: 'PRD-3', name: 'Ghee', category: 'Ghee', business: 'shad' }),
    ]),
  )
  assert.deepEqual(catalog.products.map((p) => p.name), ['Hoodie'])
})

test('works out in-stock from opening quantity and stock entries', () => {
  const products = [
    { id: 'A', quantity: 2 },
    { id: 'B', quantity: 1 },
    { id: 'C', quantity: '' },
    { id: 'D', quantity: 0 },
  ]
  const moves = [
    { productId: 'A', movement: 'sold', quantity: 2, date: '2026-11-10' },
    { productId: 'B', movement: 'sold', quantity: 1, date: '2026-11-10' },
    { productId: 'B', movement: 'purchase', quantity: 5, date: '2026-11-12' },
    { productId: 'D', movement: 'count', quantity: 3, date: '2026-11-11' },
  ]
  const levels = stockLevels(products, moves)
  assert.deepEqual(levels.get('A'), { current: 0, tracked: true })
  assert.deepEqual(levels.get('B'), { current: 5, tracked: true })
  assert.deepEqual(levels.get('C'), { current: 0, tracked: false }) // never counted → not "sold out"
  assert.deepEqual(levels.get('D'), { current: 3, tracked: true })

  const { catalog } = buildCatalog(
    backup(
      [
        product({ id: 'A', name: 'Hoodie', category: 'Hoodie', color: 'Black', quantity: 2 }),
        product({ id: 'C', name: 'Hoodie', category: 'Hoodie', color: 'Green', quantity: '' }),
      ],
      { stock: [{ business: 'bunon', productId: 'A', movement: 'sold', quantity: 2, date: '2026-11-10' }] },
    ),
  )
  assert.deepEqual(catalog.products[0].variants.map((v) => v.inStock), [false, true])
})

test('turns stored photos into image files, shared photos saved once', () => {
  const { catalog, images } = buildCatalog(
    backup([
      product({ id: 'PRD-1', name: 'Hoodie', category: 'Hoodie', size: 'M', image: PHOTO }),
      product({ id: 'PRD-2', name: 'Hoodie', category: 'Hoodie', size: 'L', image: PHOTO }),
      product({ id: 'PRD-3', name: 'Hoodie', category: 'Hoodie', size: 'XL', image: 'not-a-photo' }),
    ]),
  )
  assert.equal(images.size, 1)
  const [fileName] = images.keys()
  assert.match(fileName, /^[0-9a-f]{12}\.jpg$/)
  assert.deepEqual(catalog.products[0].variants.map((v) => v.image), [`catalog/${fileName}`, `catalog/${fileName}`, null])
  assert.equal(decodeImage('data:image/gif;base64,R0lGOD'), null)
})

test('reads sizes, prices and empty fields sensibly', () => {
  assert.deepEqual(splitSizes('XL, m , L, M'), ['M', 'L', 'XL'])
  assert.deepEqual(splitSizes('32, 30, Free size'), ['30', '32', 'Free size'])
  assert.deepEqual(splitSizes(''), [])
  assert.equal(toPrice(''), null)
  assert.equal(toPrice(0), null)
  assert.equal(toPrice('1,850'), 1850)

  const { catalog } = buildCatalog(backup([product({ id: 'PRD-1', name: 'Tote' })]))
  assert.deepEqual(catalog.categories, ['Other'])
  assert.deepEqual(catalog.products[0].variants[0], { id: 'PRD-1', color: '', sizes: [], price: null, image: null, inStock: true })
})

test('rejects files that are not Business Manager backups', () => {
  assert.throws(() => buildCatalog({ hello: 'world' }), /not a Business Manager backup/)
})

test('tidies names typed in lower case, keeps names typed with capitals', () => {
  assert.equal(tidyLabel('  black  '), 'Black')
  assert.equal(tidyLabel('off   white'), 'Off White')
  assert.equal(tidyLabel('t-shirt'), 'T-Shirt')
  assert.equal(tidyLabel('OLIVE'), 'OLIVE')
  assert.equal(tidyLabel('Navy blue'), 'Navy blue')
  assert.equal(tidyLabel('কালো'), 'কালো')
  assert.equal(tidyLabel(undefined), '')
})

test('"black" and "Black" become one colour, "hoodie" and "Hoodie" one product', () => {
  const { catalog } = buildCatalog(
    backup([
      product({ id: 'p1', name: 'hoodie', category: 'hoodie', color: 'black', size: 'M' }),
      product({ id: 'p2', name: 'Hoodie', category: 'Hoodie', color: 'Black', size: 'L' }),
    ]),
  )
  assert.equal(catalog.products.length, 1)
  assert.equal(catalog.products[0].name, 'Hoodie')
  assert.deepEqual(catalog.categories, ['Hoodie'])
  assert.deepEqual([...new Set(catalog.products[0].variants.map((v) => v.color))], ['Black'])
})

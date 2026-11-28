import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { applyChanges, createStore, DATA_FILE, InvalidPhotoError, NotFoundError, STOCK_FILE, toPrice, toQuantity } from './store.js'

// A tiny but real JPEG header is enough: the store only checks the first bytes
const jpeg = (seed) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from(`photo ${seed}`)])

function withStore(run) {
  const root = mkdtempSync(join(tmpdir(), 'bunon-store-'))
  try {
    run(createStore(root), root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('reads prices and stock counts the way they are typed', () => {
  assert.equal(toPrice('1,450'), 1450)
  assert.equal(toPrice('৳ 990'), 990)
  assert.equal(toPrice(''), null)
  assert.equal(toPrice(0), null)
  assert.equal(toPrice(-5), null)
  assert.equal(toQuantity(''), null)
  assert.equal(toQuantity(null), null)
  assert.equal(toQuantity('0'), 0)
  assert.equal(toQuantity(7.9), 7)
  assert.equal(toQuantity(-1), null)
})

test('keeps only known fields, in a tidy shape', () => {
  const product = applyChanges(
    { id: 'abc12345', createdAt: 'x', updatedAt: 'x' },
    {
      name: '  Journey   Hoodie ',
      price: '2450',
      colors: ['Black', ' black', '', 'Off White'],
      sizes: ['XL', 'm', 'M', 'S'],
      description: 'Line one  \r\n\r\n\r\n\r\nLine two',
      photos: [
        { file: 'aaaaaaaaaaaa.jpg', color: 'Off White' },
        { file: 'aaaaaaaaaaaa.jpg', color: '' },
        { file: '../../secret.txt', color: '' },
        { file: 'bbbbbbbbbbbb.jpg', color: 'Purple' },
      ],
      visible: false,
      costPrice: 999,
      __proto__: { polluted: true },
    },
  )
  assert.equal(product.name, 'Journey Hoodie')
  assert.equal(product.price, 2450)
  assert.deepEqual(product.colors, ['Black', 'Off White'])
  assert.deepEqual(product.sizes, ['S', 'm', 'XL'])
  assert.equal(product.description, 'Line one\n\nLine two')
  assert.deepEqual(product.photos, [
    { file: 'aaaaaaaaaaaa.jpg', color: 'Off White' },
    { file: 'bbbbbbbbbbbb.jpg', color: '' }, // not one of the product's colours
  ])
  assert.equal(product.visible, false)
  assert.equal('costPrice' in product, false)
  assert.equal('polluted' in product, false)
})

test('creates, saves and deletes products; stock stays in a private file', () => {
  withStore((store, root) => {
    const created = store.create()
    assert.match(created.id, /^[a-f0-9]{8}$/)
    assert.equal(created.category, 'Hoodie') // first category when there are no products yet

    const photo = store.savePhoto(jpeg(1))
    assert.match(photo, /^[a-f0-9]{12}\.jpg$/)
    assert.equal(store.savePhoto(jpeg(1)), photo, 'the same photo is stored once')

    const saved = store.update(created.id, {
      name: 'Classic Tee',
      category: 'Polo',
      photos: [{ file: photo }, { file: 'cccccccccccc.jpg' }], // the second was never uploaded
      quantity: 0,
    })
    assert.deepEqual(saved.photos, [{ file: photo, color: '' }])
    assert.equal(saved.soldOut, true)
    assert.equal(saved.quantity, 0)
    assert.ok(store.state().categories.includes('Polo'), 'a new category is remembered')

    const publicFile = readFileSync(join(root, DATA_FILE), 'utf8')
    assert.doesNotMatch(publicFile, /quantity/, 'stock counts never go in the public file')
    assert.deepEqual(JSON.parse(readFileSync(join(root, STOCK_FILE), 'utf8')), { [created.id]: 0 })

    assert.equal(store.update(created.id, { quantity: 12 }).soldOut, false)
    assert.equal(store.update(created.id, { quantity: '' }).quantity, null)
    assert.deepEqual([...store.usedPhotos()], [photo])

    const second = store.create()
    assert.equal(second.category, 'Polo', 'new products start in the latest product’s category')

    store.remove(created.id)
    assert.deepEqual(store.state().products.map((p) => p.id), [second.id])
    assert.throws(() => store.update(created.id, { name: 'x' }), NotFoundError)
  })
})

test('accepts only JPEG photos', () => {
  withStore((store, root) => {
    assert.throws(() => store.savePhoto(Buffer.from('<svg onload="alert(1)">')), InvalidPhotoError)
    assert.equal(store.photoPath('../store.js'), null)
    assert.equal(existsSync(join(root, 'src')), false)
  })
})

test('adds categories once, ignoring capitals', () => {
  withStore((store) => {
    store.addCategory('  Polo  ')
    store.addCategory('polo')
    assert.deepEqual(store.addCategory(''), ['Hoodie', 'Sweatshirt', 'T-Shirt', 'Henley', 'Polo'])
  })
})

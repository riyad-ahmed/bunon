/**
 * The product dashboard's storage — plain files in this project:
 *   src/data/products.json          products the website shows (public)
 *   src/assets/products/photos/     product photos (public)
 *   private/stock.json              how many of each are in stock — stays on
 *                                   this computer, never published
 * Every change is written straight away (no save button), atomically, so a
 * file is never left half-written.
 */
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { sortSizes } from '../../src/lib/presets.js'

export const DATA_FILE = 'src/data/products.json'
export const PHOTO_DIR = 'src/assets/products/photos'
export const STOCK_FILE = 'private/stock.json'
export const PHOTO_NAME = /^[a-f0-9]{12}\.jpg$/

export const DEFAULT_CATEGORIES = ['Hoodie', 'Sweatshirt', 'T-Shirt', 'Henley']
const MAX_PHOTO_BYTES = 12 * 1024 * 1024
const LIMIT = { name: 80, category: 40, description: 2000, color: 30, size: 20, colors: 30, sizes: 20, photos: 30 }

// ---------------------------------------------------------------- cleaning

const oneLine = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

const paragraph = (value, max) =>
  String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)

/** Strings only, trimmed, no blanks, no repeats ("black" after "Black"). */
function list(values, max, count) {
  if (!Array.isArray(values)) return []
  const seen = new Map()
  for (const value of values) {
    const item = oneLine(value, max)
    if (item && !seen.has(item.toLowerCase())) seen.set(item.toLowerCase(), item)
  }
  return [...seen.values()].slice(0, count)
}

/** A price in taka, or null when it hasn't been given. */
export function toPrice(value) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(/[,৳\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}

/** How many are in stock, or null when it isn't being counted. */
export function toQuantity(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), 1_000_000) : null
}

/**
 * Applies changes sent by the dashboard to a product. Only known fields are
 * kept, each in the expected shape; photos must be saved photo files.
 */
export function applyChanges(product, changes, { photoExists = () => true } = {}) {
  const next = { ...product }
  if ('name' in changes) next.name = oneLine(changes.name, LIMIT.name)
  if ('category' in changes) next.category = oneLine(changes.category, LIMIT.category)
  if ('price' in changes) next.price = toPrice(changes.price)
  if ('colors' in changes) next.colors = list(changes.colors, LIMIT.color, LIMIT.colors)
  if ('sizes' in changes) next.sizes = sortSizes(list(changes.sizes, LIMIT.size, LIMIT.sizes))
  if ('description' in changes) next.description = paragraph(changes.description, LIMIT.description)
  if ('visible' in changes) next.visible = changes.visible !== false
  if ('photos' in changes) {
    const seen = new Set()
    next.photos = (Array.isArray(changes.photos) ? changes.photos : [])
      .filter((photo) => photo && PHOTO_NAME.test(photo.file) && photoExists(photo.file) && !seen.has(photo.file) && seen.add(photo.file))
      .slice(0, LIMIT.photos)
      .map((photo) => ({ file: photo.file, color: oneLine(photo.color, LIMIT.color) }))
  }
  // A photo can only belong to one of the product's colours
  next.photos = (next.photos ?? []).map((photo) => ({ ...photo, color: next.colors.includes(photo.color) ? photo.color : '' }))
  return ordered(next)
}

/** Same field order in every product, so products.json stays easy to read. */
function ordered(p) {
  return {
    id: p.id,
    name: p.name ?? '',
    category: p.category ?? '',
    price: p.price ?? null,
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
    description: p.description ?? '',
    photos: p.photos ?? [],
    soldOut: Boolean(p.soldOut),
    visible: p.visible !== false,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

// ---------------------------------------------------------------- files

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

/** Write to a temporary file, then swap it in — a reader never sees half a file. */
function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`)
  for (let attempt = 1; ; attempt++) {
    try {
      renameSync(temporary, file)
      return
    } catch (error) {
      // Windows: another program may be reading the file for a moment
      if (attempt >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(error.code)) throw error
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 40 * attempt)
    }
  }
}

export class NotFoundError extends Error {}
export class InvalidPhotoError extends Error {}

export function createStore(root) {
  const dataFile = join(root, DATA_FILE)
  const stockFile = join(root, STOCK_FILE)
  const photoDir = join(root, PHOTO_DIR)

  const read = () => {
    const data = readJson(dataFile, null) ?? { categories: [...DEFAULT_CATEGORIES], products: [] }
    return { categories: data.categories ?? [], products: data.products ?? [] }
  }
  const write = (data) => writeJson(dataFile, { categories: data.categories, products: data.products })
  const readStock = () => readJson(stockFile, {})
  const photoExists = (file) => PHOTO_NAME.test(file) && existsSync(join(photoDir, file))

  const withQuantity = (product, stock = readStock()) => ({ ...product, quantity: stock[product.id] ?? null })

  function find(data, id) {
    const index = data.products.findIndex((p) => p.id === id)
    if (index < 0) throw new NotFoundError(`No product ${id}`)
    return index
  }

  return {
    /** Everything the dashboard shows. */
    state() {
      const data = read()
      const stock = readStock()
      return { categories: data.categories, products: data.products.map((p) => withQuantity(p, stock)) }
    },

    /** A new, empty product (in the most recently used category). */
    create() {
      const data = read()
      let id
      do id = randomBytes(4).toString('hex')
      while (data.products.some((p) => p.id === id))
      const now = new Date().toISOString()
      const latest = [...data.products].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
      const product = applyChanges(
        { id, category: latest?.category || data.categories[0] || '', createdAt: now, updatedAt: now },
        {},
      )
      data.products.unshift(product)
      write(data)
      return withQuantity(product)
    },

    /** Saves changed fields of one product (quantity goes to the private stock file). */
    update(id, changes) {
      const data = read()
      const index = find(data, id)
      let product = applyChanges(data.products[index], changes, { photoExists })

      const stock = readStock()
      if ('quantity' in changes) {
        const quantity = toQuantity(changes.quantity)
        if (quantity === null) delete stock[id]
        else stock[id] = quantity
        writeJson(stockFile, stock)
        product = { ...product, soldOut: quantity === 0 }
      }
      if (product.category && !data.categories.some((c) => c.toLowerCase() === product.category.toLowerCase())) {
        data.categories.push(product.category)
      }

      product.updatedAt = new Date().toISOString()
      data.products[index] = product
      write(data)
      return withQuantity(product, stock)
    },

    remove(id) {
      const data = read()
      data.products.splice(find(data, id), 1)
      write(data)
      const stock = readStock()
      if (id in stock) {
        delete stock[id]
        writeJson(stockFile, stock)
      }
    },

    addCategory(name) {
      const data = read()
      const category = oneLine(name, LIMIT.category)
      if (category && !data.categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
        data.categories.push(category)
        write(data)
      }
      return data.categories
    },

    /** Stores a photo (JPEG) under a name made from its content; the same photo twice is stored once. */
    savePhoto(buffer) {
      const isJpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      if (!isJpeg) throw new InvalidPhotoError('Not a JPEG photo')
      if (buffer.length > MAX_PHOTO_BYTES) throw new InvalidPhotoError('Photo is too large')
      const file = `${createHash('sha1').update(buffer).digest('hex').slice(0, 12)}.jpg`
      mkdirSync(photoDir, { recursive: true })
      if (!existsSync(join(photoDir, file))) writeFileSync(join(photoDir, file), buffer)
      return file
    },

    photoPath: (file) => (PHOTO_NAME.test(file) ? join(photoDir, file) : null),

    /** Photo files some product uses. */
    usedPhotos: () => new Set(read().products.flatMap((p) => (p.photos ?? []).map((photo) => photo.file))),

    /** Every photo file on disk. */
    photoFiles: () => (existsSync(photoDir) ? readdirSync(photoDir).filter((f) => PHOTO_NAME.test(f)) : []),
  }
}

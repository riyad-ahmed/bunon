/**
 * Turns a Business Manager backup into the website's public catalogue.
 *
 * Privacy: only these product fields are read — name, category, color, size,
 * description, sellingPrice, image (and paymentLink, if one is ever added) —
 * plus a yes/no "in stock" worked out from the stock entries. Costs, profit,
 * notes, SKUs, quantities, orders, customers and capital are never copied.
 */
import { createHash } from 'node:crypto'

export const BACKUP_FORMAT = 'business-manager-backup'

// Same order the dashboard uses
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL', '5XL']

// Stock entry types (from the dashboard): +1 adds, -1 subtracts, 0 = physical count
const STOCK_SIGN = { purchase: 1, added: 1, returned: 1, removed: -1, sold: -1, damaged: -1, count: 0 }

const text = (value) => (value == null ? '' : String(value).trim())
const lower = (value) => text(value).toLowerCase()
const isBlank = (value) => text(value) === ''
const toNumber = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(text(value).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}
const compareText = (a, b) => text(a).localeCompare(text(b), 'en', { sensitivity: 'base', numeric: true })

export function slugify(value) {
  const slug = text(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'item'
}

/**
 * Tidies a name typed in the dashboard: "  black " → "Black", "off white" →
 * "Off White", "t-shirt" → "T-Shirt". Anything typed with capitals is kept.
 */
export function tidyLabel(value) {
  const label = text(value).replace(/\s+/g, ' ')
  if (label !== label.toLowerCase()) return label
  return label.replace(/(^|[\s\-/(])(\p{Ll})/gu, (_, before, letter) => before + letter.toUpperCase())
}

export function sizeRank(size) {
  const value = text(size).toUpperCase()
  const index = SIZE_ORDER.indexOf(value)
  if (index >= 0) return index
  const n = parseFloat(value)
  return Number.isFinite(n) ? 100 + n : 1000
}

const compareSizes = (a, b) => sizeRank(a) - sizeRank(b) || compareText(a, b)

/** "xl, M , l" → ['M', 'L', 'XL'] — standard sizes in capitals, sorted, no repeats */
export function splitSizes(value) {
  const sizes = new Map()
  for (const raw of text(value).split(',')) {
    const size = raw.trim()
    if (!size) continue
    const standard = SIZE_ORDER.includes(size.toUpperCase()) ? size.toUpperCase() : size
    if (!sizes.has(standard.toLowerCase())) sizes.set(standard.toLowerCase(), standard)
  }
  return [...sizes.values()].sort(compareSizes)
}

/** Selling price as a number, or null when it hasn't been entered. */
export function toPrice(value) {
  const n = toNumber(value)
  return n > 0 ? Math.round(n * 100) / 100 : null
}

/**
 * Current stock per product, counted the way the dashboard counts it:
 * opening quantity, plus "in" entries, minus "out" entries; a physical count
 * sets the number. `tracked` is false when no quantity was ever entered —
 * such products are treated as available rather than sold out.
 */
export function stockLevels(products, moves) {
  const levels = new Map(
    products.map((p) => [p.id, { current: toNumber(p.quantity), tracked: !isBlank(p.quantity) }]),
  )
  const ordered = [...moves].sort(
    (a, b) => compareText(a.date, b.date) || compareText(a.createdAt, b.createdAt),
  )
  for (const move of ordered) {
    const level = levels.get(move.productId)
    if (!level) continue
    const quantity = toNumber(move.quantity)
    const sign = STOCK_SIGN[move.movement] ?? 0
    level.tracked = true
    if (sign > 0) level.current += quantity
    else if (sign < 0) level.current -= quantity
    else level.current = quantity
  }
  return levels
}

/** A photo stored by the dashboard (data: URL) → { fileName, buffer }. */
export function decodeImage(value) {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(text(value))
  if (!match) return null
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length === 0) return null
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1]
  const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 12)
  return { fileName: `${hash}.${extension}`, buffer }
}

/**
 * @param backup   parsed Business Manager backup (business-data-latest.json)
 * @param business which business to publish (default 'bunon')
 * @returns {{ catalog: object, images: Map<string, Buffer> }}
 */
export function buildCatalog(backup, { business = 'bunon' } = {}) {
  if (!backup || backup.format !== BACKUP_FORMAT || typeof backup.data !== 'object') {
    throw new Error('This file is not a Business Manager backup.')
  }

  const records = (backup.data.products ?? []).filter(
    (p) => p && p.business === business && text(p.id) && text(p.name),
  )
  const moves = (backup.data.stock ?? []).filter((m) => m && m.business === business)
  const levels = stockLevels(records, moves)
  const images = new Map()

  // One website product per name within a category; each record is a variant
  const groups = new Map()
  for (const record of records) {
    if (lower(record.website) === 'hide') continue
    const category = tidyLabel(record.category) || 'Other'
    const key = `${lower(category)}\u0000${lower(tidyLabel(record.name))}`
    if (!groups.has(key)) groups.set(key, { name: tidyLabel(record.name), category, description: '', records: [] })
    const group = groups.get(key)
    group.records.push(record)
    if (!group.description && text(record.description)) group.description = text(record.description)
  }

  // Categories in the order they are listed in the dashboard
  const listed = (backup.data.categories ?? [])
    .filter((c) => c && c.business === business && c.kind === 'product')
    .map((c) => lower(c.name))
  const categoryRank = (name) => {
    const index = listed.indexOf(lower(name))
    return index >= 0 ? index : listed.length
  }

  const groupsInOrder = [...groups.values()].sort(
    (a, b) => categoryRank(a.category) - categoryRank(b.category) || compareText(a.category, b.category) || compareText(a.name, b.name),
  )

  const usedIds = new Set()
  const products = groupsInOrder.map((group) => {
    const variants = group.records
      .map((record) => {
        const image = decodeImage(record.image)
        if (image) images.set(image.fileName, image.buffer)
        const level = levels.get(record.id)
        const variant = {
          id: text(record.id),
          color: tidyLabel(record.color),
          sizes: splitSizes(record.size),
          price: toPrice(record.sellingPrice),
          image: image ? `catalog/${image.fileName}` : null,
          inStock: !level?.tracked || level.current > 0,
        }
        const link = text(record.paymentLink)
        if (/^https:\/\//i.test(link)) variant.paymentLink = link
        return variant
      })
      .sort(
        (a, b) => compareText(a.color, b.color) || compareSizes(a.sizes[0] ?? '', b.sizes[0] ?? '') || compareText(a.id, b.id),
      )

    let id = slugify(group.name)
    if (usedIds.has(id)) id = `${slugify(group.category)}-${id}`
    usedIds.add(id)

    return { id, name: group.name, category: group.category, description: group.description, variants }
  })

  const categories = [...new Set(products.map((p) => p.category))]

  return { catalog: { version: 1, business, categories, products }, images }
}

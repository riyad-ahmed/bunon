/**
 * Helpers for the website's products (src/data/products.json, written by the
 * BUNON product dashboard). Plain functions, checked by `npm test`.
 */
import { sortSizes } from './presets.js'

export function slugify(value) {
  const slug = String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'item'
}

const text = (value) => String(value ?? '').trim()
/** Drops blanks and repeats ("black" after "Black"), keeping the first spelling. */
function unique(values) {
  const seen = new Map()
  for (const value of values.map(text)) {
    if (value && !seen.has(value.toLowerCase())) seen.set(value.toLowerCase(), value)
  }
  return [...seen.values()]
}

/** A product appears on the website once it has a name and a photo — unless it's hidden. */
export function isPublishable(product) {
  return Boolean(product && product.visible !== false && text(product.name) && product.photos?.length)
}

/** "Hoodie — Green, M" */
export function optionLabel(productName, { color, size }) {
  const details = [color, size].filter(Boolean).join(', ')
  return details ? `${productName} — ${details}` : productName
}

/**
 * Everything the product cards and detail view need, worked out once.
 *  - photos: [{ src: 'photos/<file>', color }] — the first one is the cover;
 *    a photo can belong to one colour
 *  - options: one per colour × size — what a customer actually picks (and
 *    what the bag holds): { id, name, color, size, price, image, inStock }
 */
export function describeProduct(product) {
  const photos = (product.photos ?? []).map((photo) => ({ src: `photos/${photo.file}`, color: text(photo.color) }))
  const colors = unique(product.colors ?? [])
  const sizes = sortSizes(unique(product.sizes ?? []))
  const price = typeof product.price === 'number' && product.price > 0 ? product.price : null
  const inStock = !product.soldOut
  const image = photos[0]?.src ?? null
  const photoOf = (color) => (color && photos.find((photo) => photo.color === color)?.src) || image

  const options = (colors.length ? colors : ['']).flatMap((color) =>
    (sizes.length ? sizes : ['']).map((size) => {
      const option = {
        id: [product.id, color, size].filter(Boolean).join('::'),
        productId: product.id,
        color,
        size,
        price,
        image: photoOf(color),
        inStock,
      }
      if (product.paymentLink) option.paymentLink = product.paymentLink
      return { ...option, name: optionLabel(product.name, option) }
    }),
  )

  return {
    id: product.id,
    name: text(product.name),
    category: text(product.category) || 'Other',
    description: text(product.description),
    price,
    photos,
    image,
    colors,
    sizes,
    options,
    inStock,
  }
}

/** 'Price on request' · '৳1,800' */
export function priceLabel(price, format) {
  return price == null ? 'Price on request' : format(price)
}

/** The options in one colour (every option when the product has no colours). */
export function optionsInColor(product, color) {
  return product.colors.length ? product.options.filter((o) => o.color === color) : product.options
}

/** Starting choice for the detail view: the first colour and size. */
export function defaultSelection(product) {
  const first = product?.options.find((o) => o.inStock) ?? product?.options[0]
  return { color: first?.color ?? '', size: first?.size ?? '' }
}

/** The option matching a colour + size choice (or the only one in that colour). */
export function findOption(product, { color, size }) {
  const inColor = optionsInColor(product, color)
  return inColor.find((o) => o.size === size) ?? (inColor.length === 1 ? inColor[0] : null)
}

/**
 * Helpers for the product catalogue (src/data/catalog.json, generated from
 * the Business Manager dashboard). Plain functions, checked by `npm test`.
 */

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL', '5XL']

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

function sizeRank(size) {
  const value = String(size ?? '').toUpperCase()
  const index = SIZE_ORDER.indexOf(value)
  if (index >= 0) return index
  const n = parseFloat(value)
  return Number.isFinite(n) ? 100 + n : 1000
}

const compareSizes = (a, b) => sizeRank(a) - sizeRank(b) || String(a).localeCompare(String(b))

/** "Hoodie — Green, M" */
export function optionLabel(productName, { color, size }) {
  const details = [color, size].filter(Boolean).join(', ')
  return details ? `${productName} — ${details}` : productName
}

/**
 * One choosable option per variant and size — what a customer actually picks
 * (and what the bag holds): { id, name, color, size, price, image, inStock }
 */
export function productOptions(product) {
  return product.variants.flatMap((variant) => {
    const sizes = variant.sizes.length ? variant.sizes : ['']
    return sizes.map((size) => {
      const option = {
        id: sizes.length > 1 ? `${variant.id}::${size}` : variant.id,
        productId: product.id,
        color: variant.color,
        size,
        price: variant.price,
        image: variant.image,
        inStock: variant.inStock,
      }
      if (variant.paymentLink) option.paymentLink = variant.paymentLink
      return { ...option, name: optionLabel(product.name, option) }
    })
  })
}

/** Everything the product cards and detail view need, worked out once. */
export function describeProduct(product) {
  const options = productOptions(product)
  const colors = [...new Set(options.map((o) => o.color).filter(Boolean))]
  const sizes = [...new Set(options.map((o) => o.size).filter(Boolean))].sort(compareSizes)
  const prices = options.map((o) => o.price).filter((price) => typeof price === 'number')
  const pictured = options.find((o) => o.image && o.inStock) ?? options.find((o) => o.image)

  return {
    ...product,
    options,
    colors,
    sizes,
    soldOutSizes: sizes.filter((size) => options.filter((o) => o.size === size).every((o) => !o.inStock)),
    soldOutColors: colors.filter((color) => options.filter((o) => o.color === color).every((o) => !o.inStock)),
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
    image: pictured?.image ?? null,
    inStock: options.some((o) => o.inStock),
  }
}

/** 'Price on request' · '৳1,800' · 'From ৳1,500' */
export function priceLabel(min, max, format) {
  if (min == null) return 'Price on request'
  return min === max ? format(min) : `From ${format(min)}`
}

/** The options in one colour (every option when the product has no colours). */
export function optionsInColor(product, color) {
  return product.colors.length ? product.options.filter((o) => o.color === color) : product.options
}

/** Starting choice for the detail view: the first option that's in stock. */
export function defaultSelection(product) {
  const first = product?.options.find((o) => o.inStock) ?? product?.options[0]
  return { color: first?.color ?? '', size: first?.size ?? '' }
}

/** The option matching a colour + size choice (or the only one in that colour). */
export function findOption(product, { color, size }) {
  const inColor = optionsInColor(product, color)
  return inColor.find((o) => o.size === size) ?? (inColor.length === 1 ? inColor[0] : null)
}

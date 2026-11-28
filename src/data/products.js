/**
 * BUNON — products
 * ---------------------------------------------------------------------------
 * Products are added in the BUNON product dashboard (double-click
 * "BUNON Products.bat"). It saves products.json and the photos in
 * src/assets/products/photos/ by itself — no need to edit them by hand.
 *
 * A product shows on the website once it has a name and at least one photo,
 * unless it is set to hidden. Newest products come first.
 */
import data from './products.json'
import { describeProduct, isPublishable, slugify } from '@/lib/catalog'

const newestFirst = (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))

/** Each product with its photos, colours, sizes and options worked out. */
export const products = data.products
  .filter(isPublishable)
  .sort(newestFirst)
  .map((product) => {
    const described = describeProduct(product)
    return { ...described, categoryId: slugify(described.category) }
  })

/** Filter buttons: "All" plus the categories, in the dashboard's order. */
const categoryNames = [...new Set([...(data.categories ?? []), ...products.map((product) => product.category)])]
export const categories = [
  { id: 'all', label: 'All' },
  ...categoryNames.map((name) => ({ id: slugify(name), label: name })),
]

/** productsById['a1b2c3d4'] → product */
export const productsById = Object.fromEntries(products.map((product) => [product.id, product]))

/** Every option a customer can pick (product + colour + size), for the bag. */
export const optionsById = Object.fromEntries(
  products.flatMap((product) => product.options.map((option) => [option.id, option])),
)

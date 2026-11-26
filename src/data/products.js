/**
 * BUNON — products
 * ---------------------------------------------------------------------------
 * Products come from the Business Manager dashboard: add or edit them there.
 * The dashboard's backup is turned into catalog.json automatically (see
 * catalog.config.js), so don't edit catalog.json by hand.
 */
import catalog from './catalog.json'
import { describeProduct, slugify } from '@/lib/catalog'

/** Each product with its colours, sizes, price range and options worked out. */
export const products = catalog.products.map((product) => ({
  ...describeProduct(product),
  categoryId: slugify(product.category),
}))

/** Filter buttons: "All" plus the dashboard's product categories. */
export const categories = [
  { id: 'all', label: 'All' },
  ...catalog.categories.map((name) => ({ id: slugify(name), label: name })),
]

/** productsById['hoodie'] → product */
export const productsById = Object.fromEntries(products.map((product) => [product.id, product]))

/** Every option a customer can pick (product + colour + size), for the bag. */
export const optionsById = Object.fromEntries(
  products.flatMap((product) => product.options.map((option) => [option.id, option])),
)

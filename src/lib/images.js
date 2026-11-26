/**
 * Product photos. The dashboard sync saves them in src/assets/products/catalog/;
 * Vite picks up every image there at build time (adding a content hash for
 * caching), and products refer to them by path: 'catalog/1a2b3c4d5e6f.jpg'.
 */
import placeholder from '@/assets/products/placeholder.svg'

const files = import.meta.glob('../assets/products/**/*.{svg,png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
})

const byPath = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace('../assets/products/', ''), url]),
)

/** URL of a product photo, or a neutral placeholder when there's no photo yet. */
export function getProductImage(path) {
  if (!path) return placeholder
  const url = byPath[path]
  if (!url && import.meta.env.DEV) {
    console.warn(`[BUNON] Product photo "${path}" not found — run "npm run sync"`)
  }
  return url ?? placeholder
}

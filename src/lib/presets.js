/**
 * Colours and sizes offered in the product dashboard. The website uses the
 * same list for its colour dots and size order. Plain data, no imports, so
 * both the browser and the dashboard's server can load it.
 */

/** Ready-made colours (the dashboard also lets you type any other name). */
export const COLORS = [
  { name: 'Black', hex: '#141414' },
  { name: 'White', hex: '#f7f7f5' },
  { name: 'Off White', hex: '#efe9dc' },
  { name: 'Cream', hex: '#eee2c6' },
  { name: 'Beige', hex: '#d6c3a1' },
  { name: 'Ash', hex: '#bab8b3' },
  { name: 'Grey', hex: '#8c8c8c' },
  { name: 'Charcoal', hex: '#3b3b3d' },
  { name: 'Navy', hex: '#1f2a44' },
  { name: 'Blue', hex: '#2f5d9b' },
  { name: 'Sky Blue', hex: '#9cc8e6' },
  { name: 'Olive', hex: '#5f6233' },
  { name: 'Green', hex: '#2f6b45' },
  { name: 'Bottle Green', hex: '#1d4532' },
  { name: 'Maroon', hex: '#5e1b26' },
  { name: 'Red', hex: '#b3262e' },
  { name: 'Onion', hex: '#c38f8c' },
  { name: 'Pink', hex: '#e9a7b9' },
  { name: 'Lavender', hex: '#b7a6d8' },
  { name: 'Purple', hex: '#5d3a87' },
  { name: 'Brown', hex: '#6b4a2f' },
  { name: 'Coffee', hex: '#4a3324' },
  { name: 'Mustard', hex: '#cf9e1d' },
  { name: 'Orange', hex: '#df7a2c' },
]

/** Ready-made sizes, in order. */
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL', '5XL']

/** Position of a size when sorting: standard sizes first, then numbers, then anything else. */
export function sizeRank(size) {
  const value = String(size ?? '').trim().toUpperCase()
  const index = SIZE_ORDER.indexOf(value)
  if (index >= 0) return index
  const n = parseFloat(value)
  return Number.isFinite(n) ? 100 + n : 1000
}

/** ['XL', 'M', '38', 'L'] → ['M', 'L', 'XL', '38'] */
export function sortSizes(sizes) {
  return [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b) || String(a).localeCompare(String(b)))
}

/** The dot colour for a colour name, or null when it isn't one of the ready-made colours. */
export function swatchFor(color) {
  const name = String(color ?? '').trim().toLowerCase()
  return COLORS.find((c) => c.name.toLowerCase() === name)?.hex ?? null
}

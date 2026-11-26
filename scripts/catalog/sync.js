/**
 * Reads the newest Business Manager backup and writes the website catalogue:
 *   src/data/catalog.json              public product details
 *   src/assets/products/catalog/*.jpg  product photos
 * Files are only rewritten when something actually changed.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { BACKUP_FORMAT, buildCatalog } from './buildCatalog.js'

export const LATEST_BACKUP = 'business-data-latest.json'
export const CATALOG_FILE = 'src/data/catalog.json'
export const IMAGE_DIR = 'src/assets/products/catalog'

/**
 * `source` may be a backup file, the dashboard's backup folder, or a list of
 * those (the newest backup among them wins). In a folder,
 * business-data-latest.json wins; otherwise the newest backup file found there
 * (or in its daily-backups folder) is used.
 */
export function findBackupFile(source) {
  if (Array.isArray(source)) {
    let newest = null
    for (const file of source.map(findBackupFile)) {
      if (file && (!newest || statSync(file).mtimeMs > statSync(newest).mtimeMs)) newest = file
    }
    return newest
  }
  if (!source || !existsSync(source)) return null
  if (statSync(source).isFile()) return source

  const latest = join(source, LATEST_BACKUP)
  if (existsSync(latest)) return latest

  const candidates = []
  for (const folder of [source, join(source, 'daily-backups')]) {
    if (!existsSync(folder)) continue
    for (const name of readdirSync(folder)) {
      if (!name.toLowerCase().endsWith('.json')) continue
      const file = join(folder, name)
      candidates.push({ file, modified: statSync(file).mtimeMs })
    }
  }
  candidates.sort((a, b) => b.modified - a.modified)

  for (const { file } of candidates) {
    try {
      if (JSON.parse(readFileSync(file, 'utf8')).format === BACKUP_FORMAT) return file
    } catch {
      // not JSON or still being written — try the next one
    }
  }
  return null
}

function writeIfChanged(file, content) {
  if (existsSync(file) && readFileSync(file).equals(Buffer.from(content))) return false
  writeFileSync(file, content)
  return true
}

/**
 * @param prune remove photos no product uses any more. The dev server passes
 *              false: deleting a file makes Vite reload the whole page, so
 *              leftovers wait for the next build or `npm run sync`.
 * @returns {{ status: 'no-source' } | { status: 'ok', file, changed, products, variants, images }}
 */
export function syncCatalog({ root, source, business, prune = true }) {
  const file = findBackupFile(source)
  if (!file) return { status: 'no-source' }

  const backup = JSON.parse(readFileSync(file, 'utf8'))
  const { catalog, images } = buildCatalog(backup, { business })

  let changed = false

  // Photos: add new ones, remove ones no product uses any more
  const imageDir = join(root, IMAGE_DIR)
  mkdirSync(imageDir, { recursive: true })
  for (const [name, buffer] of images) {
    if (writeIfChanged(join(imageDir, name), buffer)) changed = true
  }
  for (const name of prune ? readdirSync(imageDir) : []) {
    if (/\.(jpe?g|png|webp)$/i.test(name) && !images.has(name)) {
      rmSync(join(imageDir, name))
      changed = true
    }
  }

  if (writeIfChanged(join(root, CATALOG_FILE), `${JSON.stringify(catalog, null, 2)}\n`)) changed = true

  return {
    status: 'ok',
    file,
    changed,
    products: catalog.products.length,
    variants: catalog.products.reduce((n, p) => n + p.variants.length, 0),
    images: images.size,
  }
}

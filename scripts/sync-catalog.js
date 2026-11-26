/**
 * npm run sync — copy the latest products from the Business Manager dashboard
 * into the website (src/data/catalog.json + product photos).
 */
import { fileURLToPath } from 'node:url'
import config from '../catalog.config.js'
import { syncCatalog } from './catalog/sync.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = process.env.BUNON_CATALOG_SOURCE || config.source

try {
  const result = syncCatalog({ root, source, business: config.business })
  if (result.status === 'no-source') {
    console.error(`No dashboard backup found in: ${[source].flat().join(', ')}`)
    console.error('In Business Manager: Backup & Restore → Choose backup folder… → turn on automatic saving.')
    process.exit(1)
  }
  console.log(`Read ${result.file}`)
  console.log(`${result.products} products, ${result.variants} variants, ${result.images} photos`)
  console.log(result.changed ? 'Website products updated.' : 'Website products were already up to date.')
} catch (error) {
  console.error(`Could not sync products: ${error.message}`)
  process.exit(1)
}

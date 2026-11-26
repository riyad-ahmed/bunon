/**
 * Vite plugin: keeps the website's products in step with the dashboard.
 *  - dev server: syncs on start, then again whenever a backup folder changes
 *    (the dashboard rewrites business-data-latest.json after every edit)
 *  - build: syncs first when a backup is reachable (on GitHub's servers it
 *    isn't, so the saved src/data/catalog.json is used as it is)
 */
import { existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { syncCatalog } from './sync.js'

const normalise = (path) => resolve(path).toLowerCase()
const isWithin = (file, target) => normalise(file) === normalise(target) || normalise(file).startsWith(normalise(target) + sep)

export function catalogSync({ root, source, business }) {
  const sources = [source].flat().filter(Boolean)
  let command = 'serve'

  const run = (log) => {
    try {
      // Dev server: keep unused photos for now — deleting one would reload the page
      const result = syncCatalog({ root, source: sources, business, prune: command === 'build' })
      if (result.status === 'no-source') {
        log(`[products] No dashboard backup found in ${sources.join(' or ')} — using the saved product list.`)
      } else {
        log(
          `[products] ${result.products} products (${result.variants} variants, ${result.images} photos) from ${result.file}` +
            (result.changed ? ' — updated' : ''),
        )
      }
    } catch (error) {
      log(`[products] Could not read the dashboard backup (${error.message}) — keeping the current product list.`)
    }
  }

  return {
    name: 'bunon-catalog-sync',

    configResolved(config) {
      command = config.command
    },

    buildStart() {
      if (command === 'build') run((message) => console.log(message))
    },

    configureServer(server) {
      const log = (message) => server.config.logger.info(message, { timestamp: true })
      run(log)
      const watched = sources.filter((path) => existsSync(path))
      if (watched.length === 0) return

      server.watcher.add(watched)
      let timer = null
      const onChange = (file) => {
        if (!file.toLowerCase().endsWith('.json')) return
        if (!watched.some((path) => isWithin(file, path))) return
        clearTimeout(timer)
        timer = setTimeout(() => run(log), 400) // let the dashboard finish writing
      }
      server.watcher.on('add', onChange)
      server.watcher.on('change', onChange)
    },
  }
}

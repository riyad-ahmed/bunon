/**
 * npm run publish:site — put the dashboard's latest products on the live website.
 * (Or double-click "Publish website.bat".)
 *   1. copies the newest products from the Business Manager dashboard, like `npm run sync`
 *   2. saves them in git — only src/data/catalog.json and the product photos
 *   3. sends them to GitHub, which rebuilds the live website in a minute or two
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import config from '../catalog.config.js'
import { CATALOG_FILE, IMAGE_DIR, syncCatalog } from './catalog/sync.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const PRODUCT_FILES = [CATALOG_FILE, IMAGE_DIR]

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

function stop(message, detail) {
  console.error(`\n✗ ${message}`)
  if (detail) console.error(String(detail).trim())
  process.exit(1)
}

// 1. The latest products from the dashboard
const source = process.env.BUNON_CATALOG_SOURCE || config.source
let result
try {
  result = syncCatalog({ root, source, business: config.business })
} catch (error) {
  stop(`Could not read the dashboard backup: ${error.message}`)
}
if (result.status === 'no-source') {
  stop(
    `No dashboard backup found in: ${[source].flat().join(', ')}`,
    'In Business Manager: Backup & Restore → Choose backup folder… → turn on "Save automatically after every change".',
  )
}
console.log(`Products: ${result.products} (${result.variants} colour/size choices, ${result.images} photos)`)
console.log(`From:     ${result.file}`)

// 2. Save the product files in git (nothing else is included)
try {
  git('add', '--all', '--', ...PRODUCT_FILES)
  if (git('diff', '--cached', '--name-only', '--', ...PRODUCT_FILES)) {
    git('commit', '--quiet', '-m', 'Update products from the dashboard', '--', ...PRODUCT_FILES)
    console.log('Saved the new product list.')
  }
} catch (error) {
  stop('Could not save the product list in git.', error.stderr || error.message)
}

// 3. Send to GitHub whenever this computer has something GitHub doesn't
let waiting
try {
  waiting = Number(git('rev-list', '--count', '@{upstream}..HEAD'))
} catch (error) {
  stop('This project is not connected to GitHub yet.', error.stderr || error.message)
}

const remote = git('remote', 'get-url', 'origin')
const repo = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/i.exec(remote)
const liveUrl = repo ? `https://${repo[1].toLowerCase()}.github.io/${repo[2]}/` : remote

if (waiting === 0) {
  console.log(`\n✓ The live website already shows these products: ${liveUrl}`)
  process.exit(0)
}

console.log('Sending to GitHub…')
try {
  execFileSync('git', ['push', '--quiet'], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] })
} catch {
  stop(
    'Could not send to GitHub.',
    'Check the internet connection and try again. If GitHub has changes this computer does not have, run "git pull" first.',
  )
}
console.log(`\n✓ Done. The live website updates in about 1–2 minutes: ${liveUrl}`)

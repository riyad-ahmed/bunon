/**
 * The BUNON product dashboard, served at /admin/ by `npm run admin`
 * (double-click "BUNON Products.bat"). It only exists on this computer:
 * plain `npm run dev` and the website build don't include it.
 *
 * The page itself is plain HTML/CSS/JS from admin/, served as-is (outside
 * Vite's live-reload), so the dashboard never reloads while you type. Its API:
 *   GET    /admin/api/state            products, categories, choices, publish status
 *   POST   /admin/api/products         new empty product
 *   PATCH  /admin/api/products/:id     save changed fields
 *   DELETE /admin/api/products/:id
 *   POST   /admin/api/photos           store a JPEG, returns its file name
 *   POST   /admin/api/categories       add a category
 *   GET    /admin/api/publish          publish status
 *   POST   /admin/api/publish          publish now
 */
import { createReadStream, existsSync } from 'node:fs'
import { join } from 'node:path'
import { COLORS, SIZES } from '../../src/lib/presets.js'
import { createPublisher } from './publisher.js'
import { createStore, InvalidPhotoError, NotFoundError } from './store.js'

const FILES = {
  '/admin/': ['admin/index.html', 'text/html; charset=utf-8'],
  '/admin/app.js': ['admin/app.js', 'text/javascript; charset=utf-8'],
  '/admin/admin.css': ['admin/admin.css', 'text/css; charset=utf-8'],
  '/admin/logo.png': ['src/assets/brand/bunon-logo-light.png', 'image/png'],
  '/admin/fonts/manrope.woff2': [
    'node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
    'font/woff2',
  ],
  '/admin/fonts/cormorant.woff2': [
    'node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2',
    'font/woff2',
  ],
}

const MAX_BODY = 15 * 1024 * 1024

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Too large'), { status: 413 }))
        req.destroy()
      } else chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function readJsonBody(req) {
  const body = await readBody(req)
  try {
    return body.length ? JSON.parse(body.toString('utf8')) : {}
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 })
  }
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.statusCode = status
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', 'no-store')
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body)
}

function sendFile(res, path, type, cache = 'no-cache') {
  if (!existsSync(path)) return send(res, 404, { error: 'Not found' })
  res.statusCode = 200
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', cache)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  createReadStream(path).pipe(res)
}

/**
 * Changes must come from the dashboard page itself: same origin, plus a
 * header other websites can't send without permission. This stops another
 * site open in the browser from quietly editing products.
 */
function isTrusted(req) {
  if (req.headers['x-bunon-admin'] !== '1') return false
  const origin = req.headers.origin
  return !origin || origin === `http://${req.headers.host}`
}

export function productDashboard({ root }) {
  let enabled = false

  return {
    name: 'bunon-product-dashboard',

    configResolved(config) {
      enabled = config.command === 'serve' && config.mode === 'admin'
    },

    configureServer(server) {
      if (!enabled) return
      const log = (message) => server.config.logger.info(`[products] ${message}`, { timestamp: true })
      const store = createStore(root)
      const publisher = createPublisher({
        root,
        store,
        delayMs: Number(process.env.BUNON_PUBLISH_DELAY_MS) || 20_000,
        log,
      })
      void publisher.publishLeftovers()

      const changed = (body) => {
        publisher.schedule()
        return { ...body, publish: publisher.status() }
      }

      async function api(req, res, path) {
        const method = req.method
        if (method !== 'GET' && !isTrusted(req)) return send(res, 403, { error: 'Not allowed' })

        if (path === '/state' && method === 'GET') {
          return send(res, 200, { ...store.state(), colors: COLORS, sizes: SIZES, publish: publisher.status() })
        }
        if (path === '/products' && method === 'POST') return send(res, 201, { product: store.create() })

        const product = /^\/products\/([a-z0-9-]+)$/.exec(path)
        if (product && method === 'PATCH') {
          return send(res, 200, changed({ product: store.update(product[1], await readJsonBody(req)) }))
        }
        if (product && method === 'DELETE') {
          store.remove(product[1])
          return send(res, 200, changed({ ok: true }))
        }

        if (path === '/photos' && method === 'POST') return send(res, 201, { file: store.savePhoto(await readBody(req)) })
        if (path === '/categories' && method === 'POST') {
          return send(res, 200, { categories: store.addCategory((await readJsonBody(req)).name) })
        }
        if (path === '/publish' && method === 'GET') return send(res, 200, { publish: publisher.status() })
        if (path === '/publish' && method === 'POST') {
          void publisher.publishNow()
          return send(res, 202, { publish: publisher.status() })
        }
        return send(res, 404, { error: 'Not found' })
      }

      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (path === '/admin') {
          res.statusCode = 302
          res.setHeader('Location', '/admin/')
          return res.end()
        }
        if (!path.startsWith('/admin/')) return next()

        try {
          if (path.startsWith('/admin/api/')) return await api(req, res, path.slice('/admin/api'.length))
          const photo = /^\/admin\/photos\/([a-f0-9]{12}\.jpg)$/.exec(path)
          if (photo) return sendFile(res, store.photoPath(photo[1]), 'image/jpeg', 'public, max-age=31536000, immutable')
          const file = FILES[path]
          if (file) return sendFile(res, join(root, file[0]), file[1])
          return send(res, 404, { error: 'Not found' })
        } catch (error) {
          if (error instanceof NotFoundError) return send(res, 404, { error: 'This product no longer exists' })
          if (error instanceof InvalidPhotoError) return send(res, 400, { error: error.message })
          if (error.status) return send(res, error.status, { error: error.message })
          log(`Error: ${error.stack ?? error.message}`)
          return send(res, 500, { error: 'Something went wrong' })
        }
      })

      server.httpServer?.once('listening', () => {
        log('Product dashboard ready — keep this window open while you work.')
      })
    },
  }
}

import { realpathSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import catalog from './catalog.config.js'
import { catalogSync } from './scripts/catalog/vitePlugin.js'

// The project folder with its real drive-letter casing. On Windows a terminal
// can open in "h:\BUNON" while installed packages resolve to "H:\BUNON"; Vite
// then treats them as different files, bundles React twice and the built page
// stays blank. Using the real path keeps every module on one spelling.
const root = realpathSync.native(fileURLToPath(new URL('.', import.meta.url)))

// https://vite.dev/config/
export default defineConfig({
  root,

  // Relative asset paths, so the built site works from any address:
  //   https://USERNAME.github.io/            (user site)
  //   https://USERNAME.github.io/REPO-NAME/  (project site)
  base: './',

  plugins: [
    react(),
    // Products from the Business Manager dashboard (see catalog.config.js)
    catalogSync({
      root,
      source: process.env.BUNON_CATALOG_SOURCE || catalog.source,
      business: catalog.business,
    }),
  ],

  resolve: {
    // `@/…` always points at src/, wherever the importing file lives
    alias: { '@': join(root, 'src') },
  },
})

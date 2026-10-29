import fs from 'node:fs'
import path from 'node:path'
import type { Connect } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

const ROOT = path.resolve(import.meta.dirname, '..')
const DATA = path.join(ROOT, 'data/processed')

// Serve /data/<name> from data/processed at dev/preview time only. The Eskom/NTCSA data is
// never copied into dist/, because the terms forbid redistribution.
function processedData(): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith('/data/')) return next()
    const name = path.basename(req.url.split('?')[0]) // no subfolders, no ../
    const file = path.join(DATA, name)
    if (!fs.existsSync(file)) {
      res.statusCode = 404
      return res.end('Not found')
    }
    res.setHeader('Content-Type', name.endsWith('json') ? 'application/geo+json' : 'application/octet-stream')
    res.setHeader('Cache-Control', 'no-store')
    fs.createReadStream(file).pipe(res)
  }
  return {
    name: 'processed-data',
    configureServer: server => { server.middlewares.use(handler) },
    configurePreviewServer: server => { server.middlewares.use(handler) },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), processedData()],
  // One .env at the repo root. MAPBOX_TOKEN is exposed to the app (and built into the bundle,
  // which is how Mapbox public pk. tokens are meant to be used; restrict it by URL before going public).
  envDir: ROOT,
  envPrefix: ['VITE_', 'MAPBOX_'],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  // Localhost only until NTCSA consents to publication.
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
})

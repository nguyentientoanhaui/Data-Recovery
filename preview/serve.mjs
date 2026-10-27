// Tiny static server for the local preview (no child processes, so it runs
// inside this sandbox). Serves ./preview-dist + ./public.
import { createServer } from 'node:http'
import { stat, open } from 'node:fs/promises'
import path from 'node:path'

const PORT = 4176
const ROOT = path.resolve('preview-dist')
const PUBLIC = path.resolve('public')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mp4': 'video/mp4',
}

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0])
    if (urlPath.includes('..')) {
      res.writeHead(403)
      res.end('forbidden')
      return
    }
    let file
    const publicFile = path.join(PUBLIC, urlPath)
    const publicExists = await stat(publicFile)
      .then((s) => s.isFile())
      .catch(() => false)
    if (publicExists) file = publicFile
    else file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath)

    const s = await stat(file)
    const contentType = MIME[path.extname(file)] || 'application/octet-stream'
    const range = req.headers.range

    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range)
      const start = m[1] ? parseInt(m[1], 10) : 0
      let end = m[2] ? parseInt(m[2], 10) : s.size - 1
      end = Math.min(end, s.size - 1)
      const len = end - start + 1
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${s.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': len,
        'Content-Type': contentType,
      })
      const fh = await open(file, 'r')
      const buf = Buffer.alloc(len)
      await fh.read(buf, 0, len, start)
      await fh.close()
      res.end(buf)
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': s.size,
        'Cache-Control': 'no-cache',
      })
      const fh = await open(file, 'r')
      fh.createReadStream().pipe(res)
    }
  } catch (e) {
    res.writeHead(404)
    res.end('not found')
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`preview serving http://127.0.0.1:${PORT}/`)
})

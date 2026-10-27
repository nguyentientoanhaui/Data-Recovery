// Measures per-seek latency of the hero video (old encode: ~2s keyframe gap).
const port = parseInt(process.argv[2] || '9351', 10)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  let targets = null
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`)
      targets = await res.json()
      if (targets.find((t) => t.type === 'page')) break
    } catch {}
    await sleep(250)
  }
  const page = targets.find((t) => t.type === 'page')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id)
      pending.delete(m.id)
      m.error ? reject(new Error(m.error.message)) : resolve(m.result)
    }
  }
  const send = (m, p = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id
      pending.set(mid, { resolve, reject })
      ws.send(JSON.stringify({ id: mid, method: m, params: p }))
    })
  const evalJs = async (expression) => {
    const ev = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (ev.exceptionDetails) throw new Error(JSON.stringify(ev.exceptionDetails.exception?.description || ev.exceptionDetails.text))
    return ev.result.value
  }
  await new Promise((r) => (ws.onopen = r))
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:4176/' })
  await sleep(5000)

  const result = await evalJs(`(async () => {
    const v = document.querySelector('section video')
    const times = [0.5, 3.1, 7.7, 11.4, 15.2, 18.9, 5.5, 12.8, 2.2, 19.5]
    const out = []
    for (const t of times) {
      const t0 = performance.now()
      await new Promise((res) => {
        const done = () => { v.removeEventListener('seeked', done); res() }
        v.addEventListener('seeked', done)
        v.currentTime = t
      })
      out.push({ target: t, ms: Math.round(performance.now() - t0), got: Math.round(v.currentTime * 1000) / 1000 })
    }
    return JSON.stringify(out)
  })()`)
  const rows = JSON.parse(result)
  const max = Math.max(...rows.map((r) => r.ms))
  const avg = Math.round(rows.reduce((a, r) => a + r.ms, 0) / rows.length)
  for (const r of rows) console.log(`seek ${r.target}s → ${r.ms}ms (landed ${r.got}s)`)
  console.log(`max seek latency = ${max}ms, avg = ${avg}ms`)
  ws.close()
  process.exit(max < 250 ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

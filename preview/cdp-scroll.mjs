// Verifies the scroll-driven hero end-to-end in a real browser:
// scrolling must scrub video.currentTime proportionally (and screenshots it).
const port = parseInt(process.argv[2] || '9350', 10)
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
  if (!page) throw new Error('no page target')

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
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id
      pending.set(mid, { resolve, reject })
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  const evalJs = async (expression) => {
    const ev = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (ev.exceptionDetails) throw new Error('page js error: ' + JSON.stringify(ev.exceptionDetails.exception?.description || ev.exceptionDetails.text))
    return ev.result.value
  }
  await new Promise((r) => (ws.onopen = r))
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:4176/' })
  await sleep(4500)

  const meta = await evalJs(`(() => {
    const v = document.querySelector('section video')
    const track = document.querySelector('section')
    const blocks = [...document.querySelectorAll('[data-block]')]
    const last = blocks[blocks.length - 1]
    return JSON.stringify({
      duration: v && v.duration,
      readyState: v && v.readyState,
      trackH: track.offsetHeight,
      docH: document.documentElement.scrollHeight,
      blockCount: blocks.length,
      blockTops: blocks.map((b) => Math.round(b.offsetTop / window.innerHeight * 100) / 100),
      lastBottomVh: last ? Math.round((last.offsetTop + last.offsetHeight) / window.innerHeight * 100) / 100 : null,
      vidTop: v && v.getBoundingClientRect().top,
      vidH: v && v.getBoundingClientRect().height,
      windowH: window.innerHeight,
    })
  })()`)
  console.log('META:', meta)
  const m = JSON.parse(meta)

  const fractions = [0, 0.25, 0.5, 0.75, 1]
  const results = []
  for (const f of fractions) {
    await evalJs(`window.scrollTo({ top: document.querySelector('section').offsetTop + ${f} * (${m.lastBottomVh} + 0.75) * window.innerHeight, behavior: 'instant' })`)
    await sleep(1300) // let the 0.22 smoothing settle
    const row = await evalJs(`(() => {
      const v = document.querySelector('section video')
      const p = Math.min(Math.max((window.scrollY) / ((${m.lastBottomVh} + 0.75) * window.innerHeight), 0), 1)
      return JSON.stringify({ p: Math.round(p * 1000) / 1000, t: Math.round(v.currentTime * 1000) / 1000, y: window.scrollY, stickyTop: Math.round(document.querySelector('section .sticky').getBoundingClientRect().top) })
    })()`)
    const r = JSON.parse(row)
    const expected = f * Math.max(m.duration - 1 / 48, 0)
    console.log(`scroll ${(f * 100).toFixed(0).padStart(3)}% → p=${r.p}  currentTime=${r.t}s  expected≈${expected.toFixed(2)}s  stickyTop=${r.stickyTop}`)
    results.push({ f, got: r.t, expected })

    const shot = await send('Page.captureScreenshot', { format: 'png' })
    const { writeFileSync } = await import('node:fs')
    writeFileSync(`preview/scroll-${(f * 100).toFixed(0)}.png`, Buffer.from(shot.data, 'base64'))
  }
  const ok = results.every((r) => Math.abs(r.got - r.expected) < 0.6)
  console.log(ok ? 'SCRUB OK: currentTime tracks scroll within 0.6s' : 'SCRUB MISMATCH')
  // reverse direction check
  await evalJs(`window.scrollTo({ top: 0, behavior: 'instant' })`)
  await sleep(1300)
  const back = await evalJs(`document.querySelector('section video').currentTime`)
  console.log('back to top → currentTime=' + back.toFixed(2) + 's')
  ws.close()
  process.exit(ok && back < 1 ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

// Samples the caption sheet's opacity from page load to prove it stays
// hidden until the video is actually playing, plus the video band ratio.
const port = parseInt(process.argv[2] || '9354', 10)
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

  const read = `(() => {
    const v = document.querySelector('section video')
    const sheet = [...document.querySelectorAll('section div')].find((d) => d.className.includes('bg-[#F6E4CF]'))
    const r = v.getBoundingClientRect()
    const o = sheet ? getComputedStyle(sheet).opacity : null
    return JSON.stringify({ t: Math.round(v.currentTime * 100) / 100, opacity: o, ratio: Math.round((r.height / window.innerHeight) * 1000) / 10 })
  })()`

  await send('Page.navigate', { url: 'http://127.0.0.1:4176/' })
  const samples = []
  for (let i = 0; i < 26; i++) {
    await sleep(140)
    try { samples.push(JSON.parse(await evalJs(read))) } catch {}
  }
  const firstHidden = samples.findIndex((s) => s.opacity === '1')
  console.log('first samples:', samples.slice(0, 6).map((s) => `t=${s.t}s op=${s.opacity}`).join('  '))
  console.log(`sheet hit opacity 1 at sample #${firstHidden} (≈${(firstHidden * 140) / 1000}s after navigate)`)
  console.log(`at that moment the video time was ${firstHidden >= 0 ? samples[firstHidden].t : '?'}s (i.e. the video was already running)`)
  const last = samples[samples.length - 1]
  console.log(`final: opacity=${last.opacity}, videoBand=${last.ratio}% of viewport`)
  const sawHidden = samples.slice(0, Math.max(firstHidden, 1)).some((s) => s.opacity === '0')
  const ok = sawHidden && firstHidden > 0 && last.opacity === '1' && last.ratio >= 78 && last.ratio <= 82
  console.log(ok ? 'OK: caption hidden first, fades in once the video runs; video ≈ 80% of the screen' : 'MISMATCH')
  ws.close()
  process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

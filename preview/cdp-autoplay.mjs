// Verifies the hero video plays BY ITSELF with no scrolling:
// reads paused/currentTime twice, 3 s apart, at scroll position 0.
const port = parseInt(process.argv[2] || '9353', 10)
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
  await sleep(4000)

  const read = `(() => {
    const v = document.querySelector('section video')
    const r = v.getBoundingClientRect()
    return JSON.stringify({ paused: v.paused, t: Math.round(v.currentTime * 100) / 100, scrollY: window.scrollY, vidTop: Math.round(r.top), vidH: Math.round(r.height), winH: window.innerHeight })
  })()`
  const a = JSON.parse(await evalJs(read))
  await sleep(3000)
  const b = JSON.parse(await evalJs(read))
  console.log(`t0: paused=${a.paused} currentTime=${a.t}s scrollY=${a.scrollY} videoBand=${a.vidH}px of ${a.winH}`)
  console.log(`t+3s: paused=${b.paused} currentTime=${b.t}s`)
  const advanced = b.t - a.t
  console.log(`advanced ${Math.round(advanced * 100) / 100}s in 3 s without scrolling`)
  const ok = !a.paused && !b.paused && advanced > 2.0 && advanced < 4.5 && a.scrollY === 0 && a.vidTop === 0
  console.log(ok ? 'VIDEO PLAYS BY ITSELF — no scrolling needed' : 'VIDEO NOT PLAYING ON ITS OWN')
  ws.close()
  process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

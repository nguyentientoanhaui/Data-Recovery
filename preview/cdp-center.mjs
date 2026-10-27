// Verifies every hero cluster element shares the page's horizontal centre.
const port = parseInt(process.argv[2] || '9363', 10)
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
  const send = (m, p = {}) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: mid, method: m, params: p })) })
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

  const out = await evalJs(`(() => {
    const section = document.querySelector('section')
    const eyebrow = [...section.querySelectorAll('span')].find((s) => s.textContent.includes('Data Recovery Specialist'))
    const h1 = section.querySelector('h1')
    const sub = section.querySelector('p')
    const trust = section.querySelector('ul')
    const cx = (el) => { const b = el.getBoundingClientRect(); return Math.round((b.left + b.right) / 2) }
    const v = section.querySelector('video')
    return JSON.stringify({
      pageCenter: Math.round(document.documentElement.clientWidth / 2),
      eyebrowCx: cx(eyebrow), h1Cx: cx(h1), subCx: cx(sub), trustCx: cx(trust),
      playing: !v.paused, videoH: Math.round(v.getBoundingClientRect().height),
    })
  })()`)
  const m = JSON.parse(out)
  console.log(JSON.stringify(m))
  const ok = [m.eyebrowCx, m.h1Cx, m.subCx, m.trustCx].every((c) => Math.abs(c - m.pageCenter) < 3) && m.playing && m.videoH === 900
  console.log(ok ? `OK: all cluster elements centred on the page axis (${m.pageCenter}px)` : 'MISMATCH')
  ws.close()
  process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

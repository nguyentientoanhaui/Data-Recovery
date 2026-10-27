// Verifies: hero heading is 2 lines ("memories" inline), no layer switcher,
// and the services/journal/footer blocks are all centred on the page axis.
const port = parseInt(process.argv[2] || '9367', 10)
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
  await sleep(4500)

  const out = await evalJs(`(() => {
    const cx = (el) => { const b = el.getBoundingClientRect(); return Math.round((b.left + b.right) / 2) }
    const hero = document.querySelector('section')
    const line1 = hero.querySelector('h1 span')
    const switcherBtns = hero.querySelectorAll('button').length
    const services = document.querySelector('#services')
    const label = services.querySelector('span')
    const h2 = services.querySelector('h2')
    const sub = services.querySelector('.max-w-2xl p')
    const tabs = services.querySelector('nav[role="tablist"]')
    const panelH3 = services.querySelector('#journal h3')
    const panelP = services.querySelector('#journal h3 + div p, #journal p')
    const logTitle = services.querySelector('#journal h4')
    const footerH = document.querySelector('#contact p')
    const center = Math.round(document.documentElement.clientWidth / 2)
    return JSON.stringify({
      center,
      line1H: Math.round(line1.getBoundingClientRect().height),
      line1W: Math.round(line1.getBoundingClientRect().width),
      h1Lines: Math.round(hero.querySelector('h1').getBoundingClientRect().height / line1.getBoundingClientRect().height),
      switcherBtns,
      labelCx: cx(label), h2Cx: cx(h2), subCx: cx(sub), tabsCx: cx(tabs),
      panelH3Cx: cx(panelH3), panelPCx: cx(panelP), logTitleCx: cx(logTitle), footerCx: cx(footerH),
      videoPlaying: !hero.querySelector('video').paused,
    })
  })()`)
  const m = JSON.parse(out)
  console.log(JSON.stringify(m, null, 1))
  const ok =
    m.switcherBtns === 0 &&
    m.h1Lines === 2 && m.line1W < 620 &&
    [m.labelCx, m.h2Cx, m.subCx, m.tabsCx, m.panelH3Cx, m.panelPCx, m.logTitleCx, m.footerCx].every((c) => Math.abs(c - m.center) < 6) &&
    m.videoPlaying
  console.log(ok ? `OK: hero shows 2 lines, no switcher, and every block below is centred on ${m.center}px` : 'MISMATCH')
  ws.close()
  process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

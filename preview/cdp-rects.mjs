// Connects to headless Edge via CDP, loads the page, and returns exact
// getBoundingClientRect values for the elements involved in the misalignment.
const port = 9333
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  // wait for Edge to publish its targets
  let targets = null
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`)
      targets = await res.json()
      const page = targets.find((t) => t.type === 'page')
      if (page) break
    } catch {}
    await sleep(250)
  }
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('no page target: ' + JSON.stringify(targets))

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
  await new Promise((r) => (ws.onopen = r))

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: 'http://127.0.0.1:4176/' })
  await sleep(4000) // let React mount + videos spin up

  const expr = `(() => {
    const q = (s) => document.querySelector(s)
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) } }
    const heroHeading = q('section h1')
    const heroLine1 = heroHeading ? heroHeading.querySelector('span') : null
    const heroLine2 = heroHeading ? heroHeading.querySelectorAll('span')[1] : null
    return JSON.stringify({
      innerWidth: window.innerWidth,
      nav: rect(q('nav')),
      heroSection: rect(q('section')),
      videoBand: rect(q('section .flex-1')),
      textBand: rect(q('section h1').closest('div[class*="px-5"]')),
      heroH1: rect(q('section h1')),
      heroContent: rect(heroHeading ? heroHeading.parentElement : null),
      heroLine1: rect(q('section h1 span')),
      heroLine2: rect(q('section h1 span:nth-child(2)')),
      heroSubtitle: rect(q('section p')),
      heroTrust: rect(q('section h1') ? q('section h1').parentElement.querySelector('ul') : null),
      servicesSection: rect(q('#services')),
      servicesContainer: rect(q('#services > div')),
      servicesHeadingBlock: rect(q('#services .max-w-2xl')),
      servicesH2: rect(q('#services h2')),
      servicesPara: rect(q('#services .max-w-2xl p')),
      tabsNav: rect(q('#services nav')),
      firstTab: rect(q('#services nav button')),
      journalWrap: rect(q('#journal')),
      panelCard: rect(q('#journal .grid > div')),
      panelH3: rect(q('#journal h3')),
      panelDesc: rect(q('#journal p')),
    }, null, 1)
  })()`

  const ev = await send('Runtime.evaluate', { expression: expr, returnByValue: true })
  console.log(ev.result.value)
  ws.close()
  process.exit(0)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

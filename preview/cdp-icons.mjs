// Counts remaining SVG icons on the page (expect 0 in services + footer).
const port = 9372
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
  await new Promise((r) => (ws.onopen = r))
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: 'http://127.0.0.1:4176/' })
  await sleep(3500)
  const ev = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: "JSON.stringify({svgsInServices: document.querySelectorAll('#services svg').length, svgsInFooter: document.querySelectorAll('footer svg').length, svgsInHero: document.querySelectorAll('section svg').length})",
  })
  console.log(ev.result.value)
  const m = JSON.parse(ev.result.value)
  ws.close()
  process.exit(m.svgsInServices === 0 && m.svgsInFooter === 0 && m.svgsInHero === 0 ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

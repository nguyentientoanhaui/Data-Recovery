// Diagnoses the production hero video: does it play at all, and how long?
const port = parseInt(process.argv[2] || '9390', 10)
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
  const logs = []
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id)
      pending.delete(m.id)
      m.error ? reject(new Error(m.error.message)) : resolve(m.result)
    } else if (m.method === 'Log.entryAdded') {
      logs.push(m.params.entry)
    } else if (m.method === 'Runtime.consoleAPICalled') {
      logs.push({ type: m.params.type, text: m.params.args.map((a) => a.value || a.description || '').join(' ') })
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
  await send('Log.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'https://data-recovery.nguyentoantmu.workers.dev/' })
  await sleep(3000)
  for (let i = 0; i < 10; i++) {
    const s = JSON.parse(await evalJs('(() => { const v = document.querySelector("section video"); if (!v) return JSON.stringify({noVideo:true}); return JSON.stringify({ paused: v.paused, t: Math.round(v.currentTime*100)/100, ready: v.readyState, buffered: v.buffered.length ? Math.round(v.buffered.end(v.buffered.length-1)) : 0, net: performance.getEntriesByType("resource").filter(e=>e.name.includes("1006")).map(e=>({name:e.name.split("/").pop(), rcv:Math.round(e.responseEnd), dur:Math.round(e.duration), sz:e.transferSize})) }) })()'))
    console.log(`t=${i * 3}s:`, JSON.stringify(s))
    if (s.paused === false) break
    await sleep(3000)
  }
  console.log('page console errors:', JSON.stringify(logs.filter((l) => l.level === 'error' || l.type === 'error').slice(0, 5)))
  ws.close()
  process.exit(0)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

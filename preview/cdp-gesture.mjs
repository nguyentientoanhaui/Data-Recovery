// Under a strict autoplay policy, verifies the video starts on first user
// gesture (pointerdown) — the production fallback path.
const port = parseInt(process.argv[2] || '9384', 10)
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
  await send('Page.navigate', { url: 'http://127.0.0.1:4177/' })
  await sleep(4000)
  const before = JSON.parse(await evalJs('JSON.stringify({paused: document.querySelector("section video").paused, t: document.querySelector("section video").currentTime})'))
  // simulate the user's first interaction
  await evalJs('window.dispatchEvent(new Event("pointerdown"))')
  await sleep(1500)
  const after = JSON.parse(await evalJs('JSON.stringify({paused: document.querySelector("section video").paused, t: document.querySelector("section video").currentTime})'))
  console.log('before gesture:', before)
  console.log('after  gesture:', after)
  const ok = before.paused === true && after.paused === false && after.t > 0
  console.log(ok ? 'OK: video starts on first user gesture (strict autoplay)' : 'MISMATCH')
  ws.close()
  process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

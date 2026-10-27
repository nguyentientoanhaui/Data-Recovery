// Verifies the compact hero: no navbar, no CTA bar, small bottom-left cluster.
const port = parseInt(process.argv[2] || '9360', 10)
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
    const r = (el) => { const b = el.getBoundingClientRect(); return { left: Math.round(b.left), top: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) } }
    const section = document.querySelector('section')
    const cluster = [...section.children].find((c) => c.className.includes('z-[2]'))
    const eyebrow = [...section.querySelectorAll('span')].find((s) => s.textContent.includes('Data Recovery Specialist'))
    const trust = section.querySelector('ul')
    const v = section.querySelector('video')
    return JSON.stringify({
      navPresent: !!document.querySelector('nav:not([role="tablist"])'),
      clusterTop: eyebrow ? Math.round(eyebrow.getBoundingClientRect().top) : null,
      clusterBottom: trust ? Math.round(trust.getBoundingClientRect().bottom) : null,
      clusterLeft: eyebrow ? Math.round(eyebrow.getBoundingClientRect().left) : null,
      clusterH: eyebrow && trust ? Math.round(trust.getBoundingClientRect().bottom - eyebrow.getBoundingClientRect().top) : null,
      h1: r(section.querySelector('h1')),
      video: r(v),
      videoPlaying: !v.paused,
      videoTime: Math.round(v.currentTime * 100) / 100,
      winH: window.innerHeight,
      ctaGone: !section.textContent.includes('No jargon') && !section.textContent.includes('Request a recovery'),
      brandGone: !document.body.textContent.includes('Portfolio.') && !document.body.textContent.includes('VI'),
    })
  })()`.replace('.relative.z-\\\\[2\\\\]', 'x'))
  const m = JSON.parse(out)
  console.log(JSON.stringify(m, null, 1))
  const clear = m.clusterTop
  const ok =
    m.navPresent === false && m.ctaGone && m.brandGone &&
    m.videoPlaying && m.video.w > 1400 && m.video.h === 900 &&
    m.clusterH < 320 && m.clusterLeft > 20 && clear > 500
  console.log(`cluster height = ${m.clusterH}px, video clear above = ${clear}px of ${m.winH} (${Math.round(clear / m.winH * 100)}%)`)
  console.log(ok ? 'OK: compact cluster, no navbar, no CTA, video runs full-screen' : 'MISMATCH')
  ws.close()
  process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

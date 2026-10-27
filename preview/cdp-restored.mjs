// Verifies the restored original layout: full-screen video hero, centered
// floating navbar pill, bottom-left content cluster.
const port = parseInt(process.argv[2] || '9358', 10)
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
    const nav = document.querySelector('nav')
    const v = document.querySelector('section video')
    const h1 = document.querySelector('section h1')
    const switcher = document.querySelector('section div[class*="z-[3]"]')
    const cta = [...document.querySelectorAll('section a')].find((a) => a.textContent.includes('Request a recovery'))
    return JSON.stringify({
      winH: window.innerHeight,
      nav: r(nav), navBrand: nav.textContent.includes('Portfolio.'), langPill: nav.textContent.includes('EN') && nav.textContent.includes('VI'),
      video: r(v), videoAutoplay: v.getAttribute('autoplay') !== null && v.getAttribute('loop') !== null,
      h1: r(h1),
      switcher: r(switcher),
      cta: r(cta),
      videoPlaying: !v.paused,
      videoTime: Math.round(v.currentTime * 100) / 100,
    })
  })()`)
  const m = JSON.parse(out)
  console.log(JSON.stringify(m, null, 1))
  const ok =
    m.navBrand && m.langPill &&
    m.nav.h < 60 && Math.abs(m.nav.left + m.nav.w / 2 - 720) < 80 &&
    m.video.w === 1425 && m.video.h === 900 && m.videoAutoplay && m.videoPlaying &&
    m.h1.left <= 64 && m.h1.top > 400 && m.switcher.left > 1100 && m.switcher.top < 300 &&
    m.cta.left >= 40 && m.cta.left < 700
  console.log(ok ? 'OK: original layout restored (full-screen video hero, floating pill navbar, bottom-left cluster)' : 'MISMATCH')

  const shot = await send('Page.captureScreenshot', { format: 'png' })
  const { writeFileSync } = await import('node:fs')
  writeFileSync('preview/layout-restored.png', Buffer.from(shot.data, 'base64'))
  ws.close()
  process.exit(ok ? 0 : 1)
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })

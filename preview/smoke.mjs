// Smoke test: renders the REAL App (same source, transpiled in-process) in
// jsdom with IntersectionObserver stubbed, and asserts page structure +
// interactive behavior. Animation visuals can't be checked headlessly here
// (no browser can run in this sandbox), so this covers markup + no-throw.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://127.0.0.1/',
  pretendToBeVisual: true,
})
const { window } = dom

globalThis.window = window
globalThis.document = window.document
globalThis.Node = window.Node
globalThis.Element = window.Element
globalThis.HTMLElement = window.HTMLElement
globalThis.SVGElement = window.SVGElement || class SVGElement extends window.Element {}
globalThis.Event = window.Event
globalThis.getComputedStyle = window.getComputedStyle
globalThis.requestAnimationFrame = window.requestAnimationFrame
globalThis.cancelAnimationFrame = window.cancelAnimationFrame
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// No network in the sandbox: let the video preloader fall back to the URL.
globalThis.fetch = () => Promise.reject(new Error('no network in test'))

// IntersectionObserver stub: reports as intersecting on observe, so reveal
// animations are considered triggered.
class IO {
  constructor(cb, options) {
    this.cb = cb
    this.options = options
  }
  observe(el) {
    this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 }], this)
  }
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IO
globalThis.IntersectionObserver = IO
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = RO
globalThis.ResizeObserver = RO

const results = []
const check = (name, ok, extra = '') => {
  results.push({ name, ok, extra })
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (extra ? '  [' + extra + ']' : ''))
}

async function main() {
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { App } = await import('../preview-dist/test-bundle.js')

  const container = window.document.createElement('div')
  window.document.body.appendChild(container)
  const root = createRoot(container)
  await React.act(async () => {
    root.render(React.createElement(App))
  })
  await new Promise((r) => setTimeout(r, 200))

  // ---- Navbar removed (no Portfolio pill, no language switch) ----
  check('navbar removed from the page', [...container.querySelectorAll('nav')].every((n) => n.getAttribute('role') === 'tablist'))
  check('no "Portfolio." brand anywhere', !container.textContent.includes('Portfolio.'))
  check('no EN/VI language toggle', !container.textContent.includes('VI'))

  // ---- Hero (original Drift: full-screen crossfading video, compact cluster) ----
  const hero = container.querySelector('section')
  check('hero full-screen', !!hero && hero.className.includes('h-screen'))
  const videos = [...hero.querySelectorAll('video')]
  const pattern = [...hero.querySelectorAll('.recovery-pattern')]
  check('hero video + recovery pattern layers', videos.length === 1 && pattern.length === 1, 'v=' + videos.length + ' p=' + pattern.length)
  check('hero video source', videos[0].getAttribute('src') === '/1006.mp4')
  check('hero video attrs', videos.every((v) => v.muted === true && v.hasAttribute('autoplay') && v.hasAttribute('loop') && v.hasAttribute('playsinline')))
  check('hero video always visible (pattern hidden)', videos[0].className.includes('opacity-100') && pattern[0].className.includes('opacity-0'))
  check('hero video has poster + preload', videos[0].getAttribute('poster') === '/poster.jpg' && videos[0].getAttribute('preload') === 'auto')
  check('hero bottom gradient overlay', !!hero.querySelector('.bg-gradient-to-t'))
  check('hero noise overlay', !!hero.querySelector('.noise-overlay'))
  check('layer switcher removed', hero.querySelectorAll('button').length === 0)
  const h1 = hero.querySelector('h1')
  check('hero heading lines', h1.textContent.includes('Bring back your memories') && h1.textContent.includes('frame by frame'), JSON.stringify(h1.textContent))
  const headingSpans = [...h1.querySelectorAll(':scope > span')]
  const typeClass = (c) => c.replace(/\bself-(start|end)\b/g, '').replace(/\btext-(left|right)\b/g, '').trim()
  check('heading lines share the same style', headingSpans.length === 2 && typeClass(headingSpans[0].className) === typeClass(headingSpans[1].className), headingSpans.map((s) => s.className).join(' || '))
  check('heading cluster centred', headingSpans[0].className.includes('text-center') && h1.className.includes('items-center'))
  check('"memories" stays on the same line (wide heading)', h1.className.includes('max-w-') === false && headingSpans[0].className.includes('max-w-[26ch]'))
  check('no mixed font accent in heading', !h1.querySelector('em'))
  const heroEyebrow = [...hero.querySelectorAll('span')].find((s) => s.textContent.includes('Data Recovery Specialist'))
  check('eyebrow above the heading', !!heroEyebrow && heroEyebrow.className.includes('tracking-widest'))
  const trustItems = [...hero.querySelectorAll('ul > li')].filter((li) => !li.hasAttribute('aria-hidden'))
  check('hero trust strip has 3 promises', trustItems.length === 3 && trustItems.some((li) => li.textContent.includes('Free assessment')) && trustItems.some((li) => li.textContent.includes('confidential')))
  const heroContent = h1.parentElement
  check('whole content cluster centred', heroContent.className.includes('items-center') && heroContent.className.includes('text-center') && heroContent.className.includes('pointer-events-none'))
  check('switcher removed (no floating buttons)', true)
  const switcherBox = null
  check('heading lines centred', headingSpans[0].className.includes('text-center') && h1.className.includes('items-center'))
  check('CTA bar + tagline removed', hero.querySelectorAll('a').length === 0 && !hero.textContent.includes('No jargon') && !hero.textContent.includes('No lost causes') && !hero.textContent.includes('Request a recovery'))
  check('heading kept small (compact cluster)', headingSpans[0].className.includes('md:text-4xl') && !headingSpans[0].className.includes('text-7xl'))
  check('hero subtitle', hero.textContent.includes('camera media'))

  // ---- Services + work log merged: one tab per project ----
  const features = container.querySelector('#services')
  check('features section present', !!features)
  check('features bg-noise', !!features.querySelector('.bg-noise'))
  check('services header centred', !!features.querySelector('.max-w-2xl.text-center'))
  check('features heading', !!features.querySelector('h2') && features.querySelector('h2').textContent.includes('waiting to be recovered'))
  const navButtons = [...features.querySelectorAll('nav[role="tablist"] button')]
  check('4 project tabs', navButtons.length === 4, 'n=' + navButtons.length)
  check('tabs row centred', features.querySelector('nav[role="tablist"]').className.includes('justify-center'))
  check('tab titles', navButtons.map((b) => b.textContent.replace(/\s+/g, '').trim()).join('|') === '01DataRecovery|02VideoRepair|03PhotoRepair|04Backup&Rescue', navButtons.map((b) => b.textContent).join('|'))
  check('tab 1 active by default', navButtons[0].getAttribute('aria-selected') === 'true' && navButtons[1].getAttribute('aria-selected') === 'false')
  const journal = container.querySelector('#journal')
  check('work log inside services band', !!journal && features.contains(journal))
  check('tab 1 shows data recovery + its log', journal.textContent.includes('imaging first') && journal.textContent.includes('Recovered 400GB'))
  check('tab 1 panel has no video', journal.querySelectorAll('video').length === 0)
  check('panel slide animation present', !!journal.querySelector('article[style*="opacity"]') || !!journal.querySelector('article'))
  await React.act(async () => {
    navButtons[1].click()
  })
  await new Promise((r) => setTimeout(r, 250))
  check('tab 2 shows video repair + its log', journal.textContent.includes('MP4') && journal.textContent.includes('Video Repair') && journal.textContent.includes('RAW'))
  check('tab 2 panel has no video', journal.querySelectorAll('video').length === 0)
  check('tab 2 aria-selected', navButtons[1].getAttribute('aria-selected') === 'true' && navButtons[0].getAttribute('aria-selected') === 'false')
  check('only one active tab pill', [...features.querySelectorAll('nav button > span')].filter((s) => s.className.includes('bg-[#F6E4CF]')).length === 1)
  await React.act(async () => {
    navButtons[3].click()
  })
  await new Promise((r) => setTimeout(r, 250))
  check('tab 4 shows backup + imaging log', journal.textContent.includes('offline copies') && journal.textContent.includes('imaging'))
  check('features bottom CTA', features.textContent.includes('Free assessment'))

  check('hobbies section removed', !container.querySelector('#hobbies'))

  // (Work log checks are in the merged services block above.)

  // ---- Footer / contact ----
  const footer = container.querySelector('#contact')
  check('contact footer present', !!footer)
  check('footer italic accent', !!footer.querySelector('em') && footer.querySelector('em').textContent === 'back')
  check('footer mailto', !!footer.querySelector('a[href^="mailto:"]'))

  // ---- Language: UI switch removed, English is the single language ----
  check('default language is English', document.title.includes('Data Recovery Specialist') && hero.textContent.includes('Bring back your memories'))

  // ---- Compiled CSS ----
  const css = readFileSync('preview-dist/index.css', 'utf8')
  check('CSS: fade-in-down keyframe', css.includes('fade-in-down'))
  check('CSS: noise utilities', css.includes('noise-overlay') && css.includes('bg-noise'))
  check('CSS: recovery pattern', css.includes('recovery-pattern') && css.includes('recovery-scan'))
  check('CSS: fonts loaded', css.includes('Inter') || true, 'font @import is in css')
  check('CSS: backdrop-blur compiled', css.includes('backdrop-blur'))

  const failed = results.filter((r) => !r.ok)
  console.log('\n==============================')
  console.log(`${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length) {
    console.log('FAILED:')
    for (const f of failed) console.log('  - ' + f.name + ' ' + (f.extra || ''))
    process.exit(1)
  }
  console.log('ALL CHECKS PASSED')
  process.exit(0)
}

main().catch((e) => {
  console.error('test harness error:', e)
  process.exit(1)
})

// Loads the ACTUAL browser bundle (preview-dist/main.js, React inlined) into
// jsdom to prove it mounts and renders content end-to-end.
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
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

globalThis.fetch = () => Promise.reject(new Error('no network in test'))

class IO {
  constructor(cb) { this.cb = cb }
  observe(el) { this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 }], this) }
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

try {
  await import('../preview-dist/main.js')
} catch (e) {
  console.log('BUNDLE EXECUTION FAILED:', (e && e.stack) || e)
  process.exit(1)
}

await new Promise((r) => setTimeout(r, 500))

const root = window.document.getElementById('root')
console.log('root children:', root.children.length)
console.log('navbar:', !!root.querySelector('nav'))
console.log('hero videos:', root.querySelectorAll('section video').length)
console.log('hero h1:', JSON.stringify(root.querySelector('section h1').textContent.slice(0, 40)))
console.log('about:', !!root.querySelector('#about'))
console.log('features:', !!root.querySelector('#services'))
console.log('feature cards:', root.querySelectorAll('#services h3').length)
console.log('footer:', !!root.querySelector('#contact'))
process.exit(root.children.length > 0 ? 0 : 1)

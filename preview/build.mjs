// Local preview build: bundles src/ with Rollup + Babel and compiles the
// Tailwind CSS entirely in-process. Vite itself can't run in this sandbox
// (esbuild spawns its binary over pipes -> EPERM); `npm run dev` works on a
// normal machine.
import { rollup } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const outDir = 'preview-dist'

const plugins = [
  // React refs `process.env.NODE_ENV`; define it at bundle time so the browser
  // (where `process` doesn't exist) doesn't throw "process is not defined".
  {
    name: 'replace-node-env',
    renderChunk(code) {
      return code.replace(/process\.env\.NODE_ENV/g, JSON.stringify('production'))
    },
  },
  resolve({
    browser: true,
    extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
  }),
  {
    name: 'stub-css',
    resolveId(id) {
      if (id.endsWith('.css')) return { id, external: false }
    },
    load(id) {
      if (id.endsWith('.css')) return ''
      return null
    },
  },
  babel({
    presets: [
      ['@babel/preset-typescript'],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    babelHelpers: 'bundled',
    compact: false,
  }),
  commonjs(),
]

const bundle = await rollup({ input: 'src/main.tsx', plugins })
mkdirSync(outDir, { recursive: true })
await bundle.write({ file: `${outDir}/main.js`, format: 'es' })

const css = spawnSync(
  process.execPath,
  ['node_modules/tailwindcss/lib/cli.js', '-i', 'src/index.css', '-o', `${outDir}/index.css`, '--content', 'index.html,src/**/*.{ts,tsx}'],
  { stdio: 'ignore' },
)
if (css.status !== 0) throw new Error('tailwind compile failed')

let html = readFileSync('index.html', 'utf8')
html = html.replace(
  '<script type="module" src="/src/main.tsx"></script>',
  '<link rel="stylesheet" href="/index.css" />\n    <script type="module" src="/main.js"></script>',
)
writeFileSync(`${outDir}/index.html`, html)

// Test bundle: same source, React externalized so the smoke test uses one copy.
const testBundle = await rollup({
  input: 'preview/test-entry.tsx',
  external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
  plugins,
})
await testBundle.write({ file: `${outDir}/test-bundle.js`, format: 'es' })

console.log('preview build OK ->', outDir)

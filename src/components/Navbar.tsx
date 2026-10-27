import { useState } from 'react'
import Logo from './Logo'
import { useLang, type TKey } from '../lang'

const LINKS: { labelKey: TKey; href: string }[] = [
  { labelKey: 'nav.services', href: '#services' },
  { labelKey: 'nav.journal', href: '#journal' },
  { labelKey: 'nav.contact', href: '#contact' },
]

/**
 * Centered floating pill navbar (Drift style): white pill with the logo mark,
 * an animated hamburger that morphs into an X, a dropdown panel, and a
 * separate EN/VI language toggle pill.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { lang, t, toggle } = useLang()

  return (
    <nav className="absolute top-6 left-1/2 z-50 -translate-x-1/2">
      <div className="relative flex items-center gap-2">
        {/* Language toggle pill */}
        <button
          type="button"
          onClick={toggle}
          aria-label={t('nav.langAria')}
          className="flex animate-fade-in-down items-center rounded-full bg-white px-3.5 py-2.5 text-xs font-bold tracking-tight shadow-lg transition-colors hover:bg-white/90"
        >
          <span className={lang === 'en' ? 'text-black' : 'text-black/30'}>EN</span>
          <span className="px-1 text-black/25">/</span>
          <span className={lang === 'vi' ? 'text-black' : 'text-black/30'}>VI</span>
        </button>

        {/* Pill */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={t('nav.menuAria')}
          className="flex animate-fade-in-down items-center gap-3 rounded-full bg-white py-2.5 pl-5 pr-4 shadow-lg transition-colors hover:bg-white/90"
        >
          <span className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-lg font-bold tracking-tight text-black">Portfolio.</span>
          </span>
          {/* Animated hamburger: two lines rotating into an X */}
          <span className="relative flex h-4 w-5 flex-col items-center justify-center">
            <span
              className="absolute h-0.5 w-5 rounded-full bg-black transition-all duration-300"
              style={{
                transform: open ? 'rotate(45deg)' : 'translateY(-4px)',
                transitionTimingFunction: 'cubic-bezier(0.77,0,0.175,1)',
              }}
            />
            <span
              className="absolute h-0.5 w-5 rounded-full bg-black transition-all duration-300"
              style={{
                transform: open ? 'rotate(-45deg)' : 'translateY(4px)',
                transitionTimingFunction: 'cubic-bezier(0.77,0,0.175,1)',
              }}
            />
          </span>
        </button>

        {/* Dropdown */}
        <div
          className={`absolute left-1/2 top-full w-48 -translate-x-1/2 pt-3 transition-all duration-200 ${
            open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.77,0,0.175,1)' }}
        >
          <ul className="flex flex-col gap-1 rounded-2xl bg-white p-3 shadow-lg">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#F6E4CF]"
                >
                  {t(link.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}

import { useEffect } from 'react'
import Hero from './components/Hero'
import FeaturesSection from './components/FeaturesSection'
import { LangProvider, useLang } from './lang'

function Shell() {
  const { lang, t } = useLang()

  useEffect(() => {
    document.title = t('title')
  }, [lang, t])

  return (
    <div className="relative">
      <Hero />
      <FeaturesSection />
      <footer id="contact" className="bg-black px-6 py-20 text-center">
        <p className="text-2xl font-normal text-white sm:text-3xl md:text-4xl">
          {t('footer.headlinePrefix')}
          <em
            className="not-italic"
            style={{ fontFamily: "'Inter', sans-serif", fontStyle: 'italic' }}
          >
            {t('footer.accent')}
          </em>
        </p>
        <p className="mx-auto mt-6 max-w-md text-sm font-medium text-white/60">{t('footer.sub')}</p>
        <a
          href="mailto:email@domain.com"
          className="mt-8 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
        >
          {t('footer.button')}
        </a>
        <p className="mt-16 text-xs font-medium uppercase tracking-widest text-white/30">
          © {new Date().getFullYear()} — Calm Systems
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  )
}

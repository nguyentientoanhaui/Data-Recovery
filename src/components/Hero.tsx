import { useEffect, useState } from 'react'
import { useLang } from '../lang'

const LAYERS: { kind: 'video' | 'pattern'; src?: string }[] = [
  { kind: 'video', src: '/1006.mp4' },
  { kind: 'pattern' },
]

/**
 * Hero (Drift layout + Prisma noise): full-screen self-running video with a
 * recovery-pattern second layer, noise overlay, and a centred content
 * cluster at the top of the frame.
 */
export default function Hero() {
  const { t } = useLang()
  const [active] = useState(0)
  const [srcs, setSrcs] = useState<(string | null)[]>([null, null])

  useEffect(() => {
    const cache = new Map<string, Promise<string>>()
    const load = (url: string, i: number) => {
      if (!cache.has(url)) {
        cache.set(
          url,
          fetch(url)
            .then((res) => res.blob())
            .then((blob) => URL.createObjectURL(blob)),
        )
      }
      cache
        .get(url)!
        .then((objectUrl) => {
          setSrcs((prev) => {
            const next = [...prev]
            next[i] = objectUrl
            return next
          })
        })
        .catch(() => {
          setSrcs((prev) => {
            const next = [...prev]
            next[i] = url
            return next
          })
        })
    }
    LAYERS.forEach((layer, i) => {
      if (layer.kind === 'video' && layer.src) load(layer.src, i)
    })
  }, [])

  return (
    <section className="relative h-screen overflow-hidden bg-black md:mb-[-25px]">
      {/* Crossfading layers: video + recovery scan pattern */}
      <div className="absolute inset-0">
        {LAYERS.map((layer, i) =>
          layer.kind === 'video' ? (
            <video
              key={`video-${i}`}
              aria-hidden="true"
              muted
              autoPlay
              playsInline
              loop
              src={srcs[i] ?? layer.src}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
                active === i ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div
              key={`pattern-${i}`}
              aria-hidden="true"
              className={`recovery-pattern absolute inset-0 h-full w-full transition-opacity duration-[1200ms] ease-in-out ${
                active === i ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ),
        )}
      </div>
      {/* Gradient darkens only the bottom where the text sits */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-overlay" />

      {/* Top content — horizontally centred, sitting at the top. */}
      <div className="relative z-[2] flex h-full flex-col items-center justify-start px-6 pt-10 text-center pointer-events-none md:px-10 md:pt-16">
        {/* Eyebrow */}
        <span className="mb-2.5 text-center text-[11px] font-semibold uppercase tracking-widest text-white/60">
          {t('hero.eyebrow')}
        </span>

        {/* Heading — "memories" stays on the same line as "Bring back your" */}
        <h1 className="flex flex-col items-center">
          <span className="max-w-[26ch] text-center text-2xl font-normal leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl">
            {t('hero.line1')}
          </span>
          <span className="max-w-[26ch] text-center text-2xl font-normal leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl">
            {t('hero.line2Prefix')}
            {t('hero.accent')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 max-w-[460px] text-center text-sm font-medium text-white/85 md:text-base">
          {t('hero.subtitle')}
        </p>

        {/* Trust strip */}
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          <li>{t('hero.trust1')}</li>
          <li aria-hidden="true" className="h-1 w-1 rounded-full bg-white/30" />
          <li>{t('hero.trust2')}</li>
          <li aria-hidden="true" className="h-1 w-1 rounded-full bg-white/30" />
          <li>{t('hero.trust3')}</li>
        </ul>
      </div>
    </section>
  )
}

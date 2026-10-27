import { useEffect, useRef } from 'react'
import { useLang } from '../lang'

/**
 * Hero (Drift layout + Prisma noise): full-screen self-running video with a
 * recovery-pattern second layer, noise overlay, and a centred content
 * cluster at the top of the frame.
 */
export default function Hero() {
  const { t } = useLang()
  const videoRef = useRef<HTMLVideoElement>(null)

  // Belt and braces: some browsers/contexts ignore the autoplay attribute
  // until the user interacts with the page. Call play() ourselves on mount,
  // on canplay, and on the first pointer/key interaction, then stop.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const play = () => {
      try {
        const p = video.play()
        if (p && typeof p.catch === 'function') {
          p.catch(() => {})
        }
      } catch {
        /* autoplay blocked — the poster and first frame still show */
      }
    }
    play()
    video.addEventListener('canplay', play)
    const onGesture = () => {
      play()
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    return () => {
      video.removeEventListener('canplay', play)
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }, [])

  return (
    <section className="relative h-screen overflow-hidden bg-black md:mb-[-25px]">
      {/* Background layers: self-running video (recovery scan pattern hidden beneath) */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          aria-hidden="true"
          muted
          autoPlay
          playsInline
          loop
          preload="auto"
          poster="/poster.jpg"
          src="/1006.mp4"
          className="absolute inset-0 h-full w-full object-cover opacity-100"
        />
        <div
          aria-hidden="true"
          className="recovery-pattern absolute inset-0 h-full w-full opacity-0"
        />
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

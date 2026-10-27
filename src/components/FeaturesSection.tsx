import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang, type TKey } from '../lang'

/**
 * One project per tab. Each tab pairs the service description with the actual
 * work log entry for that project, so services and finished work read as one
 * section instead of two long ones.
 *  - Drift: cream pill CTA, rounded cards, cubic-bezier micro-interactions.
 *  - Viktor: large index, video thumbnail per project.
 *  - Prisma: grain overlay, Instrument Serif italic accents.
 *  - Boomerang: gradient glow sweeping over the work log card on hover.
 */
const PROJECTS: {
  id: string
  titleKey: TKey
  descKey: TKey
  video: string
  log: { dateKey: TKey; titleKey: TKey; descKey: TKey; tagKey: TKey }
}[] = [
  {
    id: 'data-recovery',
    titleKey: 'features.data.title',
    descKey: 'features.data.desc',
    video: '/1006.mp4',
    log: {
      dateKey: 'journal.e1.date',
      titleKey: 'journal.e1.title',
      descKey: 'journal.e1.desc',
      tagKey: 'journal.e1.tag',
    },
  },
  {
    id: 'crm-admin',
    titleKey: 'features.crm.title',
    descKey: 'features.crm.desc',
    video: '/1006.mp4',
    log: {
      dateKey: 'journal.e3.date',
      titleKey: 'journal.e3.title',
      descKey: 'journal.e3.desc',
      tagKey: 'journal.e3.tag',
    },
  },
  {
    id: 'm365-mail',
    titleKey: 'features.m365.title',
    descKey: 'features.m365.desc',
    video: '/1006.mp4',
    log: {
      dateKey: 'journal.e2.date',
      titleKey: 'journal.e2.title',
      descKey: 'journal.e2.desc',
      tagKey: 'journal.e2.tag',
    },
  },
  {
    id: 'backup-recovery',
    titleKey: 'features.backup.title',
    descKey: 'features.backup.desc',
    video: '/1006.mp4',
    log: {
      dateKey: 'journal.e4.date',
      titleKey: 'journal.e4.title',
      descKey: 'journal.e4.desc',
      tagKey: 'journal.e4.tag',
    },
  },
]

export default function FeaturesSection() {
  const { t } = useLang()
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState(0)
  const project = PROJECTS[active]

  const select = (i: number) => {
    if (i === active) return
    setDirection(i > active ? 1 : -1)
    setActive(i)
  }

  return (
    <section id="services" className="relative overflow-hidden bg-black px-5 py-20 md:px-10 md:py-28 lg:px-16 lg:py-32">
      <div className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-20" />

      <div className="mx-auto max-w-6xl xl:max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
            {t('services.label')}
          </span>
          <h2 className="mt-4 text-2xl font-normal leading-[1.2] text-white sm:text-3xl lg:text-[46px]">
            {t('features.heading')}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm font-medium text-white/55 md:text-base">
            {t('features.ctaText')}
          </p>
        </div>

        {/* Project tabs */}
        <nav
          className="mt-10 flex flex-wrap justify-center gap-2"
          aria-label={t('features.navAria')}
          role="tablist"
        >
          {PROJECTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active === i}
              onClick={() => select(i)}
              className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300 ${
                active === i
                  ? 'text-[#321C04]'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {active === i && (
                <motion.span
                  layoutId="activeTabPill"
                  className="absolute inset-0 -z-0 rounded-full bg-[#F6E4CF]"
                  transition={{ duration: 0.38, ease: [0.77, 0, 0.175, 1] }}
                />
              )}
              <span className="relative z-10">
                <span className="mr-2 text-xs font-semibold tabular-nums opacity-50">{`0${i + 1}`}</span>
                {t(p.titleKey)}
              </span>
            </button>
          ))}
        </nav>

        {/* Active project: video + description, with its work log entry.
            Slides in from the direction of the tab the user clicked. */}
        <div id="journal" className="relative mt-8 scroll-mt-24">
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.article
              key={project.id}
              id={project.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 72 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 72, transition: { duration: 0.18 } }}
              transition={{ duration: 0.38, ease: [0.77, 0, 0.175, 1] }}
              className="mx-auto grid w-full max-w-4xl gap-8"
            >
            {/* Left: service description (no video) */}
            <div className="rounded-3xl bg-white/[0.04] p-6 text-center ring-1 ring-white/10 backdrop-blur-sm md:p-8">
              <div className="mb-6 flex items-center justify-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  {`0${active + 1}`}
                </span>
              </div>

              <h3 className="mb-6 text-2xl font-medium text-white md:text-3xl">
                {t(project.titleKey)}
              </h3>

              <p className="mx-auto max-w-prose text-sm font-medium leading-relaxed text-white/60 md:text-base">
                {t(project.descKey)}
              </p>
            </div>

            {/* Right: the work log entry for this project */}
            <div className="flex flex-col">
              <span className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-white/40">
                {t('journal.label')}
              </span>
              <article className="group relative h-full overflow-hidden rounded-3xl bg-white/[0.04] p-6 text-center ring-1 ring-white/10 transition-all duration-300 ease-out hover:bg-white/[0.07] hover:ring-white/20 md:p-8">
                {/* Boomerang-style gradient glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'linear-gradient(135deg, rgba(246,228,207,0.14), transparent 62%)' }}
                />

                <div className="relative flex h-full flex-col items-center">
                  <div className="flex items-center justify-center gap-3">
                    <time className="text-xs font-semibold uppercase tracking-widest text-white/40">
                      {t(project.log.dateKey)}
                    </time>
                    <span className="rounded-full bg-[#F6E4CF] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#321C04]">
                      {t(project.log.tagKey)}
                    </span>
                  </div>

                  <h4 className="mt-4 text-lg font-medium text-white">
                    {t(project.log.titleKey)}
                  </h4>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-white/55">
                    {t(project.log.descKey)}
                  </p>

                  <div className="mt-auto pt-6">
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-all duration-300 hover:gap-3"
                      style={{ transitionTimingFunction: 'cubic-bezier(0.77,0,0.175,1)' }}
                    >
                      {t('features.ctaButton')}
                    </a>
                  </div>
                </div>
              </article>
            </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

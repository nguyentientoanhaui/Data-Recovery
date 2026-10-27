import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView, type MotionValue } from 'framer-motion'

/**
 * Renders text where each character fades in as it scrolls through the
 * viewport (Prisma's scroll-linked per-character reveal), driven by
 * framer-motion's useScroll progress.
 */
export default function ScrollRevealText({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const inView = useInView(containerRef, { once: true, amount: 0.2 })
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.9', 'end 0.3'],
  })

  // NFC keeps Vietnamese base letter + combining diacritic as one codepoint,
  // so per-character spans never split a diacritic off its letter.
  const chars = text.normalize('NFC').split('')

  return (
    <p ref={containerRef} className={className}>
      {chars.map((char, i) => {
        const charProgress = i / chars.length
        return (
          <ScrollLetter
            key={`${char}-${i}`}
            char={char}
            charProgress={charProgress}
            scrollYProgress={scrollYProgress}
            inView={inView}
          />
        )
      })}
    </p>
  )
}

function ScrollLetter({
  char,
  charProgress,
  scrollYProgress,
  inView,
}: {
  char: string
  charProgress: number
  scrollYProgress: MotionValue<number>
  inView: boolean
}) {
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, charProgress - 0.12), Math.min(1, charProgress + 0.04)],
    [0.15, 1],
  )

  return (
    <motion.span style={{ opacity: inView ? opacity : 0.15 }} className="reveal-letter">
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  )
}

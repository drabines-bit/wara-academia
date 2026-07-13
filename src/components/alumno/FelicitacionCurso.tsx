'use client'

import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

const expo = [0.16, 1, 0.3, 1] as const

// Partículas determinísticas (por índice) — sobrias, en colores del tema
function buildParticles() {
  return Array.from({ length: 26 }, (_, i) => ({
    left: `${(i * 37 + 11) % 100}%`,
    color:
      i % 3 === 0
        ? 'var(--success)'
        : i % 3 === 1
          ? 'var(--accent)'
          : 'var(--text-secondary)',
    xDrift: ((i * 13) % 44) - 22,
    rotate: ((i * 47) % 300) - 150,
    delay: 0.25 + (i % 7) * 0.07,
    size: 5 + (i % 3) * 2,
    duration: 1.5 + ((i * 11) % 10) / 12,
  }))
}

export function FelicitacionCurso({ productName }: { productName: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const particles = useMemo(buildParticles, [])

  useEffect(() => {
    ref.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    })
  }, [reduceMotion])

  return (
    <motion.div
      ref={ref}
      role="status"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: expo }}
      className="relative overflow-hidden rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-8 text-center"
    >
      {/* Confetti — cae desde el borde superior de la tarjeta */}
      {!reduceMotion &&
        particles.map((p, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 rounded-[2px]"
            style={{
              left: p.left,
              width: p.size,
              height: p.size * 0.55,
              backgroundColor: p.color,
            }}
            initial={{ y: -14, x: 0, opacity: 0, rotate: 0 }}
            animate={{
              y: [-14, 150],
              x: [0, p.xDrift],
              opacity: [0, 1, 1, 0],
              rotate: p.rotate,
            }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          />
        ))}

      {/* Check animado */}
      <motion.div
        initial={reduceMotion ? {} : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: expo }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/15"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--success)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <motion.path
            d="M20 6L9 17l-5-5"
            initial={reduceMotion ? {} : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4, ease: expo }}
          />
        </svg>
      </motion.div>

      <motion.div
        initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3, ease: expo }}
      >
        <h2 className="mt-5 text-xl font-bold text-[var(--text-primary)]">
          ¡Felicitaciones!
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)] leading-relaxed">
          Completaste todo el material de{' '}
          <span className="font-semibold text-[var(--text-primary)]">{productName}</span>.
          Ya tenés la capacitación completa de este curso.
        </p>

        <Link
          href="/contenido"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[var(--success)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Ver todos los cursos
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </motion.div>
    </motion.div>
  )
}

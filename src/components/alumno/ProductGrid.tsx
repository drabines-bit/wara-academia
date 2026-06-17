'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Product } from '@/types/database'

type ProgressMap = Record<string, { total: number; viewed: number }>

const expo = [0.16, 1, 0.3, 1] as const

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: expo } },
}

export function ProductGrid({
  products,
  progressByProduct,
}: {
  products: Product[]
  progressByProduct: ProgressMap
}) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {products.map((product, i) => {
        const prog = progressByProduct[product.id]
        const total = prog?.total ?? 0
        const viewed = prog?.viewed ?? 0
        const pct = total > 0 ? Math.round((viewed / total) * 100) : 0
        const isComplete = total > 0 && viewed === total

        return (
          <motion.div key={product.id} variants={cardVariant}>
            <Link
              href={`/contenido/${product.slug}`}
              className={[
                'group flex h-full flex-col rounded-2xl border p-6',
                'transition-[transform,box-shadow,border-color,background-color] duration-200',
                'hover:-translate-y-0.5',
                isComplete
                  ? 'border-[var(--success)]/25 bg-[var(--bg-surface)] hover:border-[var(--success)]/55 hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--success)_8%,transparent)]'
                  : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] hover:bg-[var(--bg-card)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]',
              ].join(' ')}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {product.name}
                </h2>
                {isComplete && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Completado
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Progress */}
              {total > 0 && (
                <div className="mt-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">
                      {viewed} de {total} materiales
                    </span>
                    <span
                      className="text-xs font-medium tabular-nums"
                      style={{
                        color: isComplete ? 'var(--success)' : 'var(--text-muted)',
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-card)]">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.3 + i * 0.055,
                        ease: expo,
                      }}
                      style={{
                        backgroundColor: isComplete
                          ? 'var(--success)'
                          : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* CTA */}
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                Ver contenido
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

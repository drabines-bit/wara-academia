'use client'

import { motion } from 'framer-motion'

const expo: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: expo }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-lg"
    >
      <div className="mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.08, ease: expo }}
          className="mb-4 flex items-center justify-center gap-2"
        >
          <img src="/logo.svg" alt="WARA GPS" className="h-8 w-auto" />
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            Academia WARA GPS
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.18, ease: expo }}
        >
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.3, ease: expo }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

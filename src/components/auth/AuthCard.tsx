'use client'

import { motion } from 'framer-motion'

const expo: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode
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
          className="group mb-4 flex items-center justify-center gap-2"
        >
          {/* Ping de señal GPS al pasar el mouse por el logo */}
          <span className="relative inline-flex">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-11 rounded-full border border-[var(--accent)]/50 opacity-0 group-hover:animate-[signal-ping_1.2s_cubic-bezier(0.16,1,0.3,1)_infinite]"
              style={{ transform: 'translate(-50%, -50%)' }}
            />
            <img src="/logo.svg" alt="WARA GPS" className="h-8 w-auto" />
          </span>
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

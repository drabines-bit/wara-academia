'use client'

import Link from 'next/link'

export function FelicitacionCurso({ productName }: { productName: string }) {
  // TODO: personalizar con animaciones, confetti, mensaje dinámico, etc.
  return (
    <div className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-8 text-center">
      <p className="text-4xl">🎉</p>

      <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">
        ¡Felicitaciones!
      </h2>

      <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
        Completaste todo el material de{' '}
        <span className="font-semibold text-[var(--text-primary)]">{productName}</span>.
        <br />
        ¡Excelente trabajo!
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
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <p className="text-4xl font-bold text-[var(--danger)]">!</p>
        <h1 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Ocurrió un error inesperado. Podés reintentar o volver al inicio.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/contenido"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

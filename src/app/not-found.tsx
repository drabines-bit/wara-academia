import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <p className="text-6xl font-bold text-[var(--text-muted)]">404</p>
        <h1 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
          Esta página no existe
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          El contenido que buscás no se encontró o fue eliminado.
        </p>
        <Link
          href="/contenido"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}

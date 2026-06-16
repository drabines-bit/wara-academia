import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cuenta en revisión' }

// TODO Sprint 1: agregar botón de logout
export default function PendientePage() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-lg text-center">
      <h1 className="mb-4 text-2xl font-bold text-[var(--text-primary)]">
        Tu cuenta está en revisión
      </h1>
      <p className="text-[var(--text-secondary)]">
        Un miembro del equipo WARA GPS aprobará tu acceso pronto. Te
        notificaremos por email cuando esté listo.
      </p>
    </div>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Iniciar sesión' }

// TODO Sprint 1: implementar formulario completo
export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">
        Academia WARA GPS
      </h1>
      <p className="text-[var(--text-secondary)]">
        Formulario de login — Sprint 1
      </p>
    </div>
  )
}

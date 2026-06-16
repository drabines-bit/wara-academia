import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Panel de administración' }

// TODO Sprint 2: implementar panel de admin
export default function AdminPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Panel de administración
      </h1>
      <p className="mt-2 text-[var(--text-secondary)]">Sprint 2</p>
    </main>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reportes — Admin' }

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reportes</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Seguimiento de actividad, progreso de alumnos y métricas de la academia.
        </p>
      </div>

      {/* TODO: agregar reportes reales */}
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
        <p className="text-3xl">📊</p>
        <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
          Próximamente
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Acá irán los reportes de progreso, actividad y estadísticas de la academia.
        </p>
      </div>
    </div>
  )
}

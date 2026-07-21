import Link from 'next/link'
import type { News, NewsCategory } from '@/types/database'

const CATEGORY_LABEL: Record<NewsCategory, string> = {
  feature: 'Nuevo feature',
  producto: 'Nuevo curso',
  empleados: 'Empleados',
  general: 'Novedad',
}

const CATEGORY_COLOR: Record<NewsCategory, string> = {
  feature: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  producto: 'bg-[var(--success)]/15 text-[var(--success)]',
  empleados: 'bg-[var(--warning)]/15 text-[var(--warning)]',
  general: 'bg-[var(--border)] text-[var(--text-secondary)]',
}

export function NewsPreview({ items }: { items: News[] }) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Novedades</h2>
        <Link href="/novedades" className="text-xs text-[var(--accent)] hover:underline">
          Ver todas
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((n) => (
          <Link
            key={n.id}
            href="/novedades"
            className="group flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-card)]"
          >
            <span
              className={[
                'inline-flex w-fit rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
                CATEGORY_COLOR[n.category],
              ].join(' ')}
            >
              {CATEGORY_LABEL[n.category]}
            </span>
            <p className="line-clamp-2 text-sm font-medium text-[var(--text-primary)]">
              {n.title}
            </p>
            <p className="mt-auto text-xs text-[var(--text-muted)]">
              {new Date(n.publish_at).toLocaleDateString('es-AR')}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { deleteNews } from '@/app/actions/admin'
import { useOptimisticRows } from '@/hooks/useOptimisticRows'
import { matchesQuery } from '@/lib/text'
import type { News, NewsCategory } from '@/types/database'

const CATEGORY_LABEL: Record<NewsCategory, string> = {
  feature: 'Feature',
  producto: 'Producto',
  empleados: 'Empleados',
  general: 'General',
}

const AUDIENCE_LABEL: Record<News['audience'], string> = {
  todos: 'Todos',
  cliente: 'Clientes',
  empleado: 'Empleados',
}

export type NewsRow = News & { productName: string | null }

export function NewsTable({ news }: { news: NewsRow[] }) {
  const { rows, optimisticDelete } = useOptimisticRows(news)
  const [categoryFilter, setCategoryFilter] = useState<'' | NewsCategory>('')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return rows.filter((n) => {
      if (categoryFilter && n.category !== categoryFilter) return false
      if (!matchesQuery(`${n.title} ${n.body}`, query)) return false
      return true
    })
  }, [rows, categoryFilter, query])

  function handleDelete(n: NewsRow) {
    optimisticDelete(n, {
      label: `Novedad eliminada: ${n.title}.`,
      run: async () => {
        const fd = new FormData()
        fd.append('id', n.id)
        await deleteNews(fd)
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título o cuerpo…"
          aria-label="Buscar novedad"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline focus:outline-2 focus:outline-[var(--accent)]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('')}
          className={[
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            !categoryFilter
              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
          ].join(' ')}
        >
          Todas
        </button>
        {(Object.keys(CATEGORY_LABEL) as NewsCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              categoryFilter === c
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
            ].join(' ')}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {rows.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {filtered.length} de {rows.length}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <p className="text-[var(--text-muted)]">No hay novedades todavía.</p>
          <Link href="/admin/novedades/nueva" className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
            Crear la primera
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Sin resultados para «{query}».</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((n) => {
            const isScheduled = new Date(n.publish_at) > new Date()
            return (
              <div
                key={n.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-primary)]">{n.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="rounded bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                      {CATEGORY_LABEL[n.category]}
                    </span>
                    <span>·</span>
                    <span>{AUDIENCE_LABEL[n.audience]}</span>
                    {n.productName && (
                      <>
                        <span>·</span>
                        <span>{n.productName}</span>
                      </>
                    )}
                    <span>·</span>
                    {isScheduled ? (
                      <span className="rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--warning)]">
                        Programada: {new Date(n.publish_at).toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span>{new Date(n.publish_at).toLocaleDateString('es-AR')}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Link
                    href={`/admin/novedades/${n.id}`}
                    className="rounded-md px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)]"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(n)}
                    className="rounded-md px-3 py-1.5 text-xs text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

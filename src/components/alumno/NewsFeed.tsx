'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { News, NewsCategory } from '@/types/database'

const CATEGORY_LABEL: Record<NewsCategory, string> = {
  feature: 'Nuevo feature',
  producto: 'Nuevo curso',
  empleados: 'Empleados',
  general: 'General',
}

const CATEGORY_COLOR: Record<NewsCategory, string> = {
  feature: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  producto: 'bg-[var(--success)]/15 text-[var(--success)]',
  empleados: 'bg-[var(--warning)]/15 text-[var(--warning)]',
  general: 'bg-[var(--border)] text-[var(--text-secondary)]',
}

export type NewsFeedItem = News & { productName: string | null; productHref: string | null }

export function NewsFeed({ items }: { items: NewsFeedItem[] }) {
  const [categoryFilter, setCategoryFilter] = useState<'' | NewsCategory>('')

  const presentCategories = useMemo(
    () => (Object.keys(CATEGORY_LABEL) as NewsCategory[]).filter((c) => items.some((n) => n.category === c)),
    [items]
  )

  const filtered = useMemo(
    () => (categoryFilter ? items.filter((n) => n.category === categoryFilter) : items),
    [items, categoryFilter]
  )

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-6 py-14 text-center">
        <p className="font-medium text-[var(--text-primary)]">Todavía no hay novedades</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--text-muted)]">
          Te vamos a avisar por acá apenas haya algo nuevo.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {presentCategories.length > 1 && (
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
          {presentCategories.map((c) => (
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
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((n) => (
          <article
            key={n.id}
            className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  'rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
                  CATEGORY_COLOR[n.category],
                ].join(' ')}
              >
                {CATEGORY_LABEL[n.category]}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(n.publish_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2 className="text-base font-semibold text-[var(--text-primary)]">{n.title}</h2>

            <div className="flex flex-col gap-2">
              {n.body.split(/\n\s*\n/).map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {paragraph}
                </p>
              ))}
            </div>

            {n.productName && n.productHref && (
              <Link
                href={n.productHref}
                className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
              >
                Ver {n.productName}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { deleteContent } from '@/app/actions/admin'
import { useOptimisticRows } from '@/hooks/useOptimisticRows'
import { matchesQuery } from '@/lib/text'
import type { ComplexityLevel, Content, Product } from '@/types/database'

const COMPLEXITY_LABEL: Record<ComplexityLevel, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

export type ContentRow = Content & { productName: string }

export function ContentsTable({
  contents,
  products,
  initialProductId = '',
}: {
  contents: ContentRow[]
  products: Pick<Product, 'id' | 'name'>[]
  initialProductId?: string
}) {
  const { rows, optimisticDelete } = useOptimisticRows(contents)
  const [productFilter, setProductFilter] = useState(initialProductId)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      if (productFilter && c.product_id !== productFilter) return false
      if (!matchesQuery(`${c.title} ${c.description ?? ''} ${c.productName}`, query)) return false
      return true
    })
  }, [rows, productFilter, query])

  function handleDelete(c: ContentRow) {
    optimisticDelete(c, {
      label: `Contenido eliminado: ${c.title}.`,
      run: async () => {
        const fd = new FormData()
        fd.append('id', c.id)
        await deleteContent(fd)
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
          placeholder="Buscar por título, curso o descripción…"
          aria-label="Buscar contenido"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline focus:outline-2 focus:outline-[var(--accent)]"
        />
      </div>

      {/* Filtro por producto */}
      {!!products.length && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setProductFilter('')}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              !productFilter
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
            ].join(' ')}
          >
            Todos
          </button>
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setProductFilter(p.id)}
              className={[
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                productFilter === p.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
              ].join(' ')}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {filtered.length} de {rows.length}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <p className="text-[var(--text-muted)]">No hay contenidos todavía.</p>
          <Link href="/admin/contenidos/nuevo" className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
            Crear el primero
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Sin resultados para «{query}».</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--text-primary)]">{c.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span>{c.productName}</span>
                  <span>·</span>
                  <span>{COMPLEXITY_LABEL[c.complexity]}</span>
                  <span>·</span>
                  <span className="uppercase">{c.type}</span>
                  <span>·</span>
                  <span>orden {c.sort_order}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/admin/contenidos/${c.id}`}
                  className="rounded-md px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)]"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(c)}
                  className="rounded-md px-3 py-1.5 text-xs text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

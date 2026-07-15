'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { deleteProduct } from '@/app/actions/admin'
import { useOptimisticRows } from '@/hooks/useOptimisticRows'
import { matchesQuery } from '@/lib/text'
import type { Product } from '@/types/database'

export function ProductsTable({
  products,
  categoryMap,
}: {
  products: Product[]
  categoryMap: Record<string, string>
}) {
  const { rows, optimisticDelete } = useOptimisticRows(products)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return rows.filter((p) =>
      matchesQuery(`${p.name} ${p.slug} ${p.category_id ? categoryMap[p.category_id] ?? '' : ''}`, query)
    )
  }, [rows, query, categoryMap])

  function handleDelete(p: Product) {
    optimisticDelete(p, {
      label: `Curso eliminado: ${p.name}.`,
      run: async () => {
        const fd = new FormData()
        fd.append('id', p.id)
        await deleteProduct(fd)
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
          placeholder="Buscar por nombre, slug o categoría…"
          aria-label="Buscar curso"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline focus:outline-2 focus:outline-[var(--accent)]"
        />
      </div>

      {rows.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {filtered.length} de {rows.length}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <p className="text-[var(--text-muted)]">No hay cursos todavía.</p>
          <Link href="/admin/productos/nuevo" className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
            Crear el primero
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Sin resultados para «{query}».</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--text-primary)]">
                  {p.name}
                  {p.is_mandatory && (
                    <span className="ml-2 align-middle rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--warning)]">
                      Obligatorio
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  /{p.slug} · orden {p.sort_order}
                  {p.category_id ? (
                    <> · <span className="text-[var(--text-secondary)]">{categoryMap[p.category_id] ?? '—'}</span></>
                  ) : (
                    <> · <span className="italic">Sin categoría</span></>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/admin/productos/${p.id}`}
                  className="rounded-md px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card)]"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(p)}
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

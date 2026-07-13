'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export type SearchItem = {
  id: string
  title: string
  description: string | null
  productName: string
  productSlug: string
  levelLabel: string
  typeLabel: string
}

const MAX_RESULTS = 12

// Normaliza para buscar sin distinción de acentos ni mayúsculas
function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function ContentSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (q.length < 2) return null

    const tokens = q.split(/\s+/)
    return items
      .filter((item) => {
        const haystack = normalize(
          `${item.title} ${item.description ?? ''} ${item.productName}`
        )
        return tokens.every((t) => haystack.includes(t))
      })
      .slice(0, MAX_RESULTS)
  }, [query, items])

  return (
    <div className="flex flex-col gap-3">
      {/* Input */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('')
          }}
          placeholder="Buscar un contenido, curso o tema…"
          aria-label="Buscar contenido por nombre de curso, título o descripción"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-10 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline focus:outline-2 focus:outline-[var(--accent)]"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Resultados */}
      {results !== null && (
        <div className="flex flex-col gap-2">
          <p aria-live="polite" className="text-xs text-[var(--text-muted)]">
            {results.length === 0
              ? `Sin resultados para «${query.trim()}»`
              : `${results.length} resultado${results.length === 1 ? '' : 's'}`}
          </p>

          {results.map((item) => (
            <Link
              key={item.id}
              href={`/contenido/${item.productSlug}/${item.id}`}
              className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-card)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--text-primary)]">
                  {item.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                  {item.productName} · {item.levelLabel} · {item.typeLabel}
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

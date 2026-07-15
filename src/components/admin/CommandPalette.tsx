'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminSearchIndex, type AdminSearchItem } from '@/app/actions/admin'
import { matchesQuery } from '@/lib/text'

type QuickAction = { label: string; href: string; icon: string; group: 'Ir a' | 'Acciones' }

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Panel', href: '/admin', icon: '⊞', group: 'Ir a' },
  { label: 'Usuarios', href: '/admin/usuarios', icon: '👥', group: 'Ir a' },
  { label: 'Categorías', href: '/admin/categorias', icon: '🏷️', group: 'Ir a' },
  { label: 'Cursos', href: '/admin/productos', icon: '🎓', group: 'Ir a' },
  { label: 'Contenidos', href: '/admin/contenidos', icon: '🎬', group: 'Ir a' },
  { label: 'Reportes', href: '/admin/reportes', icon: '📊', group: 'Ir a' },
  { label: 'Nuevo curso', href: '/admin/productos/nuevo', icon: '+', group: 'Acciones' },
  { label: 'Nuevo contenido', href: '/admin/contenidos/nuevo', icon: '+', group: 'Acciones' },
  { label: 'Importar contenidos', href: '/admin/contenidos/importar', icon: '⇪', group: 'Acciones' },
  { label: 'Enviar notificación', href: '/admin/notificaciones', icon: '🔔', group: 'Acciones' },
  { label: 'Plantilla de certificado', href: '/admin/certificado', icon: '🎓', group: 'Acciones' },
  { label: 'Conexión a Odoo', href: '/admin/odoo', icon: '🔌', group: 'Acciones' },
  { label: 'Pantalla de bienvenida', href: '/admin/bienvenida', icon: '👋', group: 'Acciones' },
]

const KIND_GROUP: Record<AdminSearchItem['kind'], string> = {
  user: 'Usuarios',
  product: 'Cursos',
  content: 'Contenidos',
}
const KIND_ICON: Record<AdminSearchItem['kind'], string> = {
  user: '👤',
  product: '🎓',
  content: '🎬',
}

type Row = {
  key: string
  group: string
  icon: string
  label: string
  sublabel?: string
  href: string
  showHeader: boolean
}

export function CommandPalette() {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [index, setIndex] = useState<AdminSearchItem[] | null>(null)
  const [loading, setLoading] = useState(false)

  const open = useCallback(() => {
    setQuery('')
    setSelected(0)
    dialogRef.current?.showModal()
    if (index === null && !loading) {
      setLoading(true)
      getAdminSearchIndex()
        .then(setIndex)
        .catch(() => setIndex([]))
        .finally(() => setLoading(false))
    }
  }, [index, loading])

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (dialogRef.current?.open) close()
        else open()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  const rows = useMemo<Row[]>(() => {
    const q = query.trim()
    type DraftRow = Omit<Row, 'showHeader'>
    const quick: DraftRow[] = QUICK_ACTIONS.filter((a) => !q || matchesQuery(a.label, q)).map((a) => ({
      key: `quick-${a.href}`,
      group: a.group,
      icon: a.icon,
      label: a.label,
      href: a.href,
    }))

    const entities: DraftRow[] = !q
      ? []
      : (index ?? [])
          .filter((item) => matchesQuery(`${item.title} ${item.subtitle}`, q))
          .slice(0, 30)
          .map((item) => ({
            key: `${item.kind}-${item.id}`,
            group: KIND_GROUP[item.kind],
            icon: KIND_ICON[item.kind],
            label: item.title,
            sublabel: item.subtitle,
            href: item.href,
          }))

    const combined = q ? [...quick, ...entities] : quick
    return combined.map((row, i) => ({ ...row, showHeader: i === 0 || row.group !== combined[i - 1].group }))
  }, [query, index])

  const clampedSelected = Math.min(selected, Math.max(rows.length - 1, 0))

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row-index="${clampedSelected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [clampedSelected])

  function select(row: Row) {
    close()
    router.push(row.href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(Math.min(clampedSelected + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(Math.max(clampedSelected - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const row = rows[clampedSelected]
      if (row) select(row)
    }
  }

  return (
    <>
      <button
        onClick={open}
        aria-label="Abrir la paleta de comandos"
        className="flex items-center gap-2 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="hidden rounded border border-[var(--border)] bg-[var(--bg-card)] px-1 font-sans text-[10px] sm:inline">⌘K</kbd>
      </button>

      <dialog
        ref={dialogRef}
        className="cmdk-dialog"
        aria-label="Paleta de comandos"
        onClose={() => setQuery('')}
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <div className="flex max-h-[70svh] flex-col overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-[var(--text-muted)]">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelected(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar usuarios, cursos, contenidos o una acción…"
              aria-label="Buscar en el panel de administración"
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
            <kbd className="shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">Esc</kbd>
          </div>

          <div ref={listRef} role="listbox" aria-label="Resultados" className="overflow-y-auto p-2">
            {loading && query.trim() !== '' && (
              <p className="px-2.5 py-4 text-center text-xs text-[var(--text-muted)]">Buscando en usuarios, cursos y contenidos…</p>
            )}
            {rows.length === 0 && !loading && (
              <p className="px-2.5 py-4 text-center text-xs text-[var(--text-muted)]">
                Sin resultados para «{query}»
              </p>
            )}
            {rows.map((row, i) => {
              return (
                <div key={row.key}>
                  {row.showHeader && (
                    <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)] first:pt-1">
                      {row.group}
                    </p>
                  )}
                  <button
                    data-row-index={i}
                    role="option"
                    aria-selected={i === clampedSelected}
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => select(row)}
                    className={[
                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      i === clampedSelected
                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)]',
                    ].join(' ')}
                  >
                    <span className="w-5 shrink-0 text-center text-base leading-none">{row.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{row.label}</span>
                    {row.sublabel && (
                      <span className="shrink-0 truncate text-xs text-[var(--text-muted)]">{row.sublabel}</span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </dialog>
    </>
  )
}

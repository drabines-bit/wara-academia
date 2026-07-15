'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { approveUser, rejectUser, changeUserRole, deleteUser } from '@/app/actions/admin'
import { useOptimisticRows } from '@/hooks/useOptimisticRows'
import { showToast } from '@/lib/toast'
import { matchesQuery } from '@/lib/text'
import { UserActions } from '@/components/admin/UserActions'
import { UserCategorySelect } from '@/components/admin/UserCategorySelect'
import type { Category, UserRole, UserStatus } from '@/types/database'

export type UserRow = {
  id: string
  full_name: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  categoryIds: string[]
}

const STATUS_LABEL: Record<UserStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}
const STATUS_COLOR: Record<UserStatus, string> = {
  pending: 'bg-[var(--warning)]/15 text-[var(--warning)]',
  approved: 'bg-[var(--success)]/15 text-[var(--success)]',
  rejected: 'bg-[var(--danger)]/15 text-[var(--danger)]',
}
const FILTERS: { label: string; value: '' | UserStatus }[] = [
  { label: 'Todos', value: '' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Aprobados', value: 'approved' },
  { label: 'Rechazados', value: 'rejected' },
]

export function UsersTable({
  users,
  allCategories,
  initialStatus = '',
}: {
  users: UserRow[]
  allCategories: Category[]
  initialStatus?: '' | UserStatus
}) {
  const { rows, optimisticAction, optimisticDelete } = useOptimisticRows(users)
  const [statusFilter, setStatusFilter] = useState<'' | UserStatus>(initialStatus)
  const [query, setQuery] = useState('')
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const highlightRef = useRef<HTMLDivElement>(null)
  const [flashId, setFlashId] = useState<string | null>(() => highlightId)

  useEffect(() => {
    if (!highlightId) return
    const t = setTimeout(() => highlightRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50)
    const clear = setTimeout(() => setFlashId(null), 2200)
    return () => {
      clearTimeout(t)
      clearTimeout(clear)
    }
  }, [highlightId])

  const withPending = (id: string, run: () => Promise<void>) => {
    setPendingIds((s) => new Set(s).add(id))
    return run().finally(() =>
      setPendingIds((s) => {
        const n = new Set(s)
        n.delete(id)
        return n
      })
    )
  }

  function handleApprove(row: UserRow) {
    withPending(row.id, async () => {
      const ok = await optimisticAction(row, { status: 'approved' }, async () => {
        const fd = new FormData()
        fd.append('id', row.id)
        const result = await approveUser(fd)
        showToast(
          result.emailSent
            ? { text: `Aprobado y notificado por email a ${result.email}.`, tone: 'success' }
            : { text: 'Aprobado, pero el email de aviso no se pudo enviar.', tone: 'error' }
        )
      })
      if (!ok) showToast({ text: 'No se pudo aprobar al usuario.', tone: 'error' })
    })
  }

  function handleReject(row: UserRow) {
    const verb = row.status === 'approved' ? 'Acceso revocado' : 'Usuario rechazado'
    withPending(row.id, async () => {
      const ok = await optimisticAction(row, { status: 'rejected' }, async () => {
        const fd = new FormData()
        fd.append('id', row.id)
        const result = await rejectUser(fd)
        showToast(
          result.emailSent
            ? { text: `${verb} y notificado por email a ${result.email}.`, tone: 'success' }
            : { text: `${verb}, pero el email de aviso no se pudo enviar.`, tone: 'error' }
        )
      })
      if (!ok) showToast({ text: 'No se pudo actualizar al usuario.', tone: 'error' })
    })
  }

  function handleToggleRole(row: UserRow) {
    const nextRole: UserRole = row.role === 'admin' ? 'alumno' : 'admin'
    withPending(row.id, async () => {
      const ok = await optimisticAction(row, { role: nextRole }, async () => {
        const fd = new FormData()
        fd.append('id', row.id)
        fd.append('role', nextRole)
        await changeUserRole(fd)
        showToast({
          text: nextRole === 'admin' ? `${row.full_name || 'Usuario'} ahora es admin.` : `Se le quitó el rol de admin a ${row.full_name || 'usuario'}.`,
          tone: 'success',
        })
      })
      if (!ok) showToast({ text: 'No se pudo cambiar el rol.', tone: 'error' })
    })
  }

  function handleDelete(row: UserRow) {
    optimisticDelete(row, {
      label: `Eliminado: ${row.full_name || row.email || 'usuario'}.`,
      run: async () => {
        const fd = new FormData()
        fd.append('id', row.id)
        await deleteUser(fd)
      },
    })
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (query.trim() && !matchesQuery(`${r.full_name} ${r.email}`, query)) return false
      return true
    })
  }, [rows, statusFilter, query])

  return (
    <div className="flex flex-col gap-4">
      {/* Búsqueda */}
      <div className="relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o email…"
          aria-label="Buscar usuario por nombre o email"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline focus:outline-2 focus:outline-[var(--accent)]"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === value
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
        <span className="self-center text-xs text-[var(--text-muted)]">
          {filtered.length} de {rows.length}
        </span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No hay usuarios con este filtro.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              ref={r.id === highlightId ? highlightRef : undefined}
              className={[
                'rounded-xl border p-4 transition-colors duration-500',
                flashId === r.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                  : 'border-[var(--border)] bg-[var(--bg-surface)]',
              ].join(' ')}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex flex-col gap-0.5">
                  <p className="font-medium text-[var(--text-primary)]">{r.full_name || '(sin nombre)'}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{r.email || '—'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {r.role === 'admin' && (
                      <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        Admin
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(r.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <UserCategorySelect userId={r.id} allCategories={allCategories} assignedIds={r.categoryIds} />
                </div>
                <UserActions
                  status={r.status}
                  role={r.role}
                  pending={pendingIds.has(r.id)}
                  onApprove={() => handleApprove(r)}
                  onReject={() => handleReject(r)}
                  onToggleRole={() => handleToggleRole(r)}
                  onDelete={() => handleDelete(r)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

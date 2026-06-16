import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { UserActions } from '@/components/admin/UserActions'
import { UserCategorySelect } from '@/components/admin/UserCategorySelect'
import type { UserRole, UserStatus } from '@/types/database'

export const metadata: Metadata = { title: 'Usuarios — Admin' }

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

const FILTERS: { label: string; value: string }[] = [
  { label: 'Todos', value: '' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Aprobados', value: 'approved' },
  { label: 'Rechazados', value: 'rejected' },
]

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado } = await searchParams
  const supabase = await createClient()
  const service = createServiceClient()

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, status, created_at')
    .order('created_at', { ascending: false })

  if (estado === 'pending' || estado === 'approved' || estado === 'rejected') {
    query = query.eq('status', estado)
  }

  const { data: profiles } = await query

  const profileIds = (profiles ?? []).map((p) => p.id)

  const [authResult, { data: allCategories }, { data: allUserCategories }] = await Promise.all([
    service.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('categories').select('*').order('sort_order').order('name'),
    profileIds.length > 0
      ? supabase.from('user_categories').select('user_id, category_id').in('user_id', profileIds)
      : Promise.resolve({ data: [] }),
  ])

  const emailById = Object.fromEntries(
    (authResult.data?.users ?? []).map((u) => [u.id, u.email ?? ''])
  )

  const categoriesByUser: Record<string, string[]> = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, []])
  )
  for (const uc of allUserCategories ?? []) {
    if (categoriesByUser[uc.user_id]) {
      categoriesByUser[uc.user_id].push(uc.category_id)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Usuarios</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ label, value }) => (
          <Link
            key={value}
            href={value ? `/admin/usuarios?estado=${value}` : '/admin/usuarios'}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              (estado ?? '') === value
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
            ].join(' ')}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {!profiles?.length ? (
        <p className="text-sm text-[var(--text-muted)]">
          No hay usuarios con este filtro.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">
                    {p.full_name || '(sin nombre)'}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {emailById[p.id] ?? '—'}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                    {p.role === 'admin' && (
                      <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        Admin
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(p.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <UserCategorySelect
                    userId={p.id}
                    allCategories={allCategories ?? []}
                    assignedIds={categoriesByUser[p.id] ?? []}
                  />
                </div>
                <UserActions id={p.id} status={p.status} role={p.role} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

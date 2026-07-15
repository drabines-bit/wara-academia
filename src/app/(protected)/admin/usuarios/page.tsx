import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { UsersTable, type UserRow } from '@/components/admin/UsersTable'
import type { UserStatus } from '@/types/database'

export const metadata: Metadata = { title: 'Usuarios — Admin' }

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado } = await searchParams
  const supabase = await createClient()
  const service = createServiceClient()

  const [{ data: profiles }, { data: allCategories }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, status, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order').order('name'),
  ])

  const profileIds = (profiles ?? []).map((p) => p.id)

  const [authResult, { data: allUserCategories }] = await Promise.all([
    service.auth.admin.listUsers({ perPage: 1000 }),
    profileIds.length > 0
      ? supabase.from('user_categories').select('user_id, category_id').in('user_id', profileIds)
      : Promise.resolve({ data: [] as { user_id: string; category_id: string }[] }),
  ])

  const emailById = Object.fromEntries((authResult.data?.users ?? []).map((u) => [u.id, u.email ?? '']))

  const categoriesByUser: Record<string, string[]> = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, []])
  )
  for (const uc of allUserCategories ?? []) {
    if (categoriesByUser[uc.user_id]) categoriesByUser[uc.user_id].push(uc.category_id)
  }

  const users: UserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailById[p.id] ?? '',
    role: p.role,
    status: p.status,
    created_at: p.created_at,
    categoryIds: categoriesByUser[p.id] ?? [],
  }))

  const initialStatus: '' | UserStatus =
    estado === 'pending' || estado === 'approved' || estado === 'rejected' ? estado : ''

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Usuarios</h1>
      </div>

      <UsersTable users={users} allCategories={allCategories ?? []} initialStatus={initialStatus} />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/AdminNav'
import type { UserRole } from '@/types/database'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: UserRole } | null; error: unknown }

  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  )
}

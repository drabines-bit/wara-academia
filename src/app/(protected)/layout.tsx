import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserStatus } from '@/types/database'

// Verifica sesión activa + status approved. Nunca delegar esta comprobación solo al proxy.
export default async function ProtectedLayout({
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
    .select('status')
    .eq('id', user.id)
    .single() as { data: { status: UserStatus } | null; error: unknown }

  if (!profile || profile.status === 'pending') redirect('/pendiente')
  if (profile.status === 'rejected') redirect('/login?rechazado=true')

  return <>{children}</>
}

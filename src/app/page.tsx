import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Raíz: redirigir según estado de sesión y perfil
export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status === 'pending') redirect('/pendiente')
  if (profile.status === 'rejected') redirect('/login?rechazado=true')
  if (profile.role === 'admin') redirect('/admin')

  redirect('/contenido')
}

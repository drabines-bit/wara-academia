import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ThemeSync } from '@/components/alumno/ThemeSync'
import { SpotifyWidget } from '@/components/alumno/SpotifyWidget'

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
    .select('status, preferred_theme, spotify_embed_url')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status === 'pending') redirect('/pendiente')
  if (profile.status === 'rejected') redirect('/login?rechazado=true')

  return (
    <>
      <ThemeSync theme={profile.preferred_theme} />
      {profile.spotify_embed_url && (
        <SpotifyWidget embedUrl={profile.spotify_embed_url} />
      )}
      {children}
    </>
  )
}

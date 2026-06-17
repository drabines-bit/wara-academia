import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ThemeSelector } from '@/components/alumno/ThemeSelector'
import { SpotifyForm } from '@/components/alumno/SpotifyForm'
import { NameForm } from '@/components/alumno/NameForm'

export const metadata: Metadata = { title: 'Mi perfil — Academia WARA GPS' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (!profile) return null

  const initial = (profile.full_name?.trim() || user!.email || '?')[0].toUpperCase()

  return (
    <div className="flex flex-col max-w-lg">

      {/* Header */}
      <div className="animate-fade-up flex items-center gap-4 pb-8 border-b border-[var(--border)]">
        <div className="shrink-0 h-14 w-14 rounded-xl bg-[var(--accent)]/12 flex items-center justify-center select-none">
          <span className="text-2xl font-bold text-[var(--accent)]">{initial}</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Mi perfil
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {profile.full_name}
          </p>
        </div>
      </div>

      {/* Cuenta */}
      <section className="animate-fade-up-delayed py-8 border-b border-[var(--border)]">
        <h2 className="mb-5 text-sm font-semibold text-[var(--text-primary)]">Cuenta</h2>
        <div className="flex flex-col gap-5">
          <NameForm currentName={profile.full_name} />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Email</p>
            <p className="mt-0.5 font-mono text-sm text-[var(--text-secondary)]">
              {user!.email}
            </p>
          </div>
        </div>
      </section>

      {/* Tema visual */}
      <section
        className="animate-fade-up py-8 border-b border-[var(--border)]"
        style={{ animationDelay: '0.12s' }}
      >
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Tema visual</h2>
        <p className="mt-0.5 mb-5 text-xs text-[var(--text-muted)]">
          El cambio es instantáneo y se guarda automáticamente.
        </p>
        <ThemeSelector currentTheme={profile.preferred_theme} />
      </section>

      {/* Spotify */}
      <section
        className="animate-fade-up py-8"
        style={{ animationDelay: '0.18s' }}
      >
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Reproductor de Spotify
        </h2>
        <p className="mt-0.5 mb-5 text-xs text-[var(--text-muted)]">
          En desktop aparece como widget flotante en la esquina inferior derecha.
          En mobile lo ves aquí abajo.
        </p>
        <SpotifyForm currentUrl={profile.spotify_embed_url} />
      </section>

    </div>
  )
}

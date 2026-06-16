import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ThemeSelector } from '@/components/alumno/ThemeSelector'
import { SpotifyForm } from '@/components/alumno/SpotifyForm'

export const metadata: Metadata = { title: 'Mi perfil — Academia WARA GPS' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (!profile) return null

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Mi perfil</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Personalizá tu experiencia en la academia.
        </p>
      </div>

      {/* Cuenta */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Cuenta</h2>
        <dl className="flex flex-col gap-2">
          <div>
            <dt className="text-xs text-[var(--text-muted)]">Nombre</dt>
            <dd className="text-sm text-[var(--text-primary)]">{profile.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-muted)]">Email</dt>
            <dd className="text-sm text-[var(--text-secondary)]">{user!.email}</dd>
          </div>
        </dl>
      </section>

      {/* Tema visual */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h2 className="mb-0.5 text-sm font-semibold text-[var(--text-primary)]">
          Tema visual
        </h2>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          El cambio es instantáneo y se guarda automáticamente.
        </p>
        <ThemeSelector currentTheme={profile.preferred_theme} />
      </section>

      {/* Spotify */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <h2 className="mb-0.5 text-sm font-semibold text-[var(--text-primary)]">
          Reproductor de Spotify
        </h2>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          En desktop aparece como widget flotante en la esquina inferior derecha.
          En mobile lo ves aquí abajo.
        </p>
        <SpotifyForm currentUrl={profile.spotify_embed_url} />
      </section>
    </div>
  )
}

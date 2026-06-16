'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function SpotifyForm({ currentUrl }: { currentUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(updateProfile, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="URL de Spotify"
        name="spotify_embed_url"
        type="url"
        defaultValue={currentUrl ?? ''}
        placeholder="https://open.spotify.com/playlist/..."
      />

      {state?.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-[var(--success)]">✓ Guardado correctamente.</p>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        Aceptamos playlists, álbumes, tracks y podcasts de Spotify.
        Dejá el campo vacío para quitar el reproductor.
      </p>

      <Button type="submit" loading={isPending} className="w-fit">
        Guardar
      </Button>

      {/* Preview en mobile (en desktop lo muestra el widget flotante) */}
      {currentUrl && (
        <div className="md:hidden mt-2">
          <p className="mb-2 text-xs text-[var(--text-muted)]">Reproductor activo:</p>
          <iframe
            src={currentUrl}
            width="100%"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl border border-[var(--border)]"
          />
        </div>
      )}
    </form>
  )
}

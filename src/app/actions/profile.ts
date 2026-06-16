'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { toSpotifyEmbedUrl } from '@/lib/spotify'

type ActionState = { error?: string; success?: boolean } | undefined

export async function updateTheme(theme: number): Promise<void> {
  if (![1, 2, 3, 4].includes(theme)) return
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('profiles') as any)
    .update({ preferred_theme: theme })
    .eq('id', user.id)
}

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const spotifyRaw = (formData.get('spotify_embed_url') as string)?.trim() || ''

  let spotify_embed_url: string | null = null
  if (spotifyRaw) {
    const embedUrl = toSpotifyEmbedUrl(spotifyRaw)
    if (!embedUrl) {
      return {
        error:
          'URL de Spotify inválida. Copiá el enlace desde open.spotify.com (playlist, álbum, track, etc.).',
      }
    }
    spotify_embed_url = embedUrl
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update({ spotify_embed_url })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/perfil')
  return { success: true }
}

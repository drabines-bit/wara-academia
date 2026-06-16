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
  await supabase.from('profiles').update({ preferred_theme: theme }).eq('id', user.id)
}

export async function updateFullName(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name) return { error: 'El nombre no puede estar vacío.' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/perfil')
  revalidatePath('/contenido')
  return { success: true }
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

  const { error } = await supabase
    .from('profiles')
    .update({ spotify_embed_url })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/perfil')
  return { success: true }
}

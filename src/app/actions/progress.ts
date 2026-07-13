'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type MarkViewedResult = {
  justCompleted: boolean
}

/**
 * Marca un contenido como visto. Devuelve si con este visto el alumno
 * completó el 100% del curso (para mostrar la felicitación una sola vez).
 */
export async function markContentViewed(contentId: string): Promise<MarkViewedResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { justCompleted: false }

  const { data: content } = await supabase
    .from('contents')
    .select('id, product_id')
    .eq('id', contentId)
    .single()
  if (!content) return { justCompleted: false }

  const { data: allContents } = await supabase
    .from('contents')
    .select('id')
    .eq('product_id', content.product_id)

  const allIds = (allContents ?? []).map((c) => c.id)
  if (allIds.length === 0) return { justCompleted: false }

  const { data: viewedRows } = await supabase
    .from('user_content_progress')
    .select('content_id')
    .eq('user_id', user.id)
    .in('content_id', allIds)

  const viewedBefore = new Set((viewedRows ?? []).map((r) => r.content_id))
  const wasComplete = allIds.every((id) => viewedBefore.has(id))

  const { error } = await supabase.from('user_content_progress').upsert(
    { user_id: user.id, content_id: contentId },
    { onConflict: 'user_id,content_id' }
  )
  if (error) return { justCompleted: false }

  viewedBefore.add(contentId)
  const isComplete = allIds.every((id) => viewedBefore.has(id))

  // Purga el router cache del cliente: el checkmark aparece en vivo
  // al volver a la lista del curso o al home
  revalidatePath('/contenido', 'layout')

  return { justCompleted: !wasComplete && isComplete }
}

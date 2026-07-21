import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import { getEligibleUserIds } from '@/lib/notifications'
import type { NewsAudience } from '@/types/database'

/**
 * Usuarios aprobados que corresponden a la audiencia de una novedad
 * (cliente/empleado/todos), opcionalmente acotado a los elegibles de un
 * curso puntual (misma regla de categorías que el resto de notificaciones).
 */
async function getEligibleNewsUserIds(
  audience: NewsAudience,
  productId: string | null
): Promise<string[]> {
  const service = createServiceClient()

  const baseIds = productId
    ? await getEligibleUserIds(productId)
    : ((await service.from('profiles').select('id').eq('status', 'approved')).data ?? []).map(
        (p) => p.id
      )

  if (audience === 'todos' || baseIds.length === 0) return baseIds

  const { data: matching } = await service
    .from('profiles')
    .select('id')
    .eq('audience', audience)
    .in('id', baseIds)

  return (matching ?? []).map((p) => p.id)
}

/**
 * Fan-out de una novedad ya publicada a la campanita de notificaciones de
 * los usuarios elegibles. Idempotente: si ya se notificó (notified_at seteado)
 * no hace nada. Nunca lanza: un fallo acá no debe romper la publicación.
 */
export async function notifyNews(newsId: string): Promise<void> {
  try {
    const service = createServiceClient()

    const { data: news } = await service.from('news').select('*').eq('id', newsId).single()
    if (!news || news.notified_at) return

    const targets = await getEligibleNewsUserIds(news.audience, news.product_id)

    if (targets.length > 0) {
      const body = news.body.length > 280 ? `${news.body.slice(0, 277)}…` : news.body
      await service.from('notifications').insert(
        targets.map((user_id) => ({
          user_id,
          title: news.title,
          body,
          href: '/novedades',
          product_id: news.product_id,
          kind: 'novedad' as const,
        }))
      )
    }

    await service.from('news').update({ notified_at: new Date().toISOString() }).eq('id', newsId)
  } catch (err) {
    console.error('notifyNews falló:', err)
  }
}

/**
 * Recorre las novedades cuya publish_at ya venció y todavía no se notificaron.
 * Pensado para llamarse desde el cron de publicación programada.
 */
export async function notifyDueNews(): Promise<{ notified: number }> {
  const service = createServiceClient()
  const { data: due } = await service
    .from('news')
    .select('id')
    .is('notified_at', null)
    .lte('publish_at', new Date().toISOString())

  for (const row of due ?? []) {
    await notifyNews(row.id)
  }

  return { notified: due?.length ?? 0 }
}

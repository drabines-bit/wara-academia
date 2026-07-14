import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Usuarios aprobados con acceso a un curso, según la misma regla de visibilidad
 * de la vista alumno: categoría explícita del usuario, categorías por defecto
 * si no tiene ninguna, o todos si el curso no tiene categoría.
 */
export async function getEligibleUserIds(productId: string): Promise<string[]> {
  const service = createServiceClient()

  const [{ data: product }, { data: approved }] = await Promise.all([
    service.from('products').select('category_id').eq('id', productId).single(),
    service.from('profiles').select('id').eq('status', 'approved'),
  ])

  const approvedIds = (approved ?? []).map((p) => p.id)
  if (!product || approvedIds.length === 0) return []
  if (!product.category_id) return approvedIds

  const [{ data: catUsers }, { data: category }, { data: anyCatRows }] = await Promise.all([
    service.from('user_categories').select('user_id').eq('category_id', product.category_id),
    service.from('categories').select('is_default').eq('id', product.category_id).single(),
    service.from('user_categories').select('user_id'),
  ])

  const inCategory = new Set((catUsers ?? []).map((r) => r.user_id))
  const hasAnyCategory = new Set((anyCatRows ?? []).map((r) => r.user_id))

  return approvedIds.filter(
    (id) =>
      inCategory.has(id) ||
      // Sin categorías asignadas → hereda las categorías por defecto
      (category?.is_default === true && !hasAnyCategory.has(id))
  )
}

/**
 * Notifica contenido nuevo en un curso a los alumnos con acceso.
 * Dedupe: si el usuario ya tiene una notificación NO leída de contenido nuevo
 * para el mismo curso, no se le crea otra.
 * Nunca lanza: un fallo acá no debe romper el alta de contenido.
 */
export async function notifyNewContent(
  productId: string,
  count: number,
  singleTitle?: string
): Promise<void> {
  try {
    const service = createServiceClient()

    const { data: product } = await service
      .from('products')
      .select('name, slug')
      .eq('id', productId)
      .single()
    if (!product) return

    const eligible = await getEligibleUserIds(productId)
    if (eligible.length === 0) return

    const { data: pending } = await service
      .from('notifications')
      .select('user_id')
      .eq('product_id', productId)
      .eq('kind', 'nuevo_contenido')
      .is('read_at', null)

    const alreadyNotified = new Set((pending ?? []).map((r) => r.user_id))
    const targets = eligible.filter((id) => !alreadyNotified.has(id))
    if (targets.length === 0) return

    const body =
      count === 1 && singleTitle
        ? `Se agregó «${singleTitle}»`
        : `Se agregaron ${count} contenidos nuevos`

    await service.from('notifications').insert(
      targets.map((user_id) => ({
        user_id,
        title: `Nuevo contenido en ${product.name}`,
        body,
        href: `/contenido/${product.slug}`,
        product_id: productId,
        kind: 'nuevo_contenido' as const,
      }))
    )
  } catch (err) {
    console.error('notifyNewContent falló:', err)
  }
}

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/alumno/ProductGrid'

export const metadata: Metadata = { title: 'Inicio — Academia WARA GPS' }

export const dynamic = 'force-dynamic'

export default async function ContenidoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? ''

  // Categorías del usuario (o por defecto)
  const { data: userCats } = await supabase
    .from('user_categories')
    .select('category_id')
    .eq('user_id', user!.id)

  let categoryIds = (userCats ?? []).map((r) => r.category_id)

  if (categoryIds.length === 0) {
    const { data: defaultCats } = await supabase
      .from('categories')
      .select('id')
      .eq('is_default', true)
    categoryIds = (defaultCats ?? []).map((c) => c.id)
  }

  // Productos visibles para el usuario
  let productsQuery = supabase
    .from('products')
    .select('*')
    .order('sort_order')
    .order('name')

  if (categoryIds.length > 0) {
    productsQuery = productsQuery.or(
      `category_id.in.(${categoryIds.join(',')}),category_id.is.null`
    )
  }

  const { data: products } = await productsQuery

  // Progreso por producto
  const progressByProduct: Record<string, { total: number; viewed: number }> = {}

  if (products?.length && user) {
    const productIds = products.map((p) => p.id)

    const { data: allContents } = await supabase
      .from('contents')
      .select('id, product_id')
      .in('product_id', productIds)

    const allContentIds = (allContents ?? []).map((c) => c.id)

    const { data: viewedRows } = allContentIds.length > 0
      ? await supabase
          .from('user_content_progress')
          .select('content_id')
          .eq('user_id', user.id)
          .in('content_id', allContentIds)
      : { data: [] as { content_id: string }[] }

    const viewedSet = new Set((viewedRows ?? []).map((r) => r.content_id))

    for (const c of allContents ?? []) {
      if (!progressByProduct[c.product_id]) {
        progressByProduct[c.product_id] = { total: 0, viewed: 0 }
      }
      progressByProduct[c.product_id].total++
      if (viewedSet.has(c.id)) progressByProduct[c.product_id].viewed++
    }
  }

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-card)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-float text-[var(--text-muted)]"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-[var(--text-muted)]">
          Todavía no hay capacitaciones disponibles.
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Volvé más tarde o contactate con tu administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="animate-fade-up text-2xl font-bold text-[var(--text-primary)]">
          {firstName ? `Hola, ${firstName}` : 'Tus capacitaciones'}
        </h1>
        <p className="animate-fade-up-delayed mt-1 text-sm text-[var(--text-secondary)]">
          {firstName
            ? '¿Sobre qué querés aprender hoy?'
            : 'Seleccioná un producto para ver el material disponible.'}
        </p>
      </div>

      <ProductGrid products={products} progressByProduct={progressByProduct} />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Inicio — Academia WARA GPS' }

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
  let progressByProduct: Record<string, { total: number; viewed: number }> = {}

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
        <div className="h-12 w-12 rounded-full bg-[var(--bg-card)] flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p className="text-[var(--text-muted)]">
          Todavía no hay capacitaciones disponibles.
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Volvé más tarde o contactá a tu administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {firstName ? `Hola, ${firstName}` : 'Tus capacitaciones'}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {firstName
            ? '¿Sobre qué querés aprender hoy?'
            : 'Seleccioná un producto para ver el material disponible.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => {
          const prog = progressByProduct[product.id]
          const total = prog?.total ?? 0
          const viewed = prog?.viewed ?? 0
          const pct = total > 0 ? Math.round((viewed / total) * 100) : 0
          const isComplete = total > 0 && viewed === total

          return (
            <Link
              key={product.id}
              href={`/contenido/${product.slug}`}
              className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-card)]"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] transition-colors">
                  {product.name}
                </h2>
                {isComplete && (
                  <span className="shrink-0 rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                    Completado
                  </span>
                )}
              </div>

              {product.description && (
                <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Barra de progreso */}
              {total > 0 && (
                <div className="mt-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">
                      {viewed} de {total} materiales
                    </span>
                    <span className="text-xs font-medium" style={{ color: isComplete ? 'var(--success)' : 'var(--text-muted)' }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--bg-card)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isComplete ? 'var(--success)' : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              )}

              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                Ver contenido
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Inicio — Academia WARA GPS' }

export default async function ContenidoPage() {
  const supabase = await createClient()

  // Obtener el usuario actual para filtrar por sus categorías
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener las categorías asignadas al usuario
  const { data: userCats } = await supabase
    .from('user_categories')
    .select('category_id')
    .eq('user_id', user!.id)

  let categoryIds = (userCats ?? []).map((r) => r.category_id)

  // Si no tiene categorías asignadas, usar las categorías por defecto
  if (categoryIds.length === 0) {
    const { data: defaultCats } = await supabase
      .from('categories')
      .select('id')
      .eq('is_default', true)
    categoryIds = (defaultCats ?? []).map((c) => c.id)
  }

  // Filtrar productos: los de las categorías del usuario + los sin categoría (visibles para todos)
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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tus capacitaciones</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Seleccioná un producto para ver el material disponible.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/contenido/${product.slug}`}
            className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-card)]"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)] transition-colors">
              {product.name}
            </h2>
            {product.description && (
              <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                {product.description}
              </p>
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
              Ver contenido
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

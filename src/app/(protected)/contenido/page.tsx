import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Inicio — Academia WARA GPS' }

export default async function ContenidoPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')
    .order('name')

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-12 w-12 rounded-full bg-[var(--bg-card)] flex items-center justify-center mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <p className="text-[var(--text-muted)]">
          Todavía no hay productos disponibles.
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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Mis productos</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Seleccioná un producto para ver el contenido disponible.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/contenido/${product.slug}`}
            className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-card)]"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
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

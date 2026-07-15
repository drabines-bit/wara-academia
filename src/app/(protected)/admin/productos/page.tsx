import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductsTable } from '@/components/admin/ProductsTable'

export const metadata: Metadata = { title: 'Cursos — Admin' }

export default async function ProductosPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').order('sort_order').order('name'),
    supabase.from('categories').select('id, name'),
  ])

  const categoryMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Cursos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          + Nuevo
        </Link>
      </div>

      <ProductsTable products={products ?? []} categoryMap={categoryMap} />
    </div>
  )
}

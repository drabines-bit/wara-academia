import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/ProductForm'

export const metadata: Metadata = { title: 'Nuevo curso — Admin' }

export default async function NuevoProductoPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/productos"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Cursos
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
          Nuevo curso
        </h1>
      </div>
      <ProductForm categories={categories ?? []} />
    </div>
  )
}

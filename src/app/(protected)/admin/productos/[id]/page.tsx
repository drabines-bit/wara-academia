import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/ProductForm'
import type { Product } from '@/types/database'

export const metadata: Metadata = { title: 'Editar producto — Admin' }

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single() as { data: Product | null }

  if (!product) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/productos"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Productos
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
          Editar: {product.name}
        </h1>
      </div>
      <ProductForm product={product} />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContentForm } from '@/components/admin/ContentForm'
import type { Product } from '@/types/database'

export const metadata: Metadata = { title: 'Nuevo contenido — Admin' }

export default async function NuevoContenidoPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')
    .order('name') as { data: Product[] | null }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/contenidos"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Contenidos
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
          Nuevo contenido
        </h1>
      </div>
      <ContentForm products={products ?? []} />
    </div>
  )
}

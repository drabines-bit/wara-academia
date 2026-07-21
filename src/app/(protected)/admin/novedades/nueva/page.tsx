import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewsForm } from '@/components/admin/NewsForm'

export const metadata: Metadata = { title: 'Nueva novedad — Admin' }

export default async function NuevaNovedadPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/novedades"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Novedades
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
          Nueva novedad
        </h1>
      </div>
      <NewsForm products={products ?? []} />
    </div>
  )
}

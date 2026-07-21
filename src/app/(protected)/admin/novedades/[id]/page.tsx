import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewsForm } from '@/components/admin/NewsForm'
import type { News } from '@/types/database'

export const metadata: Metadata = { title: 'Editar novedad — Admin' }

export default async function EditarNovedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: news } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .single() as { data: News | null }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')
    .order('name')

  if (!news) notFound()

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
          Editar: {news.title}
        </h1>
      </div>
      <NewsForm news={news} products={products ?? []} />
    </div>
  )
}

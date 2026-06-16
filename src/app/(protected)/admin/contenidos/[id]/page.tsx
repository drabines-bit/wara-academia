import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContentForm } from '@/components/admin/ContentForm'
import type { Content, Product } from '@/types/database'

export const metadata: Metadata = { title: 'Editar contenido — Admin' }

export default async function EditarContenidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [contentResult, productsResult] = await Promise.all([
    supabase.from('contents').select('*').eq('id', id).single(),
    supabase.from('products').select('*').order('sort_order').order('name'),
  ])
  const content = contentResult.data
  const products = productsResult.data

  if (!content) notFound()

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
          Editar: {content.title}
        </h1>
      </div>
      <ContentForm content={content} products={products ?? []} />
    </div>
  )
}

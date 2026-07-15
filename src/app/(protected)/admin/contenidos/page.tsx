import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContentsTable, type ContentRow } from '@/components/admin/ContentsTable'
import type { Content, Product } from '@/types/database'

export const metadata: Metadata = { title: 'Contenidos — Admin' }

type ContentWithProduct = Content & { products: Pick<Product, 'name'> | null }

export default async function ContenidosPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string }>
}) {
  const { producto } = await searchParams
  const supabase = await createClient()

  const [{ data: products }, { data: contents }] = await Promise.all([
    supabase.from('products').select('id, name').order('sort_order').order('name'),
    supabase.from('contents').select('*, products(name)').order('sort_order'),
  ])

  const rows: ContentRow[] = ((contents ?? []) as ContentWithProduct[]).map((c) => {
    const { products: p, ...content } = c
    return { ...content, productName: p?.name ?? '—' }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Contenidos</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/contenidos/importar"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
          >
            Importar
          </Link>
          <Link
            href="/admin/contenidos/nuevo"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
          >
            + Nuevo
          </Link>
        </div>
      </div>

      <ContentsTable contents={rows} products={products ?? []} initialProductId={producto ?? ''} />
    </div>
  )
}

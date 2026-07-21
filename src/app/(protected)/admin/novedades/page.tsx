import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewsTable, type NewsRow } from '@/components/admin/NewsTable'

export const metadata: Metadata = { title: 'Novedades — Admin' }

export default async function NovedadesPage() {
  const supabase = await createClient()

  const [{ data: news }, { data: products }] = await Promise.all([
    supabase.from('news').select('*').order('publish_at', { ascending: false }),
    supabase.from('products').select('id, name'),
  ])

  const productNameById = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]))

  const rows: NewsRow[] = (news ?? []).map((n) => ({
    ...n,
    productName: n.product_id ? (productNameById[n.product_id] ?? null) : null,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Novedades</h1>
        <Link
          href="/admin/novedades/nueva"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          + Nueva
        </Link>
      </div>

      <NewsTable news={rows} />
    </div>
  )
}

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { NewsFeed, type NewsFeedItem } from '@/components/alumno/NewsFeed'

export const metadata: Metadata = { title: 'Novedades — Academia WARA GPS' }

export const dynamic = 'force-dynamic'

export default async function NovedadesPage() {
  const supabase = await createClient()

  const [{ data: news }, { data: products }] = await Promise.all([
    supabase.from('news').select('*').order('publish_at', { ascending: false }),
    supabase.from('products').select('id, name, slug'),
  ])

  const productById = Object.fromEntries((products ?? []).map((p) => [p.id, p]))

  const items: NewsFeedItem[] = (news ?? []).map((n) => {
    const product = n.product_id ? productById[n.product_id] : undefined
    return {
      ...n,
      productName: product?.name ?? null,
      productHref: product ? `/contenido/${product.slug}` : null,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Novedades</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Nuevos features, cursos y avisos de la plataforma.
        </p>
      </div>

      <NewsFeed items={items} />
    </div>
  )
}

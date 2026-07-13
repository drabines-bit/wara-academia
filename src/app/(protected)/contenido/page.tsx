import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/alumno/ProductGrid'
import { ContentSearch, type SearchItem } from '@/components/alumno/ContentSearch'

const LEVEL_ORDER: Record<string, number> = { basico: 0, intermedio: 1, avanzado: 2 }
const LEVEL_LABEL: Record<string, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}
const TYPE_LABEL: Record<string, string> = {
  video: 'Video',
  pdf: 'PDF',
  audio: 'Audio',
  otro: 'Descargable',
}

export const metadata: Metadata = { title: 'Inicio — Academia WARA GPS' }

export const dynamic = 'force-dynamic'

export default async function ContenidoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? ''

  // Categorías del usuario (o por defecto)
  const { data: userCats } = await supabase
    .from('user_categories')
    .select('category_id')
    .eq('user_id', user!.id)

  let categoryIds = (userCats ?? []).map((r) => r.category_id)

  if (categoryIds.length === 0) {
    const { data: defaultCats } = await supabase
      .from('categories')
      .select('id')
      .eq('is_default', true)
    categoryIds = (defaultCats ?? []).map((c) => c.id)
  }

  // Productos visibles para el usuario
  let productsQuery = supabase
    .from('products')
    .select('*')
    .order('sort_order')
    .order('name')

  if (categoryIds.length > 0) {
    productsQuery = productsQuery.or(
      `category_id.in.(${categoryIds.join(',')}),category_id.is.null`
    )
  }

  const { data: products } = await productsQuery

  // Progreso por producto + "Continuar donde dejaste" + índice de búsqueda
  const progressByProduct: Record<string, { total: number; viewed: number }> = {}
  const searchItems: SearchItem[] = []
  let continueTarget: {
    href: string
    title: string
    productName: string
    levelLabel: string
  } | null = null

  if (products?.length && user) {
    const productIds = products.map((p) => p.id)

    const { data: allContents } = await supabase
      .from('contents')
      .select('id, product_id, title, description, type, complexity, sort_order')
      .in('product_id', productIds)

    const allContentIds = (allContents ?? []).map((c) => c.id)

    const { data: viewedRows } = allContentIds.length > 0
      ? await supabase
          .from('user_content_progress')
          .select('content_id, viewed_at')
          .eq('user_id', user.id)
          .in('content_id', allContentIds)
      : { data: [] as { content_id: string; viewed_at: string }[] }

    const viewedSet = new Set((viewedRows ?? []).map((r) => r.content_id))

    const productById = new Map(products.map((p) => [p.id, p]))

    for (const c of allContents ?? []) {
      if (!progressByProduct[c.product_id]) {
        progressByProduct[c.product_id] = { total: 0, viewed: 0 }
      }
      progressByProduct[c.product_id].total++
      if (viewedSet.has(c.id)) progressByProduct[c.product_id].viewed++

      const p = productById.get(c.product_id)
      if (p) {
        searchItems.push({
          id: c.id,
          title: c.title,
          description: c.description,
          productName: p.name,
          productSlug: p.slug,
          levelLabel: LEVEL_LABEL[c.complexity] ?? c.complexity,
          typeLabel: TYPE_LABEL[c.type] ?? c.type,
        })
      }
    }

    // Último contenido visto → siguiente pendiente del mismo curso
    const lastViewed = (viewedRows ?? [])
      .slice()
      .sort((a, b) => (a.viewed_at < b.viewed_at ? 1 : -1))[0]

    if (lastViewed) {
      const lastContent = (allContents ?? []).find((c) => c.id === lastViewed.content_id)
      const lastProduct = lastContent
        ? products.find((p) => p.id === lastContent.product_id)
        : undefined

      if (lastContent && lastProduct) {
        const nextPending = (allContents ?? [])
          .filter((c) => c.product_id === lastProduct.id && !viewedSet.has(c.id))
          .sort(
            (a, b) =>
              (LEVEL_ORDER[a.complexity] ?? 0) - (LEVEL_ORDER[b.complexity] ?? 0) ||
              a.sort_order - b.sort_order ||
              a.title.localeCompare(b.title)
          )[0]

        if (nextPending) {
          continueTarget = {
            href: `/contenido/${lastProduct.slug}/${nextPending.id}`,
            title: nextPending.title,
            productName: lastProduct.name,
            levelLabel: LEVEL_LABEL[nextPending.complexity] ?? nextPending.complexity,
          }
        }
      }
    }
  }

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-card)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-float text-[var(--text-muted)]"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-[var(--text-muted)]">
          Todavía no hay capacitaciones disponibles.
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Volvé más tarde o contactate con tu administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="animate-fade-up text-2xl font-bold text-[var(--text-primary)]">
          {firstName ? `Hola, ${firstName}` : 'Tus capacitaciones'}
        </h1>
        <p className="animate-fade-up-delayed mt-1 text-sm text-[var(--text-secondary)]">
          {firstName
            ? '¿Sobre qué querés aprender hoy?'
            : 'Seleccioná un curso para ver el material disponible.'}
        </p>
      </div>

      {searchItems.length > 0 && <ContentSearch items={searchItems} />}

      {continueTarget && (
        <Link
          href={continueTarget.href}
          className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3.5 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--accent)]">
              Continuar donde dejaste
            </p>
            <p className="mt-0.5 truncate font-medium text-[var(--text-primary)]">
              {continueTarget.title}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {continueTarget.productName} · {continueTarget.levelLabel}
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[var(--accent)] transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      <ProductGrid products={products} progressByProduct={progressByProduct} />
    </div>
  )
}

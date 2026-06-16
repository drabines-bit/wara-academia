import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ComplexityLevel, Content } from '@/types/database'

export const dynamic = 'force-dynamic'

const LEVELS: ComplexityLevel[] = ['basico', 'intermedio', 'avanzado']

const LEVEL_LABEL: Record<ComplexityLevel, string> = {
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

const TYPE_COLOR: Record<string, string> = {
  video: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  pdf: 'bg-[var(--warning)]/15 text-[var(--warning)]',
  audio: 'bg-[var(--success)]/15 text-[var(--success)]',
  otro: 'bg-[var(--border)] text-[var(--text-secondary)]',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('slug', slug)
    .single()
  return {
    title: product ? `${product.name} — Academia WARA GPS` : 'Producto — Academia WARA GPS',
  }
}

export default async function ProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ nivel?: string }>
}) {
  const { slug } = await params
  const { nivel } = await searchParams

  const activeLevel: ComplexityLevel = LEVELS.includes(nivel as ComplexityLevel)
    ? (nivel as ComplexityLevel)
    : 'basico'

  const supabase = await createClient()

  const [productResult, authResult] = await Promise.all([
    supabase.from('products').select('*').eq('slug', slug).single(),
    supabase.auth.getUser(),
  ])

  const product = productResult.data
  const user = authResult.data.user

  if (!product) notFound()

  const { data: contents } = await supabase
    .from('contents')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order')
    .order('title')

  const allContentIds = (contents ?? []).map((c) => c.id)

  // Progreso del usuario para este producto
  const { data: viewedRows } = allContentIds.length > 0 && user
    ? await supabase
        .from('user_content_progress')
        .select('content_id')
        .eq('user_id', user.id)
        .in('content_id', allContentIds)
    : { data: [] as { content_id: string }[] }

  const viewedIds = new Set((viewedRows ?? []).map((r) => r.content_id))
  const totalContents = allContentIds.length
  const viewedCount = viewedIds.size
  const progressPct = totalContents > 0 ? Math.round((viewedCount / totalContents) * 100) : 0

  const grouped: Record<ComplexityLevel, Content[]> = {
    basico: [],
    intermedio: [],
    avanzado: [],
  }
  for (const c of contents ?? []) {
    grouped[c.complexity].push(c)
  }

  const activeContents = grouped[activeLevel]

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div>
        <Link
          href="/contenido"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
          {product.name}
        </h1>
        {product.description && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {product.description}
          </p>
        )}
      </div>

      {/* Barra de progreso global del producto */}
      {totalContents > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">Tu progreso</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">
                {viewedCount} de {totalContents} materiales
              </span>
              {progressPct === 100 && (
                <span className="rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                  Completado
                </span>
              )}
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--bg-card)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct === 100 ? 'var(--success)' : 'var(--accent)',
              }}
            />
          </div>
        </div>
      )}

      {/* Tabs de nivel */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {LEVELS.map((level) => {
          const count = grouped[level].length
          const levelViewed = grouped[level].filter((c) => viewedIds.has(c.id)).length
          return (
            <Link
              key={level}
              href={`/contenido/${slug}?nivel=${level}`}
              className={[
                'relative px-4 py-2.5 text-sm font-medium transition-colors',
                activeLevel === level
                  ? 'text-[var(--accent)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {LEVEL_LABEL[level]}
              {count > 0 && (
                <span
                  className={[
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
                    activeLevel === level
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)]',
                  ].join(' ')}
                >
                  {levelViewed}/{count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Lista de contenidos */}
      {activeContents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Todavía no hay contenido {LEVEL_LABEL[activeLevel].toLowerCase()} para este producto.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeContents.map((content) => {
            const isViewed = viewedIds.has(content.id)
            return (
              <Link
                key={content.id}
                href={`/contenido/${slug}/${content.id}`}
                className="group flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-card)]"
              >
                {/* Indicador de visto */}
                <div
                  className={[
                    'mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                    isViewed
                      ? 'border-[var(--success)] bg-[var(--success)]/15'
                      : 'border-[var(--border)] bg-transparent',
                  ].join(' ')}
                  title={isViewed ? 'Visto' : 'Pendiente'}
                >
                  {isViewed && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[var(--success)]"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>

                <span
                  className={[
                    'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
                    TYPE_COLOR[content.type] ?? TYPE_COLOR.otro,
                  ].join(' ')}
                >
                  {TYPE_LABEL[content.type] ?? content.type}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={[
                      'font-medium transition-colors',
                      isViewed ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]',
                    ].join(' ')}
                  >
                    {content.title}
                  </p>
                  {content.description && (
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)] line-clamp-2">
                      {content.description}
                    </p>
                  )}
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

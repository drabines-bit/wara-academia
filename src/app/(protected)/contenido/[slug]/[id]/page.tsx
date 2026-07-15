import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ContentViewer } from '@/components/alumno/ContentViewer'
import { ViewedTracker } from '@/components/alumno/ViewedTracker'
import { getMandatoryGate } from '@/lib/onboarding'
import type { ComplexityLevel } from '@/types/database'

export const dynamic = 'force-dynamic'

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

const TYPE_COLOR: Record<string, string> = {
  video: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  pdf: 'bg-[var(--warning)]/15 text-[var(--warning)]',
  audio: 'bg-[var(--success)]/15 text-[var(--success)]',
  otro: 'bg-[var(--border)] text-[var(--text-secondary)]',
}

const NEXT_LEVEL: Record<string, ComplexityLevel | null> = {
  basico: 'intermedio',
  intermedio: 'avanzado',
  avanzado: null,
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: content } = await supabase
    .from('contents')
    .select('title')
    .eq('id', id)
    .single()
  return {
    title: content ? `${content.title} — Academia WARA GPS` : 'Contenido — Academia WARA GPS',
  }
}

export default async function ContenidoViewerPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const supabase = await createClient()

  const [productResult, contentResult, authResult] = await Promise.all([
    supabase.from('products').select('*').eq('slug', slug).single(),
    supabase.from('contents').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  const product = productResult.data
  const content = contentResult.data
  const user = authResult.data.user

  if (!user || !product || !content || content.product_id !== product.id) notFound()

  // Curso obligatorio pendiente → solo se puede ver contenido de ese curso
  if (!product.is_mandatory) {
    const { gated } = await getMandatoryGate()
    if (gated) redirect('/contenido')
  }

  // Contenido del mismo nivel para navegación siguiente/anterior
  const { data: levelContents } = await supabase
    .from('contents')
    .select('id, title')
    .eq('product_id', product.id)
    .eq('complexity', content.complexity)
    .order('sort_order')
    .order('title')

  const currentIndex = levelContents?.findIndex((c) => c.id === content.id) ?? -1
  const nextContent = currentIndex >= 0 && levelContents ? (levelContents[currentIndex + 1] ?? null) : null
  const nextLevel = NEXT_LEVEL[content.complexity]

  return (
    <div className="flex flex-col gap-6">
      {/* Navegación / Breadcrumb */}
      <nav aria-label="Ubicación" className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Link href="/contenido" className="hover:text-[var(--accent)] transition-colors">
          Inicio
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/contenido/${slug}?nivel=${content.complexity}`}
          className="truncate hover:text-[var(--accent)] transition-colors"
        >
          {product.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--text-secondary)] truncate">{content.title}</span>
      </nav>

      {/* Metadatos */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              'rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
              TYPE_COLOR[content.type] ?? TYPE_COLOR.otro,
            ].join(' ')}
          >
            {TYPE_LABEL[content.type] ?? content.type}
          </span>
          <span className="rounded bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
            {LEVEL_LABEL[content.complexity]}
          </span>
          {content.source === 'youtube' && (
            <span className="rounded bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
              vía YouTube
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-[var(--text-primary)]">{content.title}</h1>

        {content.description && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {content.description}
          </p>
        )}
      </div>

      {/* Visor */}
      <ContentViewer
        externalId={content.external_id}
        title={content.title}
        type={content.type}
        source={content.source}
      />

      {/* Marca como visto tras permanencia mínima; muestra la felicitación
          solo en la visita que completa el 100% del curso */}
      <ViewedTracker contentId={content.id} productName={product.name} />

      {/* Navegación inferior */}
      <div className="grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
        <Link
          href={`/contenido/${slug}?nivel=${content.complexity}`}
          className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-card)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] transition-transform duration-200 group-hover:-translate-x-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-xs text-[var(--text-muted)]">Volver a</p>
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{product.name}</p>
          </div>
        </Link>

        {nextContent ? (
          <Link
            href={`/contenido/${slug}/${nextContent.id}`}
            className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/15"
          >
            <div className="min-w-0">
              <p className="text-xs text-[var(--accent)]">Siguiente</p>
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{nextContent.title}</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ) : nextLevel ? (
          <Link
            href={`/contenido/${slug}?nivel=${nextLevel}`}
            className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/15"
          >
            <div className="min-w-0">
              <p className="text-xs text-[var(--accent)]">Siguiente nivel</p>
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{LEVEL_LABEL[nextLevel]}</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--success)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-xs text-[var(--success)]">Llegaste al final</p>
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">Completaste todo {product.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

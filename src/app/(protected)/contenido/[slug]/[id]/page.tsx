import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DriveViewer } from '@/components/alumno/DriveViewer'
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

  const [productResult, contentResult] = await Promise.all([
    supabase.from('products').select('*').eq('slug', slug).single(),
    supabase.from('contents').select('*').eq('id', id).single(),
  ])

  const product = productResult.data
  const content = contentResult.data

  if (!product || !content || content.product_id !== product.id) notFound()

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
          className="hover:text-[var(--accent)] transition-colors"
        >
          {product.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--text-secondary)] truncate">{content.title}</span>
      </nav>

      {/* Metadatos: contexto antes del contenido */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              'rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
              content.type === 'video'
                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'bg-[var(--warning)]/15 text-[var(--warning)]',
            ].join(' ')}
          >
            {TYPE_LABEL[content.type]}
          </span>
          <span className="rounded bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
            {LEVEL_LABEL[content.complexity]}
          </span>
        </div>

        <h1 className="text-xl font-bold text-[var(--text-primary)]">{content.title}</h1>

        {content.description && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {content.description}
          </p>
        )}
      </div>

      {/* Visor */}
      <DriveViewer
        driveFileId={content.drive_file_id}
        title={content.title}
        type={content.type}
      />

      {/* Navegación inferior: Volver + Siguiente */}
      <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
        <Link
          href={`/contenido/${slug}?nivel=${content.complexity}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver a {product.name}
        </Link>

        {nextContent ? (
          <Link
            href={`/contenido/${slug}/${nextContent.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-right"
          >
            <span className="line-clamp-1 max-w-[200px]">Siguiente: {nextContent.title}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        ) : nextLevel ? (
          <Link
            href={`/contenido/${slug}?nivel=${nextLevel}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
          >
            Ver nivel {LEVEL_LABEL[nextLevel]}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        ) : null}
      </div>
    </div>
  )
}

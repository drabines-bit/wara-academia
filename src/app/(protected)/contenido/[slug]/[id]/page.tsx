import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DriveViewer } from '@/components/alumno/DriveViewer'
import type { Content, Product } from '@/types/database'

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
    .single() as { data: Pick<Content, 'title'> | null; error: unknown }
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
    supabase.from('products').select('*').eq('slug', slug).single() as
      unknown as Promise<{ data: Product | null; error: unknown }>,
    supabase.from('contents').select('*').eq('id', id).single() as
      unknown as Promise<{ data: Content | null; error: unknown }>,
  ])

  const product = productResult.data
  const content = contentResult.data

  if (!product || !content || content.product_id !== product.id) notFound()

  return (
    <div className="flex flex-col gap-6">
      {/* Navegación */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Link href="/contenido" className="hover:text-[var(--accent)] transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <Link
          href={`/contenido/${slug}?nivel=${content.complexity}`}
          className="hover:text-[var(--accent)] transition-colors"
        >
          {product.name}
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)] truncate">{content.title}</span>
      </div>

      {/* Visor */}
      <DriveViewer
        driveFileId={content.drive_file_id}
        title={content.title}
        type={content.type}
      />

      {/* Metadatos del contenido */}
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

      {/* Volver */}
      <div className="border-t border-[var(--border)] pt-4">
        <Link
          href={`/contenido/${slug}?nivel=${content.complexity}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver a {product.name}
        </Link>
      </div>
    </div>
  )
}

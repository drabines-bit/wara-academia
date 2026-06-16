import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteContent } from '@/app/actions/admin'
import { DeleteButton } from '@/components/admin/DeleteButton'
import type { ComplexityLevel, Content, Product } from '@/types/database'

export const metadata: Metadata = { title: 'Contenidos — Admin' }

const COMPLEXITY_LABEL: Record<ComplexityLevel, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

type ContentWithProduct = Content & { products: Pick<Product, 'name'> | null }

export default async function ContenidosPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string }>
}) {
  const { producto } = await searchParams
  const supabase = await createClient()

  const [productsResult, contentsResult] = await Promise.all([
    supabase.from('products').select('id, name').order('sort_order').order('name'),
    producto
      ? supabase.from('contents').select('*, products(name)').eq('product_id', producto).order('sort_order')
      : supabase.from('contents').select('*, products(name)').order('sort_order'),
  ])

  const products = productsResult.data
  const contents = contentsResult.data as ContentWithProduct[] | null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Contenidos</h1>
        <Link
          href="/admin/contenidos/nuevo"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          + Nuevo
        </Link>
      </div>

      {/* Filtro por producto */}
      {!!products?.length && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/contenidos"
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              !producto
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
            ].join(' ')}
          >
            Todos
          </Link>
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/admin/contenidos?producto=${p.id}`}
              className={[
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                producto === p.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
              ].join(' ')}
            >
              {p.name}
            </Link>
          ))}
        </div>
      )}

      {!contents?.length ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <p className="text-[var(--text-muted)]">No hay contenidos todavía.</p>
          <Link
            href="/admin/contenidos/nuevo"
            className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contents.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">
                  {c.title}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span>{c.products?.name ?? '—'}</span>
                  <span>·</span>
                  <span>{COMPLEXITY_LABEL[c.complexity]}</span>
                  <span>·</span>
                  <span className="uppercase">{c.type}</span>
                  <span>·</span>
                  <span>orden {c.sort_order}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/admin/contenidos/${c.id}`}
                  className="rounded-md px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  Editar
                </Link>
                <DeleteButton action={deleteContent} id={c.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteProduct } from '@/app/actions/admin'
import { DeleteButton } from '@/components/admin/DeleteButton'

export const metadata: Metadata = { title: 'Cursos — Admin' }

export default async function ProductosPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').order('sort_order').order('name'),
    supabase.from('categories').select('id, name'),
  ])

  const categoryMap = Object.fromEntries(
    (categories ?? []).map((c) => [c.id, c.name])
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Cursos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          + Nuevo
        </Link>
      </div>

      {!products?.length ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <p className="text-[var(--text-muted)]">No hay cursos todavía.</p>
          <Link
            href="/admin/productos/nuevo"
            className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">
                  {p.name}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  /{p.slug} · orden {p.sort_order}
                  {p.category_id ? (
                    <> · <span className="text-[var(--text-secondary)]">{categoryMap[p.category_id] ?? '—'}</span></>
                  ) : (
                    <> · <span className="italic">Sin categoría</span></>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/admin/productos/${p.id}`}
                  className="rounded-md px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  Editar
                </Link>
                <DeleteButton action={deleteProduct} id={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

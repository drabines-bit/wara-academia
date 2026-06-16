import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteCategory } from '@/app/actions/admin'
import { DeleteButton } from '@/components/admin/DeleteButton'

export const metadata: Metadata = { title: 'Categorías — Admin' }

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Categorías</h1>
        <Link
          href="/admin/categorias/nuevo"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          + Nueva
        </Link>
      </div>

      <p className="text-sm text-[var(--text-muted)]">
        Cada producto pertenece a una categoría. Los usuarios solo ven los productos de sus categorías asignadas.
      </p>

      {!categories?.length ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
          <p className="text-[var(--text-muted)]">No hay categorías todavía.</p>
          <Link
            href="/admin/categorias/nuevo"
            className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Crear la primera
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3"
            >
              <div className="min-w-0 flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--text-primary)] truncate">{c.name}</p>
                    {c.is_default && (
                      <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                        Por defecto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    /{c.slug} · orden {c.sort_order}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/admin/categorias/${c.id}`}
                  className="rounded-md px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  Editar
                </Link>
                <DeleteButton action={deleteCategory} id={c.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

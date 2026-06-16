import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CategoryForm } from '@/components/admin/CategoryForm'
import type { Category } from '@/types/database'

export const metadata: Metadata = { title: 'Editar categoría — Admin' }

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single() as { data: Category | null }

  if (!category) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/categorias"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Categorías
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
          Editar: {category.name}
        </h1>
      </div>
      <CategoryForm category={category} />
    </div>
  )
}

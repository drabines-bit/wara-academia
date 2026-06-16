import type { Metadata } from 'next'
import Link from 'next/link'
import { CategoryForm } from '@/components/admin/CategoryForm'

export const metadata: Metadata = { title: 'Nueva categoría — Admin' }

export default function NuevaCategoriaPage() {
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
          Nueva categoría
        </h1>
      </div>
      <CategoryForm />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductForm } from '@/components/admin/ProductForm'

export const metadata: Metadata = { title: 'Nuevo producto — Admin' }

export default function NuevoProductoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/productos"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Productos
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
          Nuevo producto
        </h1>
      </div>
      <ProductForm />
    </div>
  )
}

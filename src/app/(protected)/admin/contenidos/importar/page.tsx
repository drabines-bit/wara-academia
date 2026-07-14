import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BulkImportForm } from '@/components/admin/BulkImportForm'

export const metadata: Metadata = { title: 'Importar contenidos — Admin' }

export default async function ImportarContenidosPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/contenidos"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Contenidos
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
          Importar contenidos
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Cargá varios contenidos de una vez pegando links de Google Drive o filas de una planilla.
        </p>
      </div>
      <BulkImportForm
        products={products ?? []}
        driveApiEnabled={!!process.env.GOOGLE_DRIVE_API_KEY}
      />
    </div>
  )
}

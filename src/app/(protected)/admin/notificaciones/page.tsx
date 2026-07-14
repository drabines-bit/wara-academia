import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { NotificationSendForm } from '@/components/admin/NotificationSendForm'

export const metadata: Metadata = { title: 'Enviar notificación — Admin' }

export default async function NotificacionesAdminPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Enviar notificación
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          El aviso aparece en la campanita de los alumnos seleccionados.
        </p>
      </div>
      <NotificationSendForm products={products ?? []} />
    </div>
  )
}

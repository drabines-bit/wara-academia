import type { Metadata } from 'next'
import { OdooDiagnostics } from '@/components/admin/OdooDiagnostics'

export const metadata: Metadata = { title: 'Conexión a Odoo — Admin' }

export default function OdooAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Conexión a Odoo
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Diagnóstico de la integración que aprueba automáticamente a los
          alumnos cuyo email figura en los contactos de la empresa.
        </p>
      </div>
      <OdooDiagnostics />
    </div>
  )
}

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CertificateSettingsForm } from '@/components/admin/CertificateSettingsForm'
import type { CertificateSettings } from '@/types/database'

export const metadata: Metadata = { title: 'Plantilla de certificado — Admin' }

export default async function CertificadoAdminPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('certificate_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle() as { data: CertificateSettings | null }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Plantilla de certificado
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Los alumnos que completan el 100% de un curso pueden descargar este
          certificado en PDF con su nombre, el curso y las firmas configuradas acá.
        </p>
      </div>
      <CertificateSettingsForm settings={settings} />
    </div>
  )
}

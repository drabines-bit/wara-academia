import type { Metadata } from 'next'
import { WelcomeSettingsForm } from '@/components/admin/WelcomeSettingsForm'
import { getWelcomeSettings } from '@/lib/onboarding'

export const metadata: Metadata = { title: 'Pantalla de bienvenida — Admin' }

export default async function BienvenidaAdminPage() {
  const welcome = await getWelcomeSettings()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Pantalla de bienvenida
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Es lo primero que ve el alumno hasta completar el curso obligatorio:
          qué es WARA, el objetivo de la academia y sus limitaciones.
        </p>
      </div>
      <WelcomeSettingsForm initialTitle={welcome.title} initialBody={welcome.body} />
    </div>
  )
}

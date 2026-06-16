import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { LogoutButton } from '@/components/auth/LogoutButton'

export const metadata: Metadata = { title: 'Cuenta en revisión' }

export default function PendientePage() {
  return (
    <AuthCard title="Tu cuenta está en revisión">
      <div className="flex flex-col gap-6">
        <div className="rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30 px-4 py-4">
          <p className="text-sm text-[var(--text-primary)]">
            Confirmaste tu email correctamente. El equipo WARA GPS va a revisar
            tu solicitud y te notificaremos cuando tengas acceso al material de
            capacitación.
          </p>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Si tenés alguna consulta, contactate con el equipo WARA GPS.
        </p>
        <div className="flex justify-center pt-2">
          <LogoutButton />
        </div>
      </div>
    </AuthCard>
  )
}

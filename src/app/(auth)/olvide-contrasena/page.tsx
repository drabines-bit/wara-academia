import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { OlvideMiContraseniaForm } from '@/components/auth/OlvideMiContraseniaForm'

export const metadata: Metadata = { title: 'Recuperar contraseña' }

export default function OlvideContrasenaPage() {
  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Te enviamos un link para restablecer tu contraseña."
    >
      <OlvideMiContraseniaForm />
    </AuthCard>
  )
}

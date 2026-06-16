import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { RegistroForm } from '@/components/auth/RegistroForm'

export const metadata: Metadata = { title: 'Crear cuenta' }

export default function RegistroPage() {
  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Completá tus datos para solicitar acceso."
    >
      <RegistroForm />
    </AuthCard>
  )
}

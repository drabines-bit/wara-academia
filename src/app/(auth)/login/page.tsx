import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Iniciar sesión' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ rechazado?: string; password_actualizado?: string }>
}) {
  const params = await searchParams

  return (
    <AuthCard title="Bienvenido" subtitle="Ingresá a tu cuenta para continuar.">
      <LoginForm
        rechazado={params.rechazado === 'true'}
        passwordActualizado={params.password_actualizado === 'true'}
      />
    </AuthCard>
  )
}

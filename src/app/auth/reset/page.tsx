import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthCard } from '@/components/auth/AuthCard'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = { title: 'Nueva contraseña' }

// El usuario llega aquí después de pasar por /auth/callback que intercambió el code.
// Si no hay sesión activa, no puede cambiar la contraseña.
export default async function ResetPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AuthCard title="Nueva contraseña">
          <ResetPasswordForm />
        </AuthCard>
      </div>
    </main>
  )
}

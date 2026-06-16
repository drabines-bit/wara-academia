import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'

export const metadata: Metadata = { title: 'Revisá tu email' }

export default function RegistroEnviadoPage() {
  return (
    <AuthCard title="Revisá tu email">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 px-4 py-4">
          <p className="text-sm text-[var(--text-primary)]">
            Te enviamos un email de confirmación. Hacé clic en el link para
            activar tu cuenta.
          </p>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Una vez que confirmes tu email, el equipo WARA GPS revisará tu
          solicitud y te avisaremos cuando tengas acceso.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          ¿No llegó el email? Revisá la carpeta de spam o{' '}
          <Link
            href="/registro"
            className="text-[var(--accent)] hover:underline"
          >
            intentá registrarte nuevamente
          </Link>
          .
        </p>
      </div>
    </AuthCard>
  )
}

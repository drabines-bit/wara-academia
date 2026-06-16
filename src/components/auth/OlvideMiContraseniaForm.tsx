'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function OlvideMiContraseniaForm() {
  const [state, action, isPending] = useActionState(
    requestPasswordReset,
    undefined
  )

  if (state?.success) {
    return (
      <div className="rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 px-4 py-4 text-sm text-[var(--text-primary)]">
        <p className="font-medium text-[var(--success)] mb-1">Email enviado</p>
        <p className="text-[var(--text-secondary)]">
          Si ese email está registrado, vas a recibir un link para restablecer
          tu contraseña en los próximos minutos.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-sm text-[var(--text-secondary)]">
        Ingresá tu email y te enviamos un link para restablecer tu contraseña.
      </p>

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="vos@ejemplo.com"
      />

      {state?.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full mt-1">
        Enviar link
      </Button>

      <Link
        href="/login"
        className="text-center text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        ← Volver al login
      </Link>
    </form>
  )
}

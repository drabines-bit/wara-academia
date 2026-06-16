'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function LoginForm({
  rechazado,
  passwordActualizado,
}: {
  rechazado?: boolean
  passwordActualizado?: boolean
}) {
  const [state, action, isPending] = useActionState(signIn, undefined)

  return (
    <form action={action} className="flex flex-col gap-5">
      {rechazado && (
        <div className="rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-4 py-3 text-sm text-[var(--danger)]">
          Tu solicitud de acceso no fue aprobada. Contactate con el equipo WARA GPS.
        </div>
      )}
      {passwordActualizado && (
        <div className="rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 px-4 py-3 text-sm text-[var(--success)]">
          Contraseña actualizada. Ya podés ingresar.
        </div>
      )}

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="vos@ejemplo.com"
      />
      <div className="flex flex-col gap-1.5">
        <Input
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
        <Link
          href="/olvide-contrasena"
          className="self-end text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {state?.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full mt-1">
        Ingresar
      </Button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        ¿No tenés cuenta?{' '}
        <Link
          href="/registro"
          className="text-[var(--accent)] hover:underline font-medium"
        >
          Registrate
        </Link>
      </p>
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function RegistroForm() {
  const [state, action, isPending] = useActionState(signUp, undefined)

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input
        label="Nombre completo"
        name="full_name"
        type="text"
        autoComplete="name"
        required
        placeholder="Juan Pérez"
      />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="vos@ejemplo.com"
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        placeholder="Mínimo 8 caracteres"
      />
      <Input
        label="Confirmar contraseña"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        required
        placeholder="Repetí la contraseña"
      />

      {state?.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full mt-1">
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/login"
          className="text-[var(--accent)] hover:underline font-medium"
        >
          Ingresá
        </Link>
      </p>
    </form>
  )
}

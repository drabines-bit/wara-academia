'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ResetPasswordForm() {
  const [state, action, isPending] = useActionState(updatePassword, undefined)

  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-sm text-[var(--text-secondary)]">
        Elegí una nueva contraseña para tu cuenta.
      </p>

      <Input
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        placeholder="Mínimo 8 caracteres"
      />
      <Input
        label="Confirmar nueva contraseña"
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
        Actualizar contraseña
      </Button>
    </form>
  )
}

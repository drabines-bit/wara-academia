'use client'

import { useActionState } from 'react'
import { updateFullName } from '@/app/actions/profile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function NameForm({ currentName }: { currentName: string }) {
  const [state, formAction, isPending] = useActionState(updateFullName, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        label="Nombre completo"
        name="full_name"
        defaultValue={currentName}
        placeholder="Tu nombre y apellido"
        required
      />
      {state?.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-[var(--success)]">✓ Nombre actualizado.</p>
      )}
      <Button type="submit" loading={isPending} className="w-fit">
        Guardar nombre
      </Button>
    </form>
  )
}

'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function DeleteButton({
  action,
  id,
  label = 'Eliminar',
}: {
  action: (formData: FormData) => Promise<void>
  id: string
  label?: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm('¿Confirmar eliminación? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append('id', id)
      await action(fd)
    })
  }

  return (
    <Button
      variant="ghost"
      loading={isPending}
      onClick={handleClick}
      className="text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10"
    >
      {label}
    </Button>
  )
}

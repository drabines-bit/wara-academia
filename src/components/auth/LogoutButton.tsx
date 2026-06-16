'use client'

import { useTransition } from 'react'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      loading={isPending}
      onClick={() => startTransition(() => signOut())}
    >
      Cerrar sesión
    </Button>
  )
}

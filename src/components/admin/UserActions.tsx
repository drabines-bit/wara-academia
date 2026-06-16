'use client'

import { useTransition, useState } from 'react'
import { approveUser, rejectUser, changeUserRole, deleteUser } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import type { UserRole, UserStatus } from '@/types/database'

export function UserActions({
  id,
  status,
  role,
}: {
  id: string
  status: UserStatus
  role: UserRole
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const run = (action: (fd: FormData) => Promise<void>, extra?: Record<string, string>) =>
    startTransition(async () => {
      const fd = new FormData()
      fd.append('id', id)
      if (extra) Object.entries(extra).forEach(([k, v]) => fd.append(k, v))
      await action(fd)
    })

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'pending' && (
        <>
          <Button
            variant="primary"
            loading={isPending}
            onClick={() => run(approveUser)}
            className="text-xs py-1.5 px-3"
          >
            Aprobar
          </Button>
          <Button
            variant="danger"
            loading={isPending}
            onClick={() => run(rejectUser)}
            className="text-xs py-1.5 px-3"
          >
            Rechazar
          </Button>
        </>
      )}
      {status === 'approved' && (
        <Button
          variant="danger"
          loading={isPending}
          onClick={() => run(rejectUser)}
          className="text-xs py-1.5 px-3"
        >
          Revocar
        </Button>
      )}
      {status === 'rejected' && (
        <Button
          variant="ghost"
          loading={isPending}
          onClick={() => run(approveUser)}
          className="text-xs py-1.5 px-3"
        >
          Aprobar
        </Button>
      )}
      <Button
        variant="ghost"
        loading={isPending}
        onClick={() =>
          run(changeUserRole, { role: role === 'admin' ? 'alumno' : 'admin' })
        }
        className="text-xs py-1.5 px-3"
      >
        {role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
      </Button>

      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">¿Eliminar permanentemente?</span>
          <Button
            variant="danger"
            loading={isPending}
            onClick={() => run(deleteUser)}
            className="text-xs py-1.5 px-3"
          >
            Sí, eliminar
          </Button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-md px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
        >
          Eliminar
        </button>
      )}
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import type { UserAudience, UserRole, UserStatus } from '@/types/database'

export function UserActions({
  status,
  role,
  audience,
  pending,
  onApprove,
  onReject,
  onToggleRole,
  onToggleAudience,
  onDelete,
}: {
  status: UserStatus
  role: UserRole
  audience: UserAudience
  pending: boolean
  onApprove: () => void
  onReject: () => void
  onToggleRole: () => void
  onToggleAudience: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === 'pending' && (
        <>
          <Button variant="primary" loading={pending} onClick={onApprove} className="text-xs py-1.5 px-3">
            Aprobar
          </Button>
          <Button variant="danger" loading={pending} onClick={onReject} className="text-xs py-1.5 px-3">
            Rechazar
          </Button>
        </>
      )}
      {status === 'approved' && (
        <Button variant="danger" loading={pending} onClick={onReject} className="text-xs py-1.5 px-3">
          Revocar
        </Button>
      )}
      {status === 'rejected' && (
        <Button variant="ghost" loading={pending} onClick={onApprove} className="text-xs py-1.5 px-3">
          Aprobar
        </Button>
      )}
      <Button variant="ghost" loading={pending} onClick={onToggleRole} className="text-xs py-1.5 px-3">
        {role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
      </Button>
      <Button variant="ghost" loading={pending} onClick={onToggleAudience} className="text-xs py-1.5 px-3">
        {audience === 'empleado' ? 'Marcar como cliente' : 'Marcar como empleado'}
      </Button>
      <button
        onClick={onDelete}
        disabled={pending}
        className="rounded-md px-3 py-1.5 text-xs text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10 disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  )
}

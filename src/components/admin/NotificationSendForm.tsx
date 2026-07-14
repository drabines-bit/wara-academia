'use client'

import { useActionState } from 'react'
import { sendCourseNotification } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types/database'

const SELECT_CLASS =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline focus:outline-2 focus:outline-[var(--accent)]'

export function NotificationSendForm({ products }: { products: Product[] }) {
  const [state, formAction, isPending] = useActionState(sendCourseNotification, undefined)

  if (state?.sent) {
    return (
      <div className="flex max-w-lg flex-col gap-5">
        <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-6 text-center">
          <p className="text-lg font-bold text-[var(--text-primary)]">
            Notificación enviada
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            La van a ver {state.sent} alumno{state.sent === 1 ? '' : 's'} en su campanita.
          </p>
        </div>
        <a
          href="/admin/notificaciones"
          className="self-start rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] transition-colors"
        >
          Enviar otra
        </a>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Destinatarios
        </label>
        <select name="product_id" defaultValue="" className={SELECT_CLASS}>
          <option value="">Todos los alumnos aprobados</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              Alumnos con acceso a: {p.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--text-muted)]">
          Si elegís un curso, la notificación llega solo a los alumnos que lo
          tienen habilitado por categoría, y el aviso los lleva a ese curso.
        </p>
      </div>

      <Input
        label="Título"
        name="title"
        required
        maxLength={120}
        placeholder="Ej: Nueva capacitación disponible"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Mensaje (opcional)
        </label>
        <textarea
          name="body"
          rows={3}
          maxLength={500}
          placeholder="Texto breve que se muestra debajo del título"
          className={SELECT_CLASS}
        />
      </div>

      {state?.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}

      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          Enviar notificación
        </Button>
        <a
          href="/admin"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}

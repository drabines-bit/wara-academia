'use client'

import { useTransition, useState, useEffect } from 'react'
import { updateUserCategories } from '@/app/actions/admin'
import type { Category } from '@/types/database'

export function UserCategorySelect({
  userId,
  allCategories,
  assignedIds,
}: {
  userId: string
  allCategories: Category[]
  assignedIds: string[]
}) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds))

  useEffect(() => {
    if (!editing) setSelected(new Set(assignedIds))
  }, [assignedIds, editing])

  const assignedCategories = allCategories.filter((c) => assignedIds.includes(c.id))

  function handleSave() {
    const fd = new FormData()
    fd.append('user_id', userId)
    selected.forEach((id) => fd.append('category_ids', id))
    startTransition(async () => {
      await updateUserCategories(fd)
      setEditing(false)
    })
  }

  if (!editing) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-[var(--text-muted)]">Categorías:</span>
        {assignedCategories.length > 0 ? (
          assignedCategories.map((c) => (
            <span
              key={c.id}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
            >
              {c.name}
            </span>
          ))
        ) : (
          <span className="text-xs italic text-[var(--text-muted)]">Sin asignación</span>
        )}
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-[var(--accent)] hover:underline ml-1"
        >
          Editar
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {allCategories.map((c) => (
          <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(c.id)}
              onChange={(e) => {
                const next = new Set(selected)
                if (e.target.checked) next.add(c.id)
                else next.delete(c.id)
                setSelected(next)
              }}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            <span className="text-xs text-[var(--text-secondary)]">{c.name}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-[var(--accent)] px-3 py-1 text-xs font-medium text-[var(--accent-fg)] disabled:opacity-50 hover:bg-[var(--accent-hover)] transition-colors"
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          onClick={() => { setEditing(false); setSelected(new Set(assignedIds)) }}
          disabled={isPending}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

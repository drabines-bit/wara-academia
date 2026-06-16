'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createCategory, updateCategory } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { slugify } from '@/lib/utils'
import type { Category } from '@/types/database'

export function CategoryForm({ category }: { category?: Category }) {
  const action = category ? updateCategory : createCategory
  const [state, formAction, isPending] = useActionState(action, undefined)
  const slugRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (category) return
    const input = nameRef.current
    const slugInput = slugRef.current
    if (!input || !slugInput) return
    const handler = () => { slugInput.value = slugify(input.value) }
    input.addEventListener('input', handler)
    return () => input.removeEventListener('input', handler)
  }, [category])

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-lg">
      {category && <input type="hidden" name="id" value={category.id} />}

      <Input
        ref={nameRef}
        label="Nombre"
        name="name"
        required
        defaultValue={category?.name}
        placeholder="Ej: Sector Privado"
      />
      <div className="flex flex-col gap-1.5">
        <Input
          ref={slugRef}
          label="Slug (URL)"
          name="slug"
          required
          defaultValue={category?.slug}
          placeholder="sector-privado"
        />
        <p className="text-xs text-[var(--text-muted)]">
          Se usa como identificador interno. Solo minúsculas, números y guiones.
        </p>
      </div>
      <Input
        label="Orden"
        name="sort_order"
        type="number"
        defaultValue={category?.sort_order ?? 0}
        min={0}
      />
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          name="is_default"
          defaultChecked={category?.is_default ?? false}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        <span className="text-sm text-[var(--text-secondary)]">
          Categoría por defecto (asignada automáticamente al aprobar usuarios)
        </span>
      </label>

      {state?.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {category ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
        <a
          href="/admin/categorias"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}

'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createProduct, updateProduct } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { slugify } from '@/lib/utils'
import type { Category, Product } from '@/types/database'

export function ProductForm({
  product,
  categories,
}: {
  product?: Product
  categories: Category[]
}) {
  const action = product ? updateProduct : createProduct
  const [state, formAction, isPending] = useActionState(action, undefined)
  const slugRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (product) return
    const input = nameRef.current
    const slugInput = slugRef.current
    if (!input || !slugInput) return
    const handler = () => { slugInput.value = slugify(input.value) }
    input.addEventListener('input', handler)
    return () => input.removeEventListener('input', handler)
  }, [product])

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-lg">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Input
        ref={nameRef}
        label="Nombre"
        name="name"
        required
        defaultValue={product?.name}
        placeholder="Ej: Rastreo vehicular"
      />
      <div className="flex flex-col gap-1.5">
        <Input
          ref={slugRef}
          label="Slug (URL)"
          name="slug"
          required
          defaultValue={product?.slug}
          placeholder="rastreo-vehicular"
        />
        <p className="text-xs text-[var(--text-muted)]">
          Se usa en la URL. Solo minúsculas, números y guiones.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Descripción
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description ?? ''}
          placeholder="Descripción breve del producto (opcional)"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline focus:outline-2 focus:outline-[var(--accent)]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Categoría
        </label>
        <select
          name="category_id"
          defaultValue={product?.category_id ?? ''}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline focus:outline-2 focus:outline-[var(--accent)]"
        >
          <option value="">Sin categoría (visible para todos)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Input
        label="Orden"
        name="sort_order"
        type="number"
        defaultValue={product?.sort_order ?? 0}
        min={0}
      />

      {state?.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
        <a
          href="/admin/productos"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}

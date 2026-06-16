'use client'

import { useActionState } from 'react'
import { createContent, updateContent } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Content, Product } from '@/types/database'

const COMPLEXITY = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
]

const TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
]

const SELECT_CLASS =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline focus:outline-2 focus:outline-[var(--accent)]'

export function ContentForm({
  content,
  products,
}: {
  content?: Content
  products: Product[]
}) {
  const action = content ? updateContent : createContent
  const [state, formAction, isPending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-lg">
      {content && <input type="hidden" name="id" value={content.id} />}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Producto
        </label>
        <select
          name="product_id"
          required
          defaultValue={content?.product_id}
          className={SELECT_CLASS}
        >
          <option value="">Seleccioná un producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Título"
        name="title"
        required
        defaultValue={content?.title}
        placeholder="Ej: Configuración inicial del dispositivo"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Descripción
        </label>
        <textarea
          name="description"
          rows={2}
          defaultValue={content?.description ?? ''}
          placeholder="Descripción breve (opcional)"
          className={SELECT_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Nivel
          </label>
          <select
            name="complexity"
            required
            defaultValue={content?.complexity ?? 'basico'}
            className={SELECT_CLASS}
          >
            {COMPLEXITY.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Tipo
          </label>
          <select
            name="type"
            required
            defaultValue={content?.type ?? 'video'}
            className={SELECT_CLASS}
          >
            {TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label="ID de Google Drive"
          name="drive_file_id"
          required
          defaultValue={content?.drive_file_id}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
        />
        <p className="text-xs text-[var(--text-muted)]">
          El ID está en la URL de Drive:{' '}
          <span className="font-mono">drive.google.com/file/d/<strong>ID</strong>/view</span>
        </p>
      </div>

      <Input
        label="Orden"
        name="sort_order"
        type="number"
        defaultValue={content?.sort_order ?? 0}
        min={0}
      />

      {state?.error && (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {content ? 'Guardar cambios' : 'Crear contenido'}
        </Button>
        <a
          href="/admin/contenidos"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}

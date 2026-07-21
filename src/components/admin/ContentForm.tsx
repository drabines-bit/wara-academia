'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { createContent, updateContent } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Content, ContentSource, Product } from '@/types/database'

const COMPLEXITY = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
]

const TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'audio', label: 'Audio' },
  { value: 'otro', label: 'Otro (descargable)' },
]

const SOURCES: { value: ContentSource; label: string }[] = [
  { value: 'drive', label: 'Google Drive' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'web', label: 'Sitio web' },
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
  const [source, setSource] = useState<ContentSource>(content?.source ?? 'drive')

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-lg">
      {content && <input type="hidden" name="id" value={content.id} />}
      <input type="hidden" name="source" value={source} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Curso
        </label>
        <select
          name="product_id"
          required
          defaultValue={content?.product_id}
          className={SELECT_CLASS}
        >
          <option value="">Seleccioná un curso</option>
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Fuente
        </label>
        <div className="flex gap-2">
          {SOURCES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSource(value)}
              className={[
                'flex-1 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors',
                source === value
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent)]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
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
          {source === 'youtube' || source === 'web' ? (
            <>
              <input type="hidden" name="type" value={source === 'youtube' ? 'video' : 'web'} />
              <select
                disabled
                value={source === 'youtube' ? 'video' : 'web'}
                className={`${SELECT_CLASS} cursor-not-allowed opacity-60`}
              >
                <option value="video">Video</option>
                <option value="web">Sitio web</option>
              </select>
            </>
          ) : (
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
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {source === 'youtube' ? (
          <>
            <Input
              label="Link o ID de YouTube"
              name="external_id"
              required
              defaultValue={content?.source === 'youtube' ? content.external_id : ''}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            />
            <p className="text-xs text-[var(--text-muted)]">
              Pegá el link completo del video (o el ID de 11 caracteres). Acepta{' '}
              <span className="font-mono">youtube.com/watch?v=</span>,{' '}
              <span className="font-mono">youtu.be/</span> y{' '}
              <span className="font-mono">youtube.com/shorts/</span>.
            </p>
          </>
        ) : source === 'web' ? (
          <>
            <Input
              label="URL del sitio"
              name="external_id"
              type="url"
              required
              defaultValue={content?.source === 'web' ? content.external_id : ''}
              placeholder="https://wara-docs.vercel.app/docs/auth"
            />
            <p className="text-xs text-[var(--text-muted)]">
              Se embebe tal cual dentro de la página del contenido. El sitio tiene que
              permitir ser mostrado en un iframe (sin encabezados <span className="font-mono">X-Frame-Options</span> /{' '}
              <span className="font-mono">CSP frame-ancestors</span> que lo bloqueen).
            </p>
          </>
        ) : (
          <>
            <Input
              label="ID de Google Drive"
              name="external_id"
              required
              defaultValue={content && content.source !== 'youtube' && content.source !== 'web' ? content.external_id : ''}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            />
            <p className="text-xs text-[var(--text-muted)]">
              El ID está en la URL de Drive:{' '}
              <span className="font-mono">drive.google.com/file/d/<strong>ID</strong>/view</span>
            </p>
          </>
        )}
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
        <Link
          href="/admin/contenidos"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}

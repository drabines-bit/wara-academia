'use client'

import { useActionState } from 'react'
import { createNews, updateNews } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { News, NewsAudience, NewsCategory, Product } from '@/types/database'

const SELECT_CLASS =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline focus:outline-2 focus:outline-[var(--accent)]'

const CATEGORY_OPTIONS: { value: NewsCategory; label: string }[] = [
  { value: 'feature', label: 'Nuevo feature de la plataforma' },
  { value: 'producto', label: 'Nuevo producto/curso' },
  { value: 'empleados', label: 'Novedades para empleados' },
  { value: 'general', label: 'General' },
]

const AUDIENCE_OPTIONS: { value: NewsAudience; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'cliente', label: 'Solo clientes' },
  { value: 'empleado', label: 'Solo empleados' },
]

/** Convierte un timestamptz (UTC) al valor que espera <input type="datetime-local">,
 *  mostrado siempre en hora de Argentina sin importar la zona del navegador. */
function toArInputValue(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

export function NewsForm({ news, products }: { news?: News; products: Product[] }) {
  const action = news ? updateNews : createNews
  const [state, formAction, isPending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-5">
      {news && <input type="hidden" name="id" value={news.id} />}

      <Input
        label="Título"
        name="title"
        required
        maxLength={120}
        defaultValue={news?.title}
        placeholder="Ej: Nueva función de certificados"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Cuerpo</label>
        <textarea
          name="body"
          required
          rows={5}
          maxLength={2000}
          defaultValue={news?.body}
          placeholder="Contá la novedad con el detalle que haga falta"
          className={SELECT_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Categoría</label>
        <select name="category" defaultValue={news?.category ?? 'general'} className={SELECT_CLASS}>
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Audiencia</label>
        <select name="audience" defaultValue={news?.audience ?? 'todos'} className={SELECT_CLASS}>
          {AUDIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Curso relacionado (opcional)
        </label>
        <select name="product_id" defaultValue={news?.product_id ?? ''} className={SELECT_CLASS}>
          <option value="">Sin curso asociado</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label="Publicar el"
          name="publish_at"
          type="datetime-local"
          defaultValue={news ? toArInputValue(news.publish_at) : ''}
        />
        <p className="text-xs text-[var(--text-muted)]">
          Hora de Argentina. Dejalo vacío para publicar ahora mismo.
        </p>
      </div>

      {state?.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}

      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {news ? 'Guardar cambios' : 'Publicar novedad'}
        </Button>
        <a
          href="/admin/novedades"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}

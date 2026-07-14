'use client'

import { useActionState, useState } from 'react'
import { updateWelcomeSettings } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function WelcomeSettingsForm({
  initialTitle,
  initialBody,
}: {
  initialTitle: string
  initialBody: string
}) {
  const [state, formAction, isPending] = useActionState(updateWelcomeSettings, undefined)
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* ── Formulario ── */}
      <form action={formAction} className="flex flex-col gap-5">
        <Input
          label="Título"
          name="title"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¡Bienvenido a la Academia WARA!"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Texto de bienvenida
          </label>
          <textarea
            name="body"
            required
            rows={14}
            maxLength={4000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline focus:outline-2 focus:outline-[var(--accent)] leading-relaxed"
          />
          <p className="text-xs text-[var(--text-muted)]">
            Separá los párrafos con una línea en blanco. Acá va qué es WARA, el
            objetivo de la academia y sus limitaciones.
          </p>
        </div>

        {state?.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
        {state?.success && (
          <p className="text-sm text-[var(--success)]">Bienvenida guardada correctamente.</p>
        )}

        <Button type="submit" loading={isPending} className="self-start">
          Guardar
        </Button>
      </form>

      {/* ── Vista previa ── */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Vista previa (lo que ve el alumno)
        </p>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {title || 'Título de bienvenida'}
          </h1>
          <div className="mt-3 flex flex-col gap-3">
            {(body || 'Texto de bienvenida…').split(/\n\s*\n/).map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Tu primer paso
            </span>
            <span className="rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-xs font-medium text-[var(--warning)]">
              Obligatorio
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            (Debajo aparece la card del curso obligatorio y, más abajo, el resto
            de los cursos bloqueados.)
          </p>
        </div>
      </div>
    </div>
  )
}

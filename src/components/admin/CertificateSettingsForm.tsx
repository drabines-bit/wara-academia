'use client'

import { useActionState, useState } from 'react'
import { updateCertificateSettings } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { CertificateSettings } from '@/types/database'

function SignaturePreview({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <p className="text-xs italic text-[var(--text-muted)]">
        Sin firma cargada — el certificado deja la línea para firma manuscrita.
      </p>
    )
  }
  return (
    <div className="flex items-center gap-2">
      {/* Fondo blanco: las firmas PNG suelen ser tinta oscura */}
      <div className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Firma de ${label}`} className="h-10 w-auto" />
      </div>
      <span className="text-xs text-[var(--text-muted)]">Firma actual</span>
    </div>
  )
}

export function CertificateSettingsForm({
  settings,
}: {
  settings: CertificateSettings | null
}) {
  const [state, formAction, isPending] = useActionState(updateCertificateSettings, undefined)

  // Vista previa en vivo de los nombres
  const [disertante, setDisertante] = useState(settings?.disertante_name ?? '')
  const [disertanteTitle, setDisertanteTitle] = useState(settings?.disertante_title ?? 'Disertante')
  const [presidente, setPresidente] = useState(settings?.presidente_name ?? '')
  const [presidenteTitle, setPresidenteTitle] = useState(settings?.presidente_title ?? 'Presidente')

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* ── Formulario ── */}
      <form action={formAction} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <legend className="px-1 text-sm font-semibold text-[var(--text-primary)]">
            Disertante
          </legend>
          <Input
            id="disertante-name"
            label="Nombre"
            name="disertante_name"
            required
            value={disertante}
            onChange={(e) => setDisertante(e.target.value)}
            placeholder="Ej: Ing. Juan Pérez"
          />
          <Input
            id="disertante-title"
            label="Cargo"
            name="disertante_title"
            value={disertanteTitle}
            onChange={(e) => setDisertanteTitle(e.target.value)}
            placeholder="Disertante"
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Imagen de firma (PNG, fondo transparente, máx. 1 MB)
            </label>
            <input
              type="file"
              name="disertante_signature"
              accept="image/png"
              className="text-xs text-[var(--text-secondary)] file:mr-3 file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--bg-card)] file:px-3 file:py-1.5 file:text-xs file:text-[var(--text-secondary)] file:cursor-pointer"
            />
            <SignaturePreview url={settings?.disertante_signature_url ?? null} label="disertante" />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <legend className="px-1 text-sm font-semibold text-[var(--text-primary)]">
            Presidente
          </legend>
          <Input
            id="presidente-name"
            label="Nombre"
            name="presidente_name"
            required
            value={presidente}
            onChange={(e) => setPresidente(e.target.value)}
            placeholder="Ej: Lic. María González"
          />
          <Input
            id="presidente-title"
            label="Cargo"
            name="presidente_title"
            value={presidenteTitle}
            onChange={(e) => setPresidenteTitle(e.target.value)}
            placeholder="Presidente"
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Imagen de firma (PNG, fondo transparente, máx. 1 MB)
            </label>
            <input
              type="file"
              name="presidente_signature"
              accept="image/png"
              className="text-xs text-[var(--text-secondary)] file:mr-3 file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--bg-card)] file:px-3 file:py-1.5 file:text-xs file:text-[var(--text-secondary)] file:cursor-pointer"
            />
            <SignaturePreview url={settings?.presidente_signature_url ?? null} label="presidente" />
          </div>
        </fieldset>

        {state?.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
        {state?.success && (
          <p className="text-sm text-[var(--success)]">Plantilla guardada correctamente.</p>
        )}

        <Button type="submit" loading={isPending} className="self-start">
          Guardar plantilla
        </Button>
      </form>

      {/* ── Vista previa ── */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[var(--text-secondary)]">Vista previa</p>
        <div className="aspect-[297/210] w-full select-none rounded-lg bg-white p-[4%] shadow-lg">
          <div className="flex h-full flex-col items-center border-2 border-[#1a2030] p-[2%]">
            <div className="flex h-full w-full flex-col items-center justify-between border border-[#b91c1c] px-[4%] py-[3%] text-center">
              <div>
                <p className="text-[1.4vw] lg:text-[0.65rem] font-bold tracking-[0.3em] text-[#b91c1c]">
                  ACADEMIA WARA GPS
                </p>
                <p className="mt-[2%] font-serif text-[3vw] lg:text-[1.35rem] font-bold text-[#1a2030]">
                  CERTIFICADO DE FINALIZACIÓN
                </p>
                <div className="mx-auto mt-1 h-px w-24 bg-[#b91c1c]" />
              </div>

              <div>
                <p className="font-serif text-[1.6vw] lg:text-[0.7rem] text-[#6b7280]">
                  Se certifica que
                </p>
                <p className="mt-1 font-serif text-[3vw] lg:text-[1.3rem] italic text-[#1a2030]">
                  Nombre del Alumno
                </p>
                <div className="mx-auto mt-0.5 h-px w-48 bg-[#8b909a]" />
                <p className="mt-2 font-serif text-[1.6vw] lg:text-[0.7rem] text-[#6b7280]">
                  completó satisfactoriamente la capacitación
                </p>
                <p className="mt-1 font-serif text-[2.2vw] lg:text-[1rem] font-bold text-[#1a2030]">
                  Nombre del Curso
                </p>
                <p className="mt-1.5 font-serif text-[1.3vw] lg:text-[0.6rem] text-[#6b7280]">
                  Emitido el 14 de julio de 2026
                </p>
              </div>

              <div className="flex w-full justify-around">
                {[
                  { name: disertante || 'Nombre del disertante', title: disertanteTitle || 'Disertante', url: settings?.disertante_signature_url },
                  { name: presidente || 'Nombre del presidente', title: presidenteTitle || 'Presidente', url: settings?.presidente_signature_url },
                ].map((s, i) => (
                  <div key={i} className="flex w-[36%] flex-col items-center">
                    <div className="flex h-8 items-end justify-center">
                      {s.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.url} alt="" className="max-h-8 w-auto" />
                      )}
                    </div>
                    <div className="w-full border-t border-[#1a2030] pt-1">
                      <p className="text-[1.3vw] lg:text-[0.55rem] font-semibold text-[#1a2030]">
                        {s.name}
                      </p>
                      <p className="text-[1.1vw] lg:text-[0.5rem] text-[#6b7280]">{s.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Representación aproximada del PDF A4 apaisado que descarga el alumno.
        </p>
      </div>
    </div>
  )
}

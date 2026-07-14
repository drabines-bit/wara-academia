'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  findExistingDriveIds,
  bulkCreateContents,
  scanDriveFolder,
  type BulkImportResult,
} from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import type { ComplexityLevel, ContentType, Product } from '@/types/database'

const COMPLEXITY = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
] as const

const TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'audio', label: 'Audio' },
  { value: 'otro', label: 'Otro (descargable)' },
] as const

const SELECT_CLASS =
  'rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-2 text-sm text-[var(--text-primary)] focus:outline focus:outline-2 focus:outline-[var(--accent)]'

const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline focus:outline-2 focus:outline-[var(--accent)]'

type ParsedRow = {
  key: number
  title: string
  description: string
  complexity: ComplexityLevel
  type: ContentType
  driveFileId: string
  rawLine: string
  problem: 'duplicado' | 'invalido' | null
}

/** Extrae el ID de archivo de las distintas formas de URL de Drive, o de un ID pelado */
function extractDriveId(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  if (/\/drive\/folders\//.test(s)) return null // carpeta, no archivo
  const fileMatch = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]
  const idParam = s.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idParam) return idParam[1]
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s // ID pelado
  return null
}

/** Normaliza nivel escrito a mano ("Básico", "basico", "INTERMEDIO"…) */
function parseComplexity(raw: string | undefined, fallback: ComplexityLevel): ComplexityLevel {
  const s = (raw ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
  if (s.startsWith('bas')) return 'basico'
  if (s.startsWith('inter')) return 'intermedio'
  if (s.startsWith('avan')) return 'avanzado'
  return fallback
}

function parseType(raw: string | undefined, fallback: ContentType): ContentType {
  const s = (raw ?? '').toLowerCase().trim()
  if (s.startsWith('vid')) return 'video'
  if (s === 'pdf') return 'pdf'
  if (s.startsWith('aud')) return 'audio'
  if (s) return 'otro'
  return fallback
}

export function BulkImportForm({
  products,
  driveApiEnabled,
}: {
  products: Product[]
  driveApiEnabled: boolean
}) {
  const [step, setStep] = useState<'paste' | 'preview' | 'done'>('paste')
  const [mode, setMode] = useState<'links' | 'folder'>('links')
  const [productId, setProductId] = useState('')
  const [defaultLevel, setDefaultLevel] = useState<ComplexityLevel>('basico')
  const [defaultType, setDefaultType] = useState<ContentType>('video')
  const [rawText, setRawText] = useState('')
  const [folderUrl, setFolderUrl] = useState('')
  const [subfolders, setSubfolders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [invalidLines, setInvalidLines] = useState<string[]>([])
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function analyze() {
    setError('')
    if (!productId) { setError('Seleccioná el curso de destino.'); return }

    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) { setError('Pegá al menos un link de Drive.'); return }
    if (lines.length > 200) { setError('Máximo 200 líneas por importación.'); return }

    const parsed: ParsedRow[] = []
    const bad: string[] = []
    const seen = new Set<string>()

    lines.forEach((line, i) => {
      // Con tabs (pegado desde Excel/Sheets): Título ⇥ Link ⇥ Nivel ⇥ Tipo ⇥ Descripción
      const cols = line.includes('\t') ? line.split('\t').map((c) => c.trim()) : null
      const linkRaw = cols ? cols[1] ?? '' : line
      const driveFileId = extractDriveId(linkRaw)

      if (!driveFileId) { bad.push(line); return }

      const isDupInBatch = seen.has(driveFileId)
      seen.add(driveFileId)

      parsed.push({
        key: i,
        title: cols?.[0] ?? '',
        description: cols?.[4] ?? '',
        complexity: parseComplexity(cols?.[2], defaultLevel),
        type: parseType(cols?.[3], defaultType),
        driveFileId,
        rawLine: line,
        problem: isDupInBatch ? 'duplicado' : null,
      })
    })

    if (parsed.length === 0) {
      setInvalidLines(bad)
      setError('Ninguna línea contiene un link o ID de Drive válido.')
      return
    }

    startTransition(async () => {
      const existing = await findExistingDriveIds(parsed.map((r) => r.driveFileId))
      const existingSet = new Set(existing)
      setRows(
        parsed.map((r) => ({
          ...r,
          problem: r.problem ?? (existingSet.has(r.driveFileId) ? 'duplicado' : null),
        }))
      )
      setInvalidLines(bad)
      setStep('preview')
    })
  }

  function analyzeFolder() {
    setError('')
    if (!productId) { setError('Seleccioná el curso de destino.'); return }
    if (!folderUrl.trim()) { setError('Pegá la URL de la carpeta de Drive.'); return }

    startTransition(async () => {
      const scan = await scanDriveFolder(folderUrl)
      if (scan.error) { setError(scan.error); return }

      const existing = await findExistingDriveIds(scan.files.map((f) => f.driveFileId))
      const existingSet = new Set(existing)

      setRows(
        scan.files.map((f, i) => ({
          key: i,
          title: f.suggestedTitle,
          description: '',
          complexity: defaultLevel,
          type: f.type,
          driveFileId: f.driveFileId,
          rawLine: f.fileName,
          problem: existingSet.has(f.driveFileId) ? ('duplicado' as const) : null,
        }))
      )
      setSubfolders(scan.subfolders)
      setInvalidLines([])
      setStep('preview')
    })
  }

  function updateRow(key: number, patch: Partial<ParsedRow>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: number) {
    setRows((rs) => rs.filter((r) => r.key !== key))
  }

  const importable = rows.filter((r) => !r.problem)
  const missingTitles = importable.filter((r) => !r.title.trim()).length
  const duplicates = rows.filter((r) => r.problem === 'duplicado')

  function doImport() {
    setError('')
    startTransition(async () => {
      const res = await bulkCreateContents(
        productId,
        importable.map((r) => ({
          title: r.title,
          description: r.description || null,
          complexity: r.complexity,
          type: r.type,
          drive_file_id: r.driveFileId,
        }))
      )
      if (res.error) { setError(res.error); return }
      setResult(res)
      setStep('done')
    })
  }

  function reset() {
    setStep('paste')
    setRawText('')
    setFolderUrl('')
    setSubfolders([])
    setRows([])
    setInvalidLines([])
    setResult(null)
    setError('')
  }

  // ── Paso 3: resumen ──────────────────────────────────────────────────────────
  if (step === 'done' && result) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-6 text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {result.created} contenido{result.created === 1 ? '' : 's'} importado{result.created === 1 ? '' : 's'}
          </p>
          {result.skipped.length > 0 && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {result.skipped.length} omitido{result.skipped.length === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {result.skipped.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Omitidos</h2>
            {result.skipped.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-3 py-2 text-sm"
              >
                <span className="truncate text-[var(--text-primary)]">{s.title}</span>
                <span className="shrink-0 text-xs text-[var(--warning)]">{s.reason}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/admin/contenidos"
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
          >
            Ver contenidos
          </Link>
          <button
            onClick={reset}
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] transition-colors"
          >
            Importar más
          </button>
        </div>
      </div>
    )
  }

  // ── Paso 2: vista previa editable ────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
          <span>
            <span className="font-semibold text-[var(--text-primary)]">{importable.length}</span> para importar
          </span>
          {duplicates.length > 0 && (
            <span className="text-[var(--warning)]">{duplicates.length} duplicado{duplicates.length === 1 ? '' : 's'} (se omiten)</span>
          )}
          {invalidLines.length > 0 && (
            <span className="text-[var(--danger)]">{invalidLines.length} línea{invalidLines.length === 1 ? '' : 's'} sin link válido</span>
          )}
        </div>

        {subfolders.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-muted)]">
            La carpeta contiene subcarpetas que no se escanean:{' '}
            <span className="text-[var(--text-secondary)]">{subfolders.join(', ')}</span>.
            Escanealas por separado si tienen contenido.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className={[
                'flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center',
                row.problem
                  ? 'border-[var(--warning)]/40 bg-[var(--warning)]/5 opacity-70'
                  : 'border-[var(--border)] bg-[var(--bg-surface)]',
              ].join(' ')}
            >
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => updateRow(row.key, { title: e.target.value })}
                    placeholder="Título (requerido)"
                    disabled={!!row.problem}
                    className={[
                      INPUT_CLASS,
                      !row.problem && !row.title.trim() ? 'border-[var(--danger)]/50' : '',
                    ].join(' ')}
                  />
                  <p className="mt-1 truncate font-mono text-[10px] text-[var(--text-muted)]">
                    {row.driveFileId}
                    {row.problem === 'duplicado' && (
                      <span className="ml-2 font-sans text-[var(--warning)]">· Ya existe — se omite</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(row.key, { type: e.target.value as ContentType })}
                    disabled={!!row.problem}
                    aria-label="Tipo"
                    className={SELECT_CLASS}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <select
                    value={row.complexity}
                    onChange={(e) => updateRow(row.key, { complexity: e.target.value as ComplexityLevel })}
                    disabled={!!row.problem}
                    aria-label="Nivel"
                    className={SELECT_CLASS}
                  >
                    {COMPLEXITY.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeRow(row.key)}
                aria-label="Quitar fila"
                className="self-end sm:self-center shrink-0 rounded-md px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        {invalidLines.length > 0 && (
          <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-3">
            <p className="text-xs font-medium text-[var(--danger)]">Líneas sin link de Drive válido (no se importan):</p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {invalidLines.map((l, i) => (
                <li key={i} className="truncate font-mono text-[10px] text-[var(--text-muted)]">{l}</li>
              ))}
            </ul>
          </div>
        )}

        {missingTitles > 0 && (
          <p className="text-sm text-[var(--danger)]">
            Completá el título de {missingTitles === 1 ? 'la fila marcada' : `las ${missingTitles} filas marcadas`} para poder importar.
          </p>
        )}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <div className="flex gap-3">
          <Button onClick={doImport} loading={isPending} disabled={importable.length === 0 || missingTitles > 0}>
            Importar {importable.length} contenido{importable.length === 1 ? '' : 's'}
          </Button>
          <button
            onClick={() => setStep('paste')}
            className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // ── Paso 1: pegar / escanear carpeta ─────────────────────────────────────────
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {/* Selector de modo */}
      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-1 self-start">
        {(
          [
            { id: 'links', label: 'Pegar links' },
            { id: 'folder', label: 'Carpeta de Drive' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setError('') }}
            className={[
              'rounded-md px-3.5 py-1.5 text-sm transition-colors',
              mode === m.id
                ? 'bg-[var(--bg-card)] font-medium text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Curso de destino</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Seleccioná un curso</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Nivel por defecto</label>
          <select
            value={defaultLevel}
            onChange={(e) => setDefaultLevel(e.target.value as ComplexityLevel)}
            className={SELECT_CLASS}
          >
            {COMPLEXITY.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        {mode === 'links' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Tipo por defecto</label>
            <select
              value={defaultType}
              onChange={(e) => setDefaultType(e.target.value as ContentType)}
              className={SELECT_CLASS}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {mode === 'links' ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Links de Google Drive
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={10}
            placeholder={
              'Un link por línea:\nhttps://drive.google.com/file/d/ABC123…/view\nhttps://drive.google.com/file/d/DEF456…/view\n\nO pegá filas desde Excel/Sheets con columnas:\nTítulo ⇥ Link ⇥ Nivel ⇥ Tipo ⇥ Descripción'
            }
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline focus:outline-2 focus:outline-[var(--accent)]"
          />
          <p className="text-xs text-[var(--text-muted)]">
            Acepta links de Drive, IDs sueltos, o filas copiadas de una planilla (con tabulaciones).
            El nivel y tipo por defecto se aplican a las líneas que no los especifiquen; después podés ajustar cada fila.
          </p>
        </div>
      ) : driveApiEnabled ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            URL de la carpeta de Drive
          </label>
          <input
            type="url"
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/…"
            className={INPUT_CLASS}
          />
          <p className="text-xs text-[var(--text-muted)]">
            La carpeta debe estar compartida como «Cualquier persona con el enlace».
            Se detectan automáticamente el tipo (video/PDF/audio) y el título desde el nombre
            de cada archivo. El nivel por defecto se aplica a todos; después podés ajustar cada fila.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            El escaneo de carpetas no está configurado
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-[var(--text-muted)]">
            Requiere una API key de Google Cloud con la Drive API habilitada, cargada como
            variable de entorno <span className="font-mono">GOOGLE_DRIVE_API_KEY</span>.
            Las instrucciones están en SETUP.md. Mientras tanto podés usar «Pegar links».
          </p>
        </div>
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex gap-3">
        <Button
          onClick={mode === 'links' ? analyze : analyzeFolder}
          loading={isPending}
          disabled={mode === 'folder' && !driveApiEnabled}
        >
          {mode === 'links' ? 'Analizar' : 'Escanear carpeta'}
        </Button>
        <a
          href="/admin/contenidos"
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancelar
        </a>
      </div>
    </div>
  )
}

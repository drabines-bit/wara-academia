'use client'

import { useState } from 'react'
import type { ContentSource, ContentType } from '@/types/database'

export function ContentViewer({
  externalId,
  title,
  type,
  source,
}: {
  externalId: string
  title: string
  type: ContentType
  source: ContentSource
}) {
  const [loaded, setLoaded] = useState(false)

  if (source === 'youtube') {
    const embedSrc = `https://www.youtube-nocookie.com/embed/${externalId}?rel=0`
    const watchUrl = `https://www.youtube.com/watch?v=${externalId}`

    return (
      <div className="flex flex-col gap-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                <p className="text-xs text-[var(--text-muted)]">Cargando video…</p>
              </div>
            </div>
          )}
          <iframe
            src={embedSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            className={[
              'h-full w-full transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Si el video no carga,{' '}
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            abrilo directamente en YouTube
          </a>
          .
        </p>
      </div>
    )
  }

  if (source === 'web') {
    let hostname = externalId
    try {
      hostname = new URL(externalId).hostname
    } catch {
      // externalId sin formato de URL válido; mostramos el valor tal cual
    }

    return (
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--text-muted)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="truncate">{hostname}</span>
          </div>
          <a
            href={externalId}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs text-[var(--accent)] hover:underline"
          >
            Abrir en pestaña nueva
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6M10 14 21 3" />
            </svg>
          </a>
        </div>
        <div className="relative h-[75vh] min-h-[520px] w-full">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                <p className="text-xs text-[var(--text-muted)]">Cargando sitio…</p>
              </div>
            </div>
          )}
          <iframe
            src={externalId}
            title={title}
            onLoad={() => setLoaded(true)}
            className={[
              'h-full w-full transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />
        </div>
      </div>
    )
  }

  const previewSrc = `https://drive.google.com/file/d/${externalId}/preview`
  const viewUrl = `https://drive.google.com/file/d/${externalId}/view`
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${externalId}`

  // Archivos descargables: no iframe, solo botones
  if (type === 'otro') {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] py-14 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/15">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--accent)]"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-[var(--text-primary)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Archivo descargable</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] transition-colors"
          >
            Descargar
          </a>
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] transition-colors"
          >
            Ver en Drive
          </a>
        </div>
      </div>
    )
  }

  const containerClass =
    type === 'video'
      ? 'aspect-video'
      : type === 'audio'
        ? 'h-[180px]'
        : 'aspect-[3/4] md:aspect-[4/3]'

  return (
    <div
      className={[
        'relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]',
        containerClass,
      ].join(' ')}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            <p className="text-xs text-[var(--text-muted)]">Cargando contenido…</p>
          </div>
        </div>
      )}
      <iframe
        src={previewSrc}
        title={title}
        allow="autoplay; fullscreen"
        allowFullScreen
        onLoad={() => setLoaded(true)}
        className={[
          'h-full w-full transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
    </div>
  )
}

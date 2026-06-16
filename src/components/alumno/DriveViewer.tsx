'use client'

import { useState } from 'react'
import type { ContentType } from '@/types/database'

export function DriveViewer({
  driveFileId,
  title,
  type,
}: {
  driveFileId: string
  title: string
  type: ContentType
}) {
  const [loaded, setLoaded] = useState(false)
  const previewSrc = `https://drive.google.com/file/d/${driveFileId}/preview`
  const viewUrl = `https://drive.google.com/file/d/${driveFileId}/view`
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`

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
    <div className="flex flex-col gap-2">
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
      <p className="text-xs text-[var(--text-muted)]">
        Si el contenido no carga,{' '}
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          abrilo directamente en Google Drive
        </a>
        .
      </p>
    </div>
  )
}

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
  const src = `https://drive.google.com/file/d/${driveFileId}/preview`

  return (
    <div className="flex flex-col gap-2">
      <div
        className={[
          'relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]',
          type === 'video' ? 'aspect-video' : 'aspect-[3/4] md:aspect-[4/3]',
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
          src={src}
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
          href={`https://drive.google.com/file/d/${driveFileId}/view`}
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

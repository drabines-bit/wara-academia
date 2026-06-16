'use client'

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
  const src = `https://drive.google.com/file/d/${driveFileId}/preview`

  return (
    <div
      className={[
        'w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]',
        type === 'video' ? 'aspect-video' : 'aspect-[3/4] md:aspect-[4/3]',
      ].join(' ')}
    >
      <iframe
        src={src}
        title={title}
        allow="autoplay; fullscreen"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}

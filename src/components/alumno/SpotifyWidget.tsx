'use client'

import { useState } from 'react'

export function SpotifyWidget({ embedUrl }: { embedUrl: string }) {
  const [minimized, setMinimized] = useState(false)

  return (
    <div className="fixed bottom-0 right-4 z-50 hidden md:flex flex-col items-end">
      <button
        onClick={() => setMinimized((v) => !v)}
        title={minimized ? 'Mostrar reproductor' : 'Minimizar'}
        className="mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shadow-md"
      >
        {minimized ? '♫' : '×'}
      </button>

      {!minimized && (
        <iframe
          src={embedUrl}
          width="300"
          height="80"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-t-xl border-t border-x border-[var(--border)] shadow-2xl"
        />
      )}
    </div>
  )
}

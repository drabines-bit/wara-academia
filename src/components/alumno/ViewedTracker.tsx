'use client'

import { useEffect, useRef, useState } from 'react'
import { markContentViewed } from '@/app/actions/progress'
import { FelicitacionCurso } from '@/components/alumno/FelicitacionCurso'

// Permanencia mínima antes de marcar el contenido como visto
const DWELL_MS = 10_000
// Duración del toast de confirmación
const TOAST_MS = 3_000

export function ViewedTracker({
  contentId,
  productName,
}: {
  contentId: string
  productName: string
}) {
  const [justCompleted, setJustCompleted] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
    setJustCompleted(false)
    setShowToast(false)

    let toastTimer: ReturnType<typeof setTimeout> | undefined

    const dwellTimer = setTimeout(async () => {
      if (firedRef.current) return
      firedRef.current = true
      const { justCompleted } = await markContentViewed(contentId)
      if (justCompleted) {
        setJustCompleted(true)
      } else {
        setShowToast(true)
        toastTimer = setTimeout(() => setShowToast(false), TOAST_MS)
      }
    }, DWELL_MS)

    return () => {
      clearTimeout(dwellTimer)
      if (toastTimer) clearTimeout(toastTimer)
    }
  }, [contentId])

  return (
    <>
      {/* Confirmación discreta de "visto" (lectores de pantalla incluidos) */}
      <div aria-live="polite" className="sr-only">
        {showToast || justCompleted ? 'Contenido marcado como visto' : ''}
      </div>

      <div
        aria-hidden={!showToast}
        className={[
          'fixed bottom-24 md:bottom-8 left-1/2 z-50 -translate-x-1/2',
          'flex items-center gap-2 rounded-full border border-[var(--success)]/30',
          'bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-lg',
          'transition-all duration-300 ease-out',
          showToast
            ? 'opacity-100 translate-y-0'
            : 'pointer-events-none opacity-0 translate-y-2',
        ].join(' ')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--success)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Marcado como visto
      </div>

      {justCompleted && <FelicitacionCurso productName={productName} />}
    </>
  )
}

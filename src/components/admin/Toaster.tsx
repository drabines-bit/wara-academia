'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TOAST_EVENT, TOAST_DISMISS_EVENT, type ToastEventDetail } from '@/lib/toast'

type ToastItem = ToastEventDetail & { leaving?: boolean }

const TONE_DOT: Record<ToastEventDetail['tone'], string> = {
  success: 'bg-[var(--success)]',
  error: 'bg-[var(--danger)]',
  info: 'bg-[var(--accent)]',
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const remove = useCallback((id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 200)
  }, [])

  useEffect(() => {
    function handleAdd(e: Event) {
      const detail = (e as CustomEvent<ToastEventDetail>).detail
      setToasts((prev) => [...prev.filter((t) => t.id !== detail.id), { ...detail }])
      timers.current[detail.id] = setTimeout(() => remove(detail.id), detail.duration)
    }
    function handleDismiss(e: Event) {
      remove((e as CustomEvent<{ id: string }>).detail.id)
    }
    window.addEventListener(TOAST_EVENT, handleAdd as EventListener)
    window.addEventListener(TOAST_DISMISS_EVENT, handleDismiss as EventListener)
    const timersAtMount = timers.current
    return () => {
      window.removeEventListener(TOAST_EVENT, handleAdd as EventListener)
      window.removeEventListener(TOAST_DISMISS_EVENT, handleDismiss as EventListener)
      Object.values(timersAtMount).forEach(clearTimeout)
    }
  }, [remove])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[var(--z-toast)] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:items-end md:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          onMouseEnter={() => clearTimeout(timers.current[t.id])}
          onMouseLeave={() => {
            timers.current[t.id] = setTimeout(() => remove(t.id), 1500)
          }}
          className={[
            'pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-4 pr-3 text-sm transition-all duration-200 ease-out',
            t.leaving ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100',
          ].join(' ')}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[t.tone]}`} aria-hidden="true" />
          <span className="flex-1 text-[var(--text-primary)]">{t.text}</span>
          {t.actionLabel && t.onAction && (
            <button
              onClick={() => {
                t.onAction?.()
                remove(t.id)
              }}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
            >
              {t.actionLabel}
            </button>
          )}
          <button
            onClick={() => remove(t.id)}
            aria-label="Cerrar notificación"
            className="shrink-0 rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[var(--accent)]/40"
            style={{ animation: `toast-countdown ${t.duration}ms linear forwards` }}
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  )
}

'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  getMyNotifications,
  markAllNotificationsRead,
} from '@/app/actions/notifications'
import type { Notification } from '@/types/database'

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const hs = Math.floor(min / 60)
  if (hs < 24) return `hace ${hs} h`
  const days = Math.floor(hs / 24)
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days} días`
  return new Date(iso).toLocaleDateString('es-AR')
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    getMyNotifications().then((res) => {
      if (cancelled) return
      setItems(res.items)
      setUnread(res.unread)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      // Al abrir se consideran vistas; los puntos de "no leída" del panel
      // se mantienen hasta cerrar para que se distingan las nuevas
      setUnread(0)
      startTransition(() => markAllNotificationsRead())
    }
  }

  function close() {
    setOpen(false)
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
    )
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label={
          unread > 0 ? `Notificaciones (${unread} sin leer)` : 'Notificaciones'
        }
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-[var(--accent-fg)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Cierra al hacer click afuera */}
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />

          <div className="fixed inset-x-4 top-16 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-96">
            <div className="border-b border-[var(--border)] px-4 py-2.5">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Notificaciones
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!loaded ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  Cargando…
                </p>
              ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  No tenés notificaciones todavía.
                </p>
              ) : (
                items.map((n) => {
                  const inner = (
                    <div className="flex items-start gap-2.5">
                      {!n.read_at && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]"
                          aria-label="No leída"
                        />
                      )}
                      <div className={n.read_at ? 'pl-[18px]' : ''}>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                  const rowClass =
                    'block border-b border-[var(--border)] px-4 py-3 last:border-b-0'
                  return n.href ? (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={close}
                      className={`${rowClass} hover:bg-[var(--bg-card)] transition-colors`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id} className={rowClass}>
                      {inner}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

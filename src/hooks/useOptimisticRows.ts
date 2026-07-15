'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { showToast } from '@/lib/toast'

export function useOptimisticRows<T extends { id: string }>(initial: T[]) {
  const [rows, setRows] = useState<T[]>(initial)
  const mounted = useRef(true)
  useEffect(() => () => {
    mounted.current = false
  }, [])

  const safeSetRows = useCallback((updater: (rows: T[]) => T[]) => {
    if (mounted.current) setRows(updater)
  }, [])

  const update = useCallback(
    (id: string, patch: Partial<T>) => {
      safeSetRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    [safeSetRows]
  )

  /** Aplica un cambio de estado al instante; revierte la fila completa si `run` falla. */
  const optimisticAction = useCallback(
    async (row: T, patch: Partial<T>, run: () => Promise<void>) => {
      update(row.id, patch)
      try {
        await run()
        return true
      } catch {
        safeSetRows((rs) => rs.map((r) => (r.id === row.id ? row : r)))
        return false
      }
    },
    [update, safeSetRows]
  )

  /** Retira la fila al instante; ejecuta `run` recién tras el período de gracia salvo que se deshaga. */
  const optimisticDelete = useCallback(
    (row: T, opts: { label: string; run: () => Promise<void>; duration?: number }) => {
      const idx = rows.findIndex((r) => r.id === row.id)
      let undone = false
      safeSetRows((rs) => rs.filter((r) => r.id !== row.id))
      const duration = opts.duration ?? 5000
      const timer = setTimeout(() => {
        if (undone) return
        opts.run().catch(() => {
          safeSetRows((rs) => {
            const copy = [...rs]
            copy.splice(Math.min(idx, copy.length), 0, row)
            return copy
          })
          showToast({ text: 'No se pudo eliminar. Se restauró el elemento.', tone: 'error' })
        })
      }, duration)
      showToast({
        text: opts.label,
        tone: 'info',
        duration,
        actionLabel: 'Deshacer',
        onAction: () => {
          undone = true
          clearTimeout(timer)
          safeSetRows((rs) => {
            const copy = [...rs]
            copy.splice(Math.min(idx, copy.length), 0, row)
            return copy
          })
        },
      })
    },
    [rows, safeSetRows]
  )

  return { rows, setRows: safeSetRows, update, optimisticAction, optimisticDelete }
}

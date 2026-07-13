'use client'

import { useEffect, useRef, useState } from 'react'
import { markContentViewed } from '@/app/actions/progress'
import { FelicitacionCurso } from '@/components/alumno/FelicitacionCurso'

// Permanencia mínima antes de marcar el contenido como visto
const DWELL_MS = 10_000

export function ViewedTracker({
  contentId,
  productName,
}: {
  contentId: string
  productName: string
}) {
  const [justCompleted, setJustCompleted] = useState(false)
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
    setJustCompleted(false)

    const timer = setTimeout(async () => {
      if (firedRef.current) return
      firedRef.current = true
      const { justCompleted } = await markContentViewed(contentId)
      if (justCompleted) setJustCompleted(true)
    }, DWELL_MS)

    return () => clearTimeout(timer)
  }, [contentId])

  if (!justCompleted) return null

  return <FelicitacionCurso productName={productName} />
}

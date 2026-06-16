'use client'

import { useEffect } from 'react'

export function ThemeSync({ theme }: { theme: number }) {
  useEffect(() => {
    const t = String(theme)
    document.documentElement.setAttribute('data-theme', t)
    try {
      localStorage.setItem('wara-theme', t)
    } catch {}
  }, [theme])

  return null
}

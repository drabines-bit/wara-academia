'use client'

import { useState, useTransition } from 'react'
import { updateTheme } from '@/app/actions/profile'

const THEMES = [
  { id: 1, label: 'Oscuro', bg: '#0d0f14', accent: '#3b82f6' },
  { id: 2, label: 'Azul noche', bg: '#07111f', accent: '#38bdf8' },
  { id: 3, label: 'Verde bosque', bg: '#080f0a', accent: '#4ade80' },
  { id: 4, label: 'Claro', bg: '#f1f3f7', accent: '#3b82f6', border: '#d1d8e4' },
] as const

export function ThemeSelector({ currentTheme }: { currentTheme: number }) {
  const [active, setActive] = useState(currentTheme)
  const [isPending, startTransition] = useTransition()

  function handleSelect(themeId: number) {
    if (themeId === active) return
    setActive(themeId)
    document.documentElement.setAttribute('data-theme', String(themeId))
    try {
      localStorage.setItem('wara-theme', String(themeId))
    } catch {}
    startTransition(() => updateTheme(themeId))
  }

  return (
    <div className="flex items-center gap-4">
      {THEMES.map((t) => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            disabled={isPending}
            title={t.label}
            aria-label={`Tema ${t.label}`}
            className={[
              'group flex flex-col items-center gap-1.5 focus:outline-none',
              isPending ? 'opacity-60' : '',
            ].join(' ')}
          >
            <span
              className={[
                'block h-10 w-10 rounded-full transition-all duration-150',
                isActive
                  ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-base)] scale-110'
                  : 'hover:scale-105',
              ].join(' ')}
              style={{
                background: `linear-gradient(135deg, ${t.bg} 55%, ${t.accent} 100%)`,
                outline: 'border' in t ? `1.5px solid ${t.border}` : undefined,
              }}
            />
            <span
              className={[
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

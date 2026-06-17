'use client'

import { useState, useTransition } from 'react'
import { updateTheme } from '@/app/actions/profile'

const THEMES = [
  { id: 1, label: 'Oscuro',        bg: '#0d0f14', accent: '#3b82f6' },
  { id: 2, label: 'Azul noche',    bg: '#07111f', accent: '#38bdf8' },
  { id: 3, label: 'Verde bosque',  bg: '#080f0a', accent: '#4ade80' },
  { id: 4, label: 'Claro',         bg: '#f1f3f7', accent: '#3b82f6', border: '#d1d8e4' },
] as const

export function ThemeSelector({ currentTheme }: { currentTheme: number }) {
  const [active, setActive] = useState(currentTheme)
  const [isPending, startTransition] = useTransition()

  function handleSelect(themeId: number) {
    if (themeId === active) return
    setActive(themeId)
    document.documentElement.setAttribute('data-theme', String(themeId))
    try { localStorage.setItem('wara-theme', String(themeId)) } catch {}
    startTransition(() => updateTheme(themeId))
  }

  return (
    <div
      className={[
        'grid grid-cols-2 sm:grid-cols-4 gap-3 transition-opacity duration-200',
        isPending ? 'opacity-50 pointer-events-none' : '',
      ].join(' ')}
    >
      {THEMES.map((t) => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            disabled={isPending}
            aria-label={`Tema ${t.label}${isActive ? ' (activo)' : ''}`}
            aria-pressed={isActive}
            className="group flex flex-col gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          >
            {/* Preview card */}
            <div
              className={[
                'w-full overflow-hidden rounded-lg transition-all duration-200',
                isActive
                  ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-base)] scale-[1.04]'
                  : 'opacity-65 group-hover:opacity-100 group-hover:scale-[1.02]',
              ].join(' ')}
              style={{ border: 'border' in t ? `1.5px solid ${t.border}` : `1.5px solid ${t.bg}` }}
            >
              <div className="h-12" style={{ backgroundColor: t.bg }} />
              <div className="h-3" style={{ backgroundColor: t.accent }} />
            </div>

            {/* Label */}
            <span
              className={[
                'text-[11px] font-medium transition-colors text-center',
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]',
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

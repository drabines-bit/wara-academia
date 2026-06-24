'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { useTransition } from 'react'

const NAV = [
  { href: '/admin', label: 'Panel', icon: '⊞' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
  { href: '/admin/categorias', label: 'Categorías', icon: '🏷️' },
  { href: '/admin/productos', label: 'Cursos', icon: '🎓' },
  { href: '/admin/contenidos', label: 'Contenidos', icon: '🎬' },
  { href: '/admin/reportes', label: 'Reportes', icon: '📊' },
]

export function AdminNav() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <>
      {/* ─── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="WARA GPS" className="h-7 w-auto" />
            <span className="font-semibold text-[var(--text-primary)] text-sm">
              Academia WARA GPS
              <span className="ml-1.5 rounded bg-[var(--bg-card)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                Admin
              </span>
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={[
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive(href)
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]',
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => startTransition(() => signOut())}
            disabled={isPending}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors disabled:opacity-50"
          >
            {isPending ? '...' : 'Salir'}
          </button>
        </div>
      </header>

      {/* ─── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border)] bg-[var(--bg-surface)] md:hidden">
        <div className="flex">
          {NAV.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={[
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                isActive(href)
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)]',
              ].join(' ')}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { useTransition } from 'react'

export function AlumnoNav() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const isHome = pathname.startsWith('/contenido')
  const isPerfil = pathname.startsWith('/perfil')

  return (
    <>
      {/* ─── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/contenido" className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-[var(--accent)] flex items-center justify-center">
              <span className="text-xs font-bold text-white">W</span>
            </div>
            <span className="font-semibold text-[var(--text-primary)] text-sm">
              Academia WARA GPS
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/contenido', label: 'Inicio', active: isHome },
              { href: '/perfil', label: 'Mi perfil', active: isPerfil },
            ].map(({ href, label, active }) => (
              <Link
                key={href}
                href={href}
                className={[
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
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
          <Link
            href="/contenido"
            className={[
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
              isHome ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
            ].join(' ')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Inicio
          </Link>

          <Link
            href="/perfil"
            className={[
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
              isPerfil ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
            ].join(' ')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
            Mi perfil
          </Link>
        </div>
      </nav>
    </>
  )
}

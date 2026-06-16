import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Panel de administración' }

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ count: pending }, { count: products }, { count: contents }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending') as unknown as Promise<{ count: number | null }>,
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>,
      supabase
        .from('contents')
        .select('id', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>,
    ])

  const cards = [
    {
      label: 'Usuarios pendientes',
      value: pending ?? 0,
      href: '/admin/usuarios?estado=pending',
      urgent: (pending ?? 0) > 0,
    },
    {
      label: 'Productos',
      value: products ?? 0,
      href: '/admin/productos',
      urgent: false,
    },
    {
      label: 'Contenidos',
      value: contents ?? 0,
      href: '/admin/contenidos',
      urgent: false,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Panel de administración
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Gestioná usuarios, productos y contenidos de la Academia WARA GPS.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, href, urgent }) => (
          <Link
            key={href}
            href={href}
            className={[
              'group rounded-xl border p-5 transition-colors hover:border-[var(--accent)]',
              urgent
                ? 'border-[var(--warning)] bg-[var(--warning)]/5'
                : 'border-[var(--border)] bg-[var(--bg-surface)]',
            ].join(' ')}
          >
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {value}
            </p>
            <p
              className={[
                'mt-1 text-sm',
                urgent ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {label}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
        >
          + Nuevo producto
        </Link>
        <Link
          href="/admin/contenidos/nuevo"
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
        >
          + Nuevo contenido
        </Link>
      </div>
    </div>
  )
}

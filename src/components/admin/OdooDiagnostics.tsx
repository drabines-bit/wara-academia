'use client'

import { useState, useTransition } from 'react'
import {
  adminTestOdooConnection,
  adminCheckEmailInOdoo,
} from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type ConnState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; uid: number; contactsTotal: number; authMs: number; queryMs: number; usedCachedAuth: boolean }
  | { status: 'error'; error: string }

type EmailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; found: boolean; ms: number }
  | { status: 'error'; error: string }

export function OdooDiagnostics() {
  const [conn, setConn] = useState<ConnState>({ status: 'idle' })
  const [email, setEmail] = useState('')
  const [emailResult, setEmailResult] = useState<EmailState>({ status: 'idle' })
  const [, startTransition] = useTransition()

  function runConnectionTest() {
    setConn({ status: 'loading' })
    startTransition(async () => {
      const res = await adminTestOdooConnection()
      setConn(res.ok ? { status: 'ok', ...res } : { status: 'error', error: res.error })
    })
  }

  function runEmailCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setEmailResult({ status: 'loading' })
    startTransition(async () => {
      const res = await adminCheckEmailInOdoo(email.trim())
      setEmailResult(res.ok ? { status: 'ok', found: res.found, ms: res.ms } : { status: 'error', error: res.error })
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Test de conexión ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Conexión a Odoo
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Verifica autenticación y permisos de lectura sobre contactos.
            </p>
          </div>
          <Button
            onClick={runConnectionTest}
            loading={conn.status === 'loading'}
            variant="ghost"
            className="border border-[var(--border)]"
          >
            Probar conexión
          </Button>
        </div>

        {conn.status === 'ok' && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/5 px-4 py-3">
            <p className="text-sm font-medium text-[var(--success)]">
              ✓ Conexión OK — uid {conn.uid}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {conn.contactsTotal.toLocaleString('es-AR')} contactos visibles ·{' '}
              autenticación {conn.authMs} ms
              {conn.usedCachedAuth && ' (sesión reutilizada)'} · consulta {conn.queryMs} ms
            </p>
          </div>
        )}

        {conn.status === 'error' && (
          <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-4 py-3">
            <p className="text-sm font-medium text-[var(--danger)]">✗ Falló la conexión</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{conn.error}</p>
          </div>
        )}
      </div>

      {/* ── Búsqueda de email puntual ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Verificar un email
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Comprueba si un email específico figura en los contactos de Odoo
            (el mismo chequeo que corre al registrarse un alumno).
          </p>
        </div>

        <form onSubmit={runEmailCheck} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alumno@ejemplo.com"
              required
            />
          </div>
          <Button type="submit" loading={emailResult.status === 'loading'}>
            Verificar
          </Button>
        </form>

        {emailResult.status === 'ok' && (
          <div
            className={[
              'rounded-lg border px-4 py-3',
              emailResult.found
                ? 'border-[var(--success)]/30 bg-[var(--success)]/5'
                : 'border-[var(--border)] bg-[var(--bg-card)]',
            ].join(' ')}
          >
            <p
              className={[
                'text-sm font-medium',
                emailResult.found ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {emailResult.found
                ? '✓ Encontrado — este email auto-aprobaría el registro'
                : 'No encontrado — seguiría el circuito de aprobación manual'}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Consulta resuelta en {emailResult.ms} ms
            </p>
          </div>
        )}

        {emailResult.status === 'error' && (
          <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-4 py-3">
            <p className="text-sm font-medium text-[var(--danger)]">✗ No se pudo verificar</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{emailResult.error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { signIn } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const banner = {
  initial: { opacity: 0, height: 0, marginBottom: 0 },
  animate: { opacity: 1, height: 'auto', marginBottom: 0 },
  exit: { opacity: 0, height: 0, marginBottom: 0 },
  transition: { duration: 0.22, ease: [0.25, 1, 0.5, 1] as const },
}

export function LoginForm({
  rechazado,
  passwordActualizado,
}: {
  rechazado?: boolean
  passwordActualizado?: boolean
}) {
  const [state, action, isPending] = useActionState(signIn, undefined)

  return (
    <form action={action} className="flex flex-col gap-5">
      <AnimatePresence initial={false}>
        {rechazado && (
          <motion.div key="rechazado" {...banner} style={{ overflow: 'hidden' }}>
            <div className="rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-4 py-3 text-sm text-[var(--danger)]">
              Tu solicitud de acceso no fue aprobada. Contactate con el equipo WARA GPS.
            </div>
          </motion.div>
        )}
        {passwordActualizado && (
          <motion.div key="pass-ok" {...banner} style={{ overflow: 'hidden' }}>
            <div className="rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 px-4 py-3 text-sm text-[var(--success)]">
              Contraseña actualizada. Ya podés ingresar.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="vos@ejemplo.com"
      />
      <div className="flex flex-col gap-1.5">
        <Input
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
        <Link
          href="/olvide-contrasena"
          className="self-end text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <AnimatePresence initial={false}>
        {state?.error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="text-sm text-[var(--danger)]"
          >
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <Button type="submit" loading={isPending} className="w-full mt-1">
        Ingresar
      </Button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        ¿No tenés cuenta?{' '}
        <Link
          href="/registro"
          className="text-[var(--accent)] hover:underline font-medium"
        >
          Registrate
        </Link>
      </p>
    </form>
  )
}

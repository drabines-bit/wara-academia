'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { notifyAdminsNewUser } from '@/lib/email'

// ── Registro ──────────────────────────────────────────────────────────────────

type AuthState = { error?: string } | undefined

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = (formData.get('full_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!fullName || fullName.length < 2)
    return { error: 'El nombre debe tener al menos 2 caracteres.' }
  if (!email) return { error: 'Ingresá un email válido.' }
  if (!password || password.length < 8)
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  if (password !== confirmPassword)
    return { error: 'Las contraseñas no coinciden.' }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered'))
      return { error: 'Ya existe una cuenta con ese email.' }
    return { error: error.message }
  }

  // Avisar a los admins del nuevo registro (no bloquea si falla)
  notifyAdminsNewUser(fullName, email).catch(console.error)

  redirect('/registro/enviado')
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Completá todos los campos.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (
      error.message.includes('Invalid login') ||
      error.message.includes('invalid_credentials')
    )
      return { error: 'Email o contraseña incorrectos.' }
    if (error.message.includes('Email not confirmed'))
      return { error: 'Confirmá tu email antes de ingresar.' }
    return { error: error.message }
  }

  redirect('/')
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ── Reset de contraseña — paso 1: solicitar ───────────────────────────────────

export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get('email') as string)?.trim()
  if (!email) return { error: 'Ingresá tu email.' }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/reset`,
  })

  // No revelar si el email existe o no
  if (error) console.error('resetPasswordForEmail:', error.message)

  return { success: true }
}

// ── Reset de contraseña — paso 2: actualizar ──────────────────────────────────

export async function updatePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || password.length < 8)
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  if (password !== confirmPassword)
    return { error: 'Las contraseñas no coinciden.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  redirect('/login?password_actualizado=true')
}

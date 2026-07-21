'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notifyAdminsNewUser, notifyAdminsAutoApproved } from '@/lib/email'
import { isEmailInOdoo } from '@/lib/odoo'
import { deriveAudience } from '@/lib/audience'

/**
 * Aprueba el perfil recién creado y le asigna las categorías por defecto.
 * El perfil lo crea un trigger de la base al registrarse; si todavía no
 * existe se reintenta una vez antes de dejar el circuito manual.
 */
async function autoApproveProfile(userId: string, email: string): Promise<boolean> {
  const service = createServiceClient()
  const audience = await deriveAudience(email)

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data } = await service
      .from('profiles')
      .update({ status: 'approved', audience })
      .eq('id', userId)
      .select('id')

    if (data?.length) {
      const { data: existingCats } = await service
        .from('user_categories')
        .select('category_id')
        .eq('user_id', userId)

      if (!existingCats?.length) {
        const { data: defaultCats } = await service
          .from('categories')
          .select('id')
          .eq('is_default', true)
        if (defaultCats?.length) {
          await service.from('user_categories').insert(
            defaultCats.map((c) => ({ user_id: userId, category_id: c.id }))
          )
        }
      }
      return true
    }
    await new Promise((r) => setTimeout(r, 700))
  }
  return false
}

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

  const { data, error } = await supabase.auth.signUp({
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

  // Si el email ya tiene una cuenta confirmada, Supabase no siempre devuelve un
  // error: cuando "Confirm phone" también está habilitado en el proyecto,
  // responde con un usuario ofuscado (sin identidades nuevas) y no envía nada.
  // Sin este chequeo el usuario terminaba en "Revisá tu email" sin que se
  // enviara ningún email de confirmación.
  if (data.user && data.user.identities?.length === 0) {
    return { error: 'Ya existe una cuenta con ese email. Iniciá sesión o recuperá tu contraseña.' }
  }

  // Aprobación automática si el email figura en los contactos de Odoo.
  // Si Odoo no está configurado, no responde o falla → circuito manual.
  let autoApproved = false
  const userId = data.user?.id
  if (userId && (await isEmailInOdoo(email)) === true) {
    autoApproved = await autoApproveProfile(userId, email)
  }

  // Avisar a los admins (no bloquea si falla)
  if (autoApproved) {
    notifyAdminsAutoApproved(fullName, email).catch(console.error)
  } else {
    notifyAdminsNewUser(fullName, email).catch(console.error)
  }

  redirect(autoApproved ? '/registro/enviado?aprobado=1' : '/registro/enviado')
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

// ── Reenvío del email de confirmación de registro ─────────────────────────────

export async function resendConfirmationEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!email) return { ok: false, error: 'Ingresá tu email primero.' }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  })

  if (error) {
    if (error.message.includes('rate limit') || error.message.includes('security purposes'))
      return { ok: false, error: 'Ya te reenviamos uno hace poco. Esperá un minuto e intentá de nuevo.' }
    if (error.message.includes('already confirmed'))
      return { ok: false, error: 'Ese email ya está confirmado. Probá iniciar sesión.' }
    return { ok: false, error: 'No pudimos reenviar el email. Probá de nuevo en unos minutos.' }
  }

  return { ok: true }
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

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Product, WelcomeSettings } from '@/types/database'

export type MandatoryGate = {
  /** true → el alumno debe completar el/los cursos obligatorios antes de ver el resto */
  gated: boolean
  /** Cursos obligatorios (para destacarlos en la bienvenida) */
  mandatoryProducts: Product[]
}

const NOT_GATED: MandatoryGate = { gated: false, mandatoryProducts: [] }

/**
 * Estado del bloqueo por curso obligatorio para el usuario actual.
 * Fail-open: ante cualquier error (p.ej. la migración de is_mandatory todavía
 * no corrió) devuelve "no bloqueado" — el onboarding nunca puede romper el
 * acceso al contenido.
 */
export async function getMandatoryGate(): Promise<MandatoryGate> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NOT_GATED

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'admin') return NOT_GATED

    const { data: mandatory, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_mandatory', true)
      .order('sort_order')
    if (error || !mandatory?.length) return NOT_GATED

    const { data: contents } = await supabase
      .from('contents')
      .select('id')
      .in('product_id', mandatory.map((p) => p.id))

    const contentIds = (contents ?? []).map((c) => c.id)
    // Curso obligatorio sin contenido no puede bloquear a nadie
    if (contentIds.length === 0) return { gated: false, mandatoryProducts: mandatory }

    const { data: viewed } = await supabase
      .from('user_content_progress')
      .select('content_id')
      .eq('user_id', user.id)
      .in('content_id', contentIds)

    const viewedSet = new Set((viewed ?? []).map((r) => r.content_id))
    const gated = contentIds.some((id) => !viewedSet.has(id))

    return { gated, mandatoryProducts: mandatory }
  } catch (err) {
    console.error('getMandatoryGate falló (fail-open):', err)
    return NOT_GATED
  }
}

const DEFAULT_WELCOME: Pick<WelcomeSettings, 'title' | 'body'> = {
  title: '¡Bienvenido a la Academia WARA!',
  body: 'Esta academia es el espacio de capacitación oficial de WARA: videos, manuales y material descargable para sacarle el máximo provecho a los productos que tenés contratados.\n\nAntes de empezar, necesitamos que completes el curso obligatorio. Al finalizarlo se desbloquea el resto de los cursos.',
}

/** Título y texto de la bienvenida (con fallback si la tabla todavía no existe) */
export async function getWelcomeSettings(): Promise<Pick<WelcomeSettings, 'title' | 'body'>> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('welcome_settings')
      .select('title, body')
      .eq('id', true)
      .maybeSingle()
    if (data?.title && data?.body) return data
    return DEFAULT_WELCOME
  } catch {
    return DEFAULT_WELCOME
  }
}

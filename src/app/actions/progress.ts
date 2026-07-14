'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type MarkViewedResult = {
  justCompleted: boolean
}

/**
 * Marca un contenido como visto. Devuelve si con este visto el alumno
 * completó el 100% del curso (para mostrar la felicitación una sola vez).
 */
export async function markContentViewed(contentId: string): Promise<MarkViewedResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { justCompleted: false }

  const { data: content } = await supabase
    .from('contents')
    .select('id, product_id')
    .eq('id', contentId)
    .single()
  if (!content) return { justCompleted: false }

  const { data: allContents } = await supabase
    .from('contents')
    .select('id')
    .eq('product_id', content.product_id)

  const allIds = (allContents ?? []).map((c) => c.id)
  if (allIds.length === 0) return { justCompleted: false }

  const { data: viewedRows } = await supabase
    .from('user_content_progress')
    .select('content_id')
    .eq('user_id', user.id)
    .in('content_id', allIds)

  const viewedBefore = new Set((viewedRows ?? []).map((r) => r.content_id))
  const wasComplete = allIds.every((id) => viewedBefore.has(id))

  const { error } = await supabase.from('user_content_progress').upsert(
    { user_id: user.id, content_id: contentId },
    { onConflict: 'user_id,content_id' }
  )
  if (error) return { justCompleted: false }

  viewedBefore.add(contentId)
  const isComplete = allIds.every((id) => viewedBefore.has(id))

  // Purga el router cache del cliente: el checkmark aparece en vivo
  // al volver a la lista del curso o al home
  revalidatePath('/contenido', 'layout')

  return { justCompleted: !wasComplete && isComplete }
}

export type CertificateData = {
  studentName: string
  courseName: string
  issuedAt: string // ISO
  disertanteName: string
  disertanteTitle: string
  presidenteName: string
  presidenteTitle: string
  disertanteSignatureUrl: string | null
  presidenteSignatureUrl: string | null
}

export type CertificateResult =
  | { data: CertificateData }
  | { error: string }

/**
 * Devuelve los datos para generar el certificado, solo si el alumno
 * completó el 100% del curso (verificación server-side).
 */
export async function getCertificateData(productId: string): Promise<CertificateResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const [{ data: product }, { data: profile }, { data: allContents }, { data: settings }] =
    await Promise.all([
      supabase.from('products').select('name').eq('id', productId).single(),
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('contents').select('id').eq('product_id', productId),
      supabase.from('certificate_settings').select('*').eq('id', true).maybeSingle(),
    ])

  if (!product) return { error: 'El curso no existe.' }

  const allIds = (allContents ?? []).map((c) => c.id)
  if (allIds.length === 0) return { error: 'El curso no tiene contenido.' }

  const { count: viewed } = await supabase
    .from('user_content_progress')
    .select('content_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('content_id', allIds)

  if ((viewed ?? 0) < allIds.length) {
    return { error: 'Tenés que completar el 100% del curso para descargar el certificado.' }
  }

  if (!settings || !settings.disertante_name || !settings.presidente_name) {
    return {
      error:
        'El certificado todavía no está configurado. Pedile al administrador que complete la plantilla.',
    }
  }

  return {
    data: {
      studentName: profile?.full_name?.trim() || 'Alumno',
      courseName: product.name,
      issuedAt: new Date().toISOString(),
      disertanteName: settings.disertante_name,
      disertanteTitle: settings.disertante_title,
      presidenteName: settings.presidente_name,
      presidenteTitle: settings.presidente_title,
      disertanteSignatureUrl: settings.disertante_signature_url,
      presidenteSignatureUrl: settings.presidente_signature_url,
    },
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'
import { getEligibleUserIds, notifyNewContent } from '@/lib/notifications'
import { testOdooConnection, checkEmailInOdoo, type OdooConnectionTest, type OdooEmailCheck } from '@/lib/odoo'
import { slugify } from '@/lib/utils'
import type { ComplexityLevel, ContentType, UserRole, UserStatus } from '@/types/database'

type ActionState = { error?: string } | undefined

// ── Helpers internos ──────────────────────────────────────────────────────────

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')
  return { supabase, userId: user.id }
}

// ── Usuarios ──────────────────────────────────────────────────────────────────

export type UserActionResult = {
  emailSent: boolean
  email: string | null
}

export async function approveUser(formData: FormData): Promise<UserActionResult> {
  const { supabase } = await assertAdmin()
  const id = formData.get('id') as string

  const { error } = await supabase.from('profiles').update({ status: 'approved' as UserStatus }).eq('id', id)
  if (error) throw new Error(error.message)

  // Asignar categorías por defecto si el usuario no tiene ninguna
  const { data: existingCats } = await supabase
    .from('user_categories')
    .select('category_id')
    .eq('user_id', id)

  if (!existingCats?.length) {
    const { data: defaultCats } = await supabase
      .from('categories')
      .select('id')
      .eq('is_default', true)

    if (defaultCats?.length) {
      const service = createServiceClient()
      await service.from('user_categories').insert(
        defaultCats.map((c) => ({ user_id: id, category_id: c.id }))
      )
    }
  }

  // Service client solo para auth.admin API
  const service = createServiceClient()
  const { data } = await service.auth.admin.getUserById(id)
  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', id).single()

  let emailSent = false
  const email = data.user?.email ?? null
  if (email && profile?.full_name) {
    emailSent = await sendApprovalEmail(email, profile.full_name).catch((e) => {
      console.error('sendApprovalEmail lanzó:', e)
      return false
    })
  }

  revalidatePath('/admin/usuarios')
  return { emailSent, email }
}

export async function rejectUser(formData: FormData): Promise<UserActionResult> {
  const { supabase } = await assertAdmin()
  const id = formData.get('id') as string

  const { error } = await supabase.from('profiles').update({ status: 'rejected' as UserStatus }).eq('id', id)
  if (error) throw new Error(error.message)

  const service = createServiceClient()
  const { data } = await service.auth.admin.getUserById(id)
  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', id).single()

  let emailSent = false
  const email = data.user?.email ?? null
  if (email && profile?.full_name) {
    emailSent = await sendRejectionEmail(email, profile.full_name).catch((e) => {
      console.error('sendRejectionEmail lanzó:', e)
      return false
    })
  }

  revalidatePath('/admin/usuarios')
  return { emailSent, email }
}

export async function changeUserRole(formData: FormData) {
  const { supabase } = await assertAdmin()
  const id = formData.get('id') as string
  const role = formData.get('role') as UserRole

  if (role !== 'admin' && role !== 'alumno') throw new Error('Rol inválido')

  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/usuarios')
}

export async function deleteUser(formData: FormData) {
  const { userId } = await assertAdmin()
  const id = formData.get('id') as string

  if (id === userId) throw new Error('No podés eliminarte a vos mismo')

  const service = createServiceClient()

  await service.from('user_categories').delete().eq('user_id', id)
  await service.from('profiles').delete().eq('id', id)
  const { error } = await service.auth.admin.deleteUser(id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/usuarios')
}

export async function updateUserCategories(formData: FormData) {
  await assertAdmin()
  const userId = formData.get('user_id') as string
  const categoryIds = formData.getAll('category_ids') as string[]

  const service = createServiceClient()

  await service.from('user_categories').delete().eq('user_id', userId)

  if (categoryIds.length > 0) {
    const { error } = await service.from('user_categories').insert(
      categoryIds.map((cid) => ({ user_id: userId, category_id: cid }))
    )
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/usuarios')
}

// ── Categorías ────────────────────────────────────────────────────────────────

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await assertAdmin()

  const name = (formData.get('name') as string)?.trim()
  const slugInput = (formData.get('slug') as string)?.trim()
  const sort_order = Number(formData.get('sort_order') ?? 0)
  const is_default = formData.get('is_default') === 'on'

  if (!name) return { error: 'El nombre es requerido.' }
  const slug = slugInput || slugify(name)

  const { error } = await supabase
    .from('categories')
    .insert({ name, slug, sort_order, is_default })

  if (error) {
    if (error.message.includes('unique')) return { error: 'Ya existe una categoría con ese slug.' }
    return { error: error.message }
  }

  revalidatePath('/admin/categorias')
  redirect('/admin/categorias')
}

export async function updateCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await assertAdmin()

  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim()
  const sort_order = Number(formData.get('sort_order') ?? 0)
  const is_default = formData.get('is_default') === 'on'

  if (!name) return { error: 'El nombre es requerido.' }
  if (!slug) return { error: 'El slug es requerido.' }

  const { error } = await supabase
    .from('categories')
    .update({ name, slug, sort_order, is_default })
    .eq('id', id)

  if (error) {
    if (error.message.includes('unique')) return { error: 'Ya existe una categoría con ese slug.' }
    return { error: error.message }
  }

  revalidatePath('/admin/categorias')
  redirect('/admin/categorias')
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await assertAdmin()
  const id = formData.get('id') as string
  await supabase.from('categories').delete().eq('id', id)
  revalidatePath('/admin/categorias')
}

// ── Productos ─────────────────────────────────────────────────────────────────

export async function createProduct(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await assertAdmin()

  const name = (formData.get('name') as string)?.trim()
  const slugInput = (formData.get('slug') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const sort_order = Number(formData.get('sort_order') ?? 0)
  const category_id = (formData.get('category_id') as string) || null
  const is_mandatory = formData.get('is_mandatory') === 'on'

  if (!name) return { error: 'El nombre es requerido.' }
  const slug = slugInput || slugify(name)

  const { error } = await supabase
    .from('products')
    .insert({ name, slug, description, sort_order, category_id, is_mandatory })

  if (error) {
    if (error.message.includes('unique')) return { error: 'Ya existe un producto con ese slug.' }
    return { error: error.message }
  }

  revalidatePath('/admin/productos')
  redirect('/admin/productos')
}

export async function updateProduct(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await assertAdmin()

  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const sort_order = Number(formData.get('sort_order') ?? 0)
  const category_id = (formData.get('category_id') as string) || null
  const is_mandatory = formData.get('is_mandatory') === 'on'

  if (!name) return { error: 'El nombre es requerido.' }
  if (!slug) return { error: 'El slug es requerido.' }

  const { error } = await supabase
    .from('products')
    .update({ name, slug, description, sort_order, category_id, is_mandatory })
    .eq('id', id)

  if (error) {
    if (error.message.includes('unique')) return { error: 'Ya existe un producto con ese slug.' }
    return { error: error.message }
  }

  revalidatePath('/admin/productos')
  redirect('/admin/productos')
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await assertAdmin()
  const id = formData.get('id') as string
  await supabase.from('products').delete().eq('id', id)
  revalidatePath('/admin/productos')
}

// ── Contenidos ────────────────────────────────────────────────────────────────

export async function createContent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await assertAdmin()

  const product_id = formData.get('product_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const complexity = formData.get('complexity') as ComplexityLevel
  const type = formData.get('type') as ContentType
  const drive_file_id = (formData.get('drive_file_id') as string)?.trim()
  const sort_order = Number(formData.get('sort_order') ?? 0)

  if (!product_id) return { error: 'Seleccioná un producto.' }
  if (!title) return { error: 'El título es requerido.' }
  if (!drive_file_id) return { error: 'El ID de Google Drive es requerido.' }

  const { error } = await supabase.from('contents').insert({
    product_id, title, description, complexity, type, drive_file_id, sort_order,
    created_by: userId,
  })
  if (error) return { error: error.message }

  await notifyNewContent(product_id, 1, title)

  revalidatePath('/admin/contenidos')
  redirect('/admin/contenidos')
}

export async function updateContent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await assertAdmin()

  const id = formData.get('id') as string
  const product_id = formData.get('product_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const complexity = formData.get('complexity') as ComplexityLevel
  const type = formData.get('type') as ContentType
  const drive_file_id = (formData.get('drive_file_id') as string)?.trim()
  const sort_order = Number(formData.get('sort_order') ?? 0)

  if (!title) return { error: 'El título es requerido.' }
  if (!drive_file_id) return { error: 'El ID de Google Drive es requerido.' }

  const { error } = await supabase
    .from('contents')
    .update({ product_id, title, description, complexity, type, drive_file_id, sort_order })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/contenidos')
  redirect('/admin/contenidos')
}

export async function deleteContent(formData: FormData) {
  const { supabase } = await assertAdmin()
  const id = formData.get('id') as string
  await supabase.from('contents').delete().eq('id', id)
  revalidatePath('/admin/contenidos')
}

// ── Pantalla de bienvenida ────────────────────────────────────────────────────

export type WelcomeSettingsState =
  | { error?: string; success?: boolean }
  | undefined

export async function updateWelcomeSettings(
  _prevState: WelcomeSettingsState,
  formData: FormData
): Promise<WelcomeSettingsState> {
  await assertAdmin()

  const title = (formData.get('title') as string)?.trim()
  const body = (formData.get('body') as string)?.trim()

  if (!title) return { error: 'El título es requerido.' }
  if (!body) return { error: 'El texto de bienvenida es requerido.' }
  if (title.length > 120) return { error: 'El título no puede superar los 120 caracteres.' }
  if (body.length > 4000) return { error: 'El texto no puede superar los 4000 caracteres.' }

  const service = createServiceClient()
  const { error } = await service
    .from('welcome_settings')
    .upsert({ id: true, title, body, updated_at: new Date().toISOString() })
  if (error) return { error: error.message }

  revalidatePath('/admin/bienvenida')
  revalidatePath('/contenido')
  return { success: true }
}

// ── Diagnóstico de Odoo ────────────────────────────────────────────────────────

export async function adminTestOdooConnection(): Promise<OdooConnectionTest> {
  await assertAdmin()
  return testOdooConnection()
}

export async function adminCheckEmailInOdoo(email: string): Promise<OdooEmailCheck> {
  await assertAdmin()
  const clean = email.trim()
  if (!clean) return { ok: false, error: 'Ingresá un email.' }
  return checkEmailInOdoo(clean)
}

// ── Plantilla de certificado ──────────────────────────────────────────────────

const MAX_SIGNATURE_BYTES = 1024 * 1024 // 1 MB

async function uploadSignature(file: File, name: string): Promise<string> {
  if (file.type !== 'image/png') {
    throw new Error('Las firmas deben ser PNG (idealmente con fondo transparente).')
  }
  if (file.size > MAX_SIGNATURE_BYTES) {
    throw new Error('La imagen de firma no puede superar 1 MB.')
  }

  const service = createServiceClient()
  const path = `firmas/${name}.png`
  const { error } = await service.storage
    .from('certificados')
    .upload(path, file, { contentType: 'image/png', upsert: true })
  if (error) throw new Error(`No se pudo subir la firma: ${error.message}`)

  const { data } = service.storage.from('certificados').getPublicUrl(path)
  // Cache-buster: el path es fijo, la URL debe cambiar al reemplazar la imagen
  return `${data.publicUrl}?v=${Date.now()}`
}

export type CertificateSettingsState =
  | { error?: string; success?: boolean }
  | undefined

export async function updateCertificateSettings(
  _prevState: CertificateSettingsState,
  formData: FormData
): Promise<CertificateSettingsState> {
  await assertAdmin()

  const disertante_name = (formData.get('disertante_name') as string)?.trim()
  const disertante_title = (formData.get('disertante_title') as string)?.trim() || 'Disertante'
  const presidente_name = (formData.get('presidente_name') as string)?.trim()
  const presidente_title = (formData.get('presidente_title') as string)?.trim() || 'Presidente'

  if (!disertante_name || !presidente_name) {
    return { error: 'Los nombres del disertante y del presidente son requeridos.' }
  }

  const service = createServiceClient()

  const patch: Record<string, string> = {
    disertante_name,
    disertante_title,
    presidente_name,
    presidente_title,
    updated_at: new Date().toISOString(),
  }

  try {
    const disertanteFile = formData.get('disertante_signature') as File | null
    if (disertanteFile && disertanteFile.size > 0) {
      patch.disertante_signature_url = await uploadSignature(disertanteFile, 'disertante')
    }
    const presidenteFile = formData.get('presidente_signature') as File | null
    if (presidenteFile && presidenteFile.size > 0) {
      patch.presidente_signature_url = await uploadSignature(presidenteFile, 'presidente')
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error subiendo la firma.' }
  }

  const { error } = await service
    .from('certificate_settings')
    .upsert({ id: true, ...patch })
  if (error) return { error: error.message }

  revalidatePath('/admin/certificado')
  return { success: true }
}

// ── Notificaciones manuales ───────────────────────────────────────────────────

export type SendNotificationState =
  | { error?: string; sent?: number }
  | undefined

export async function sendCourseNotification(
  _prevState: SendNotificationState,
  formData: FormData
): Promise<SendNotificationState> {
  await assertAdmin()

  const productId = (formData.get('product_id') as string) || ''
  const title = (formData.get('title') as string)?.trim()
  const body = (formData.get('body') as string)?.trim() || null

  if (!title) return { error: 'El título es requerido.' }
  if (title.length > 120) return { error: 'El título no puede superar los 120 caracteres.' }

  const service = createServiceClient()

  let targets: string[] = []
  let href = '/contenido'

  if (productId) {
    const { data: product } = await service
      .from('products')
      .select('slug')
      .eq('id', productId)
      .single()
    if (!product) return { error: 'El curso seleccionado no existe.' }
    href = `/contenido/${product.slug}`
    targets = await getEligibleUserIds(productId)
  } else {
    const { data: approved } = await service
      .from('profiles')
      .select('id')
      .eq('status', 'approved')
    targets = (approved ?? []).map((p) => p.id)
  }

  if (targets.length === 0) {
    return { error: 'No hay alumnos con acceso a ese curso para notificar.' }
  }

  const { error } = await service.from('notifications').insert(
    targets.map((user_id) => ({
      user_id,
      title,
      body,
      href,
      product_id: productId || null,
      kind: 'admin' as const,
    }))
  )
  if (error) return { error: error.message }

  return { sent: targets.length }
}

// ── Importador masivo de contenidos ───────────────────────────────────────────

const VALID_COMPLEXITY: ComplexityLevel[] = ['basico', 'intermedio', 'avanzado']
const VALID_TYPES: ContentType[] = ['video', 'pdf', 'audio', 'otro']

export type BulkRow = {
  title: string
  description: string | null
  complexity: ComplexityLevel
  type: ContentType
  drive_file_id: string
}

export type BulkImportResult = {
  created: number
  skipped: { title: string; reason: string }[]
  error?: string
}

export type DriveScanFile = {
  driveFileId: string
  fileName: string
  suggestedTitle: string
  type: ContentType
}

export type DriveScanResult = {
  files: DriveScanFile[]
  subfolders: string[]
  error?: string
}

function mimeToContentType(mime: string): ContentType {
  if (mime.startsWith('video/')) return 'video'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('audio/')) return 'audio'
  return 'otro'
}

/** "instalacion-basica_v2.mp4" → "Instalacion basica v2" */
function fileNameToTitle(name: string): string {
  const base = name.replace(/\.[a-zA-Z0-9]{2,5}$/, '')
  const clean = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return clean ? clean[0].toUpperCase() + clean.slice(1) : name
}

/** Lista los archivos de una carpeta pública de Google Drive vía Drive API v3 */
export async function scanDriveFolder(folderUrl: string): Promise<DriveScanResult> {
  await assertAdmin()

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY
  if (!apiKey) {
    return {
      files: [],
      subfolders: [],
      error:
        'Falta configurar la variable GOOGLE_DRIVE_API_KEY. Ver SETUP.md para crear la API key de Google Cloud.',
    }
  }

  const trimmed = folderUrl.trim()
  const folderId =
    trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ??
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ??
    (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed) ? trimmed : null)

  if (!folderId) {
    return { files: [], subfolders: [], error: 'No parece una URL de carpeta de Drive válida.' }
  }

  const files: DriveScanFile[] = []
  const subfolders: string[] = []
  let pageToken: string | undefined

  try {
    do {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        fields:
          'nextPageToken, files(id, name, mimeType, shortcutDetails(targetId, targetMimeType))',
        pageSize: '100',
        orderBy: 'name',
        // Sin estos dos parámetros la API excluye el contenido de unidades compartidas
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
        key: apiKey,
      })
      if (pageToken) params.set('pageToken', pageToken)

      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        cache: 'no-store',
      })

      if (!res.ok) {
        if (res.status === 403 || res.status === 404) {
          return {
            files: [],
            subfolders: [],
            error:
              'No se pudo acceder a la carpeta. Verificá que esté compartida como "Cualquier persona con el enlace" y que la API key tenga habilitada la Google Drive API.',
          }
        }
        return { files: [], subfolders: [], error: `Error de Drive API (${res.status}).` }
      }

      const json = (await res.json()) as {
        nextPageToken?: string
        files?: {
          id: string
          name: string
          mimeType: string
          shortcutDetails?: { targetId?: string; targetMimeType?: string }
        }[]
      }

      for (const f of json.files ?? []) {
        // Resolver accesos directos al archivo real que apuntan
        let id = f.id
        let mime = f.mimeType
        if (f.mimeType === 'application/vnd.google-apps.shortcut') {
          if (!f.shortcutDetails?.targetId) continue
          id = f.shortcutDetails.targetId
          mime = f.shortcutDetails.targetMimeType ?? 'application/octet-stream'
        }

        if (mime === 'application/vnd.google-apps.folder') {
          subfolders.push(f.name)
          continue
        }
        files.push({
          driveFileId: id,
          fileName: f.name,
          suggestedTitle: fileNameToTitle(f.name),
          type: mimeToContentType(mime),
        })
      }

      pageToken = json.nextPageToken
    } while (pageToken && files.length < 200)
  } catch {
    return { files: [], subfolders: [], error: 'No se pudo conectar con la API de Google Drive.' }
  }

  if (files.length === 0 && subfolders.length === 0) {
    return {
      files: [],
      subfolders: [],
      error: 'La carpeta está vacía o sus archivos no son visibles con esta API key.',
    }
  }

  return { files, subfolders }
}

/** Devuelve los drive_file_id que ya existen como contenido (para marcar duplicados en la vista previa) */
export async function findExistingDriveIds(driveIds: string[]): Promise<string[]> {
  const { supabase } = await assertAdmin()
  if (driveIds.length === 0) return []

  const { data } = await supabase
    .from('contents')
    .select('drive_file_id')
    .in('drive_file_id', driveIds)

  return (data ?? []).map((r) => r.drive_file_id)
}

export async function bulkCreateContents(
  product_id: string,
  rows: BulkRow[]
): Promise<BulkImportResult> {
  const { supabase, userId } = await assertAdmin()

  if (!product_id) return { created: 0, skipped: [], error: 'Seleccioná un curso.' }
  if (rows.length === 0) return { created: 0, skipped: [], error: 'No hay filas para importar.' }
  if (rows.length > 200) return { created: 0, skipped: [], error: 'Máximo 200 contenidos por importación.' }

  const skipped: BulkImportResult['skipped'] = []
  const seen = new Set<string>()
  const valid: BulkRow[] = []

  // Re-chequear duplicados contra la base (la vista previa puede estar desactualizada)
  const { data: existing } = await supabase
    .from('contents')
    .select('drive_file_id')
    .in('drive_file_id', rows.map((r) => r.drive_file_id))
  const existingIds = new Set((existing ?? []).map((r) => r.drive_file_id))

  for (const row of rows) {
    const title = row.title?.trim()
    const drive_file_id = row.drive_file_id?.trim()

    if (!title) { skipped.push({ title: drive_file_id || '(sin título)', reason: 'Falta el título' }); continue }
    if (!drive_file_id) { skipped.push({ title, reason: 'Falta el ID de Drive' }); continue }
    if (!VALID_COMPLEXITY.includes(row.complexity)) { skipped.push({ title, reason: 'Nivel inválido' }); continue }
    if (!VALID_TYPES.includes(row.type)) { skipped.push({ title, reason: 'Tipo inválido' }); continue }
    if (existingIds.has(drive_file_id)) { skipped.push({ title, reason: 'Ya existe un contenido con ese archivo de Drive' }); continue }
    if (seen.has(drive_file_id)) { skipped.push({ title, reason: 'Duplicado dentro de la misma importación' }); continue }

    seen.add(drive_file_id)
    valid.push({ ...row, title, drive_file_id, description: row.description?.trim() || null })
  }

  if (valid.length === 0) return { created: 0, skipped }

  // Continuar la numeración desde el último sort_order del curso
  const { data: maxRow } = await supabase
    .from('contents')
    .select('sort_order')
    .eq('product_id', product_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const baseOrder = (maxRow?.sort_order ?? 0) + 1

  const { error } = await supabase.from('contents').insert(
    valid.map((row, i) => ({
      product_id,
      title: row.title,
      description: row.description,
      complexity: row.complexity,
      type: row.type,
      drive_file_id: row.drive_file_id,
      sort_order: baseOrder + i,
      created_by: userId,
    }))
  )

  if (error) return { created: 0, skipped, error: error.message }

  await notifyNewContent(product_id, valid.length, valid[0]?.title)

  revalidatePath('/admin/contenidos')
  revalidatePath('/contenido', 'layout')

  return { created: valid.length, skipped }
}

// ── Command palette ──────────────────────────────────────────────────────────

export type AdminSearchItem = {
  id: string
  kind: 'user' | 'product' | 'content'
  title: string
  subtitle: string
  href: string
}

export async function getAdminSearchIndex(): Promise<AdminSearchItem[]> {
  const { supabase } = await assertAdmin()
  const service = createServiceClient()

  const [{ data: profiles }, { data: products }, { data: contents }, { data: authUsers }] =
    await Promise.all([
      supabase.from('profiles').select('id, full_name, status').order('full_name'),
      supabase.from('products').select('id, name, slug').order('name'),
      supabase.from('contents').select('id, title, product_id, products(name)').order('title'),
      service.auth.admin.listUsers({ perPage: 1000 }),
    ])

  const emailById = Object.fromEntries((authUsers?.users ?? []).map((u) => [u.id, u.email ?? '']))
  const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }

  const userItems: AdminSearchItem[] = (profiles ?? []).map((p) => ({
    id: p.id,
    kind: 'user',
    title: p.full_name || '(sin nombre)',
    subtitle: `${emailById[p.id] ?? ''} · ${STATUS_LABEL[p.status] ?? p.status}`,
    href: `/admin/usuarios?highlight=${p.id}`,
  }))

  const productItems: AdminSearchItem[] = (products ?? []).map((p) => ({
    id: p.id,
    kind: 'product',
    title: p.name,
    subtitle: `/${p.slug}`,
    href: `/admin/productos/${p.id}`,
  }))

  type ContentRow = { id: string; title: string; product_id: string; products: { name: string } | null }
  const contentItems: AdminSearchItem[] = ((contents ?? []) as ContentRow[]).map((c) => ({
    id: c.id,
    kind: 'content',
    title: c.title,
    subtitle: c.products?.name ?? '—',
    href: `/admin/contenidos/${c.id}`,
  }))

  return [...userItems, ...productItems, ...contentItems]
}

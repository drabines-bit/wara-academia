'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'
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

export async function approveUser(formData: FormData) {
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

  if (data.user?.email && profile?.full_name) {
    sendApprovalEmail(data.user.email, profile.full_name).catch(console.error)
  }

  revalidatePath('/admin/usuarios')
}

export async function rejectUser(formData: FormData) {
  const { supabase } = await assertAdmin()
  const id = formData.get('id') as string

  const { error } = await supabase.from('profiles').update({ status: 'rejected' as UserStatus }).eq('id', id)
  if (error) throw new Error(error.message)

  const service = createServiceClient()
  const { data } = await service.auth.admin.getUserById(id)
  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', id).single()

  if (data.user?.email && profile?.full_name) {
    sendRejectionEmail(data.user.email, profile.full_name).catch(console.error)
  }

  revalidatePath('/admin/usuarios')
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

  if (!name) return { error: 'El nombre es requerido.' }
  const slug = slugInput || slugify(name)

  const { error } = await supabase
    .from('products')
    .insert({ name, slug, description, sort_order, category_id })

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

  if (!name) return { error: 'El nombre es requerido.' }
  if (!slug) return { error: 'El slug es requerido.' }

  const { error } = await supabase
    .from('products')
    .update({ name, slug, description, sort_order, category_id })
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

  revalidatePath('/admin/contenidos')
  revalidatePath('/contenido', 'layout')

  return { created: valid.length, skipped }
}

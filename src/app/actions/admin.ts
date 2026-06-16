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

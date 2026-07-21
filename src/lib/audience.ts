import 'server-only'
import { hasWarapeopleTag } from '@/lib/odoo'
import type { UserAudience } from '@/types/database'

const EMPLOYEE_EMAIL_DOMAIN = '@waragps.com'

/**
 * Determina si un usuario es "empleado" o "cliente" para el feed de novedades.
 * Cascada: dominio de email de la empresa → etiqueta "warapeople" en Odoo →
 * "cliente" por default. Se recalcula en cada aprobación; el admin puede
 * sobrescribirla a mano después desde el panel de Usuarios.
 */
export async function deriveAudience(email: string): Promise<UserAudience> {
  if (email.toLowerCase().endsWith(EMPLOYEE_EMAIL_DOMAIN)) return 'empleado'
  if ((await hasWarapeopleTag(email)) === true) return 'empleado'
  return 'cliente'
}

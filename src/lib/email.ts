import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM =
  process.env.RESEND_FROM_EMAIL ?? 'Academia WARA GPS <onboarding@resend.dev>'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// Obtiene emails de todos los admins via service role (saltea RLS)
async function getAdminEmails(): Promise<string[]> {
  const supabase = createServiceClient()

  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin') as { data: { id: string }[] | null }

  if (!adminProfiles?.length) return []

  const adminIds = adminProfiles.map((p) => p.id)
  const emails: string[] = []

  for (const id of adminIds) {
    const { data } = await supabase.auth.admin.getUserById(id)
    if (data.user?.email) emails.push(data.user.email)
  }

  return emails
}

// ── Aviso a admins: nuevo registro pendiente ──────────────────────────────────

export async function notifyAdminsNewUser(fullName: string, email: string) {
  const adminEmails = await getAdminEmails()
  if (!adminEmails.length) return

  await resend.emails.send({
    from: FROM,
    to: adminEmails,
    subject: 'Nuevo registro pendiente — Academia WARA GPS',
    html: `
      <p>Hola,</p>
      <p>Hay un nuevo registro pendiente de aprobación en Academia WARA GPS:</p>
      <ul>
        <li><strong>Nombre:</strong> ${fullName}</li>
        <li><strong>Email:</strong> ${email}</li>
      </ul>
      <p>
        <a href="${SITE_URL}/admin/usuarios" style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
          Ver en el panel
        </a>
      </p>
      <p style="color:#666;font-size:12px">Academia WARA GPS</p>
    `,
  })
}

// ── Email de aprobación al usuario ────────────────────────────────────────────

export async function sendApprovalEmail(toEmail: string, fullName: string) {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: '¡Tu acceso a Academia WARA GPS fue aprobado!',
    html: `
      <p>Hola ${fullName},</p>
      <p>¡Buenas noticias! Tu acceso a <strong>Academia WARA GPS</strong> fue aprobado.</p>
      <p>Ya podés ingresar y acceder a todo el material de capacitación.</p>
      <p>
        <a href="${SITE_URL}/login" style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
          Ingresar ahora
        </a>
      </p>
      <p style="color:#666;font-size:12px">Academia WARA GPS</p>
    `,
  })
}

// ── Email de rechazo al usuario ───────────────────────────────────────────────

export async function sendRejectionEmail(toEmail: string, fullName: string) {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Tu solicitud en Academia WARA GPS',
    html: `
      <p>Hola ${fullName},</p>
      <p>
        Lamentablemente, tu solicitud de acceso a <strong>Academia WARA GPS</strong>
        no pudo ser aprobada en este momento.
      </p>
      <p>
        Si tenés alguna consulta, contactate con el equipo WARA GPS respondiendo
        este email.
      </p>
      <p style="color:#666;font-size:12px">Academia WARA GPS</p>
    `,
  })
}

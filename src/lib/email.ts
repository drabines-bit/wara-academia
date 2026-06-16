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

// ── Layout base compartido ────────────────────────────────────────────────────

function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f3f7;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header con logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <img src="${SITE_URL}/logo.svg" alt="WARA GPS" height="36" style="height:36px;width:auto;display:inline-block;">
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #d1d8e4;padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#90a0b8;">
                Academia WARA GPS · Este es un email automático, no responder.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Aviso a admins: nuevo registro pendiente ──────────────────────────────────

export async function notifyAdminsNewUser(fullName: string, email: string) {
  const adminEmails = await getAdminEmails()
  if (!adminEmails.length) return

  await resend.emails.send({
    from: FROM,
    to: adminEmails,
    subject: 'Nuevo registro pendiente — Academia WARA GPS',
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#1a2030;">Nuevo registro pendiente</h2>
      <p style="margin:0 0 16px;color:#4a5568;line-height:1.6;">
        Hay un nuevo usuario esperando aprobación:
      </p>
      <table cellpadding="0" cellspacing="0" style="background:#f1f3f7;border-radius:8px;padding:16px;margin-bottom:24px;width:100%;">
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#4a5568;">
            <strong style="color:#1a2030;">Nombre:</strong>&nbsp;&nbsp;${fullName}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#4a5568;">
            <strong style="color:#1a2030;">Email:</strong>&nbsp;&nbsp;${email}
          </td>
        </tr>
      </table>
      <a href="${SITE_URL}/admin/usuarios?estado=pending"
         style="display:inline-block;background:#3b82f6;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        Revisar en el panel
      </a>
    `),
  })
}

// ── Email de aprobación al usuario ────────────────────────────────────────────

export async function sendApprovalEmail(toEmail: string, fullName: string) {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: '¡Tu acceso a Academia WARA GPS fue aprobado!',
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#1a2030;">¡Bienvenido, ${fullName}!</h2>
      <p style="margin:0 0 16px;color:#4a5568;line-height:1.6;">
        Tu acceso a <strong>Academia WARA GPS</strong> fue aprobado.
        Ya podés ingresar y acceder a todo el material de capacitación.
      </p>
      <a href="${SITE_URL}/login"
         style="display:inline-block;background:#3b82f6;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        Ingresar ahora
      </a>
    `),
  })
}

// ── Email de rechazo al usuario ───────────────────────────────────────────────

export async function sendRejectionEmail(toEmail: string, fullName: string) {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Tu solicitud en Academia WARA GPS',
    html: emailLayout(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#1a2030;">Hola, ${fullName}</h2>
      <p style="margin:0 0 16px;color:#4a5568;line-height:1.6;">
        Lamentablemente, tu solicitud de acceso a <strong>Academia WARA GPS</strong>
        no pudo ser aprobada en este momento.
      </p>
      <p style="margin:0;color:#4a5568;line-height:1.6;">
        Si tenés alguna consulta, respondé este email y te ayudaremos.
      </p>
    `),
  })
}

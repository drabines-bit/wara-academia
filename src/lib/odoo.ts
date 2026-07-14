import 'server-only'

/**
 * Cliente mínimo de Odoo (JSON-RPC externo) para verificar si un email
 * pertenece a la base de contactos de la empresa.
 *
 * Variables de entorno (ver SETUP.md § 9):
 *   ODOO_URL      p.ej. https://wara.odoo.com
 *   ODOO_DB       nombre de la base (en Odoo Online suele ser el subdominio)
 *   ODOO_LOGIN    email del usuario de Odoo dueño de la API key
 *   ODOO_API_KEY  clave API generada en Odoo
 */

const TIMEOUT_MS = 6000

async function rpc(
  url: string,
  service: string,
  method: string,
  args: unknown[]
): Promise<unknown> {
  const res = await fetch(`${url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service, method, args },
      id: 1,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Odoo HTTP ${res.status}`)
  const json = (await res.json()) as {
    result?: unknown
    error?: { message?: string; data?: { message?: string } }
  }
  if (json.error) {
    throw new Error(json.error.data?.message ?? json.error.message ?? 'Error de Odoo')
  }
  return json.result
}

/**
 * Verifica si el email figura en los contactos (res.partner) de Odoo.
 *
 * Devuelve:
 *   true  → el contacto existe
 *   false → no existe
 *   null  → no se pudo verificar (Odoo sin configurar, caído o con error);
 *           el registro debe seguir el circuito de aprobación manual
 */
export async function isEmailInOdoo(email: string): Promise<boolean | null> {
  const url = process.env.ODOO_URL?.replace(/\/+$/, '')
  const db = process.env.ODOO_DB
  const login = process.env.ODOO_LOGIN
  const apiKey = process.env.ODOO_API_KEY

  if (!url || !db || !login || !apiKey) return null

  try {
    const uid = await rpc(url, 'common', 'authenticate', [db, login, apiKey, {}])
    if (typeof uid !== 'number' || uid <= 0) {
      console.error('isEmailInOdoo: autenticación rechazada (revisar ODOO_LOGIN / ODOO_API_KEY)')
      return null
    }

    // =ilike sin comodines = igualdad case-insensitive
    const count = await rpc(url, 'object', 'execute_kw', [
      db,
      uid,
      apiKey,
      'res.partner',
      'search_count',
      [[['email', '=ilike', email]]],
    ])

    return typeof count === 'number' ? count > 0 : null
  } catch (err) {
    console.error('isEmailInOdoo: no se pudo consultar Odoo:', err)
    return null
  }
}

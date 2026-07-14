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

// La autenticación (~1-1.5s) es la llamada más lenta del flujo; el uid de
// sesión resultante es válido para llamadas posteriores. Cachearlo en el
// módulo evita reautenticar en cada consulta dentro de la misma instancia
// serverless "tibia". Es solo una optimización: en cold start o si expira,
// se reautentica sin que el llamador tenga que hacer nada distinto.
const UID_TTL_MS = 5 * 60_000
let cachedUid: { uid: number; expiresAt: number } | null = null

type OdooConfig = { url: string; db: string; login: string; apiKey: string }

function getConfig(): OdooConfig | null {
  const url = process.env.ODOO_URL?.replace(/\/+$/, '')
  const db = process.env.ODOO_DB
  const login = process.env.ODOO_LOGIN
  const apiKey = process.env.ODOO_API_KEY
  if (!url || !db || !login || !apiKey) return null
  return { url, db, login, apiKey }
}

async function rpc(url: string, service: string, method: string, args: unknown[]): Promise<unknown> {
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

async function authenticate(cfg: OdooConfig): Promise<number> {
  const uid = await rpc(cfg.url, 'common', 'authenticate', [cfg.db, cfg.login, cfg.apiKey, {}])
  if (typeof uid !== 'number' || uid <= 0) {
    throw new Error('Autenticación rechazada (revisar ODOO_DB, ODOO_LOGIN y ODOO_API_KEY)')
  }
  return uid
}

async function getUid(cfg: OdooConfig): Promise<number> {
  const now = Date.now()
  if (cachedUid && cachedUid.expiresAt > now) return cachedUid.uid
  const uid = await authenticate(cfg)
  cachedUid = { uid, expiresAt: now + UID_TTL_MS }
  return uid
}

/** Ejecuta execute_kw reintentando una vez con reautenticación si el uid cacheado ya no es válido */
async function executeKw(
  cfg: OdooConfig,
  model: string,
  method: string,
  args: unknown[]
): Promise<unknown> {
  let uid = await getUid(cfg)
  try {
    return await rpc(cfg.url, 'object', 'execute_kw', [cfg.db, uid, cfg.apiKey, model, method, args])
  } catch (err) {
    cachedUid = null
    uid = await getUid(cfg)
    return await rpc(cfg.url, 'object', 'execute_kw', [cfg.db, uid, cfg.apiKey, model, method, args])
  }
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
  const cfg = getConfig()
  if (!cfg) return null

  try {
    // =ilike sin comodines = igualdad case-insensitive
    const count = await executeKw(cfg, 'res.partner', 'search_count', [[['email', '=ilike', email]]])
    return typeof count === 'number' ? count > 0 : null
  } catch (err) {
    console.error('isEmailInOdoo: no se pudo consultar Odoo:', err)
    return null
  }
}

// ── Diagnóstico (usado por el panel de admin) ─────────────────────────────────
// A diferencia de isEmailInOdoo, estas funciones no silencian errores: el
// admin necesita ver el motivo exacto de un fallo, no solo "no se pudo".

export type OdooConnectionTest =
  | { ok: true; uid: number; contactsTotal: number; authMs: number; queryMs: number; usedCachedAuth: boolean }
  | { ok: false; error: string }

export async function testOdooConnection(): Promise<OdooConnectionTest> {
  const cfg = getConfig()
  if (!cfg) {
    return {
      ok: false,
      error:
        'Faltan variables de entorno (ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY). Ver SETUP.md § 9.',
    }
  }

  try {
    const usedCachedAuth = !!cachedUid && cachedUid.expiresAt > Date.now()

    const authStart = Date.now()
    const uid = await getUid(cfg)
    const authMs = Date.now() - authStart

    const queryStart = Date.now()
    const contactsTotal = await rpc(cfg.url, 'object', 'execute_kw', [
      cfg.db,
      uid,
      cfg.apiKey,
      'res.partner',
      'search_count',
      [[]],
    ])
    const queryMs = Date.now() - queryStart

    return {
      ok: true,
      uid,
      contactsTotal: typeof contactsTotal === 'number' ? contactsTotal : 0,
      authMs,
      queryMs,
      usedCachedAuth,
    }
  } catch (err) {
    cachedUid = null
    return { ok: false, error: err instanceof Error ? err.message : 'Error desconocido conectando a Odoo.' }
  }
}

export type OdooEmailCheck =
  | { ok: true; found: boolean; ms: number }
  | { ok: false; error: string }

export async function checkEmailInOdoo(email: string): Promise<OdooEmailCheck> {
  const cfg = getConfig()
  if (!cfg) {
    return {
      ok: false,
      error:
        'Faltan variables de entorno (ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY). Ver SETUP.md § 9.',
    }
  }

  try {
    const start = Date.now()
    const count = await executeKw(cfg, 'res.partner', 'search_count', [[['email', '=ilike', email]]])
    return { ok: true, found: typeof count === 'number' && count > 0, ms: Date.now() - start }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error desconocido consultando Odoo.' }
  }
}

@AGENTS.md

# Academia WARA GPS — Contexto para Claude

## Stack
- Next.js 16 (App Router, TypeScript) + Tailwind CSS
- Supabase (Postgres + Auth + RLS)
- Resend (emails transaccionales)
- Hosting: Vercel (`academia-wara.vercel.app`)

## Convenciones críticas

**Proxy (middleware):** En Next.js 16 el archivo se llama `src/proxy.ts` (no `middleware.ts`).
La función exportada se llama `proxy`, no `middleware`.

**Auth siempre server-side:** Nunca gatear acceso solo en `proxy.ts` por CVE-2025-29927.
Verificar sesión con `supabase.auth.getUser()` en cada Server Component / Route Handler / Server Action.
Nunca usar `getSession()` en proxy (no valida el JWT contra el servidor).

**service_role key:** Solo en servidor. Jamás en cliente. Usar `createServiceClient()` de `@/lib/supabase/service`.

**Clientes Supabase:**
- Browser: `@/lib/supabase/client` → `createClient()`
- Server: `@/lib/supabase/server` → `createClient()` (async, usa cookies)
- Service: `@/lib/supabase/service` → `createServiceClient()` (solo server)

## Estructura de rutas
```
src/app/
  (auth)/          → login, registro, pendiente (layout centrado)
  (protected)/     → layout verifica sesión + status=approved
    admin/         → layout verifica role=admin
  auth/callback/   → route handler del callback de Supabase
  page.tsx         → redirect según sesión/perfil
```

## Temas
4 temas via `data-theme="1|2|3|4"` en `<html>`. Variables CSS en `globals.css`.
localStorage key: `wara-theme`. Sync con `profiles.preferred_theme` en Supabase.

## Idioma
Toda la UI en español (Argentina). `lang="es-AR"` en el html root.

## Roles y estados
- Roles: `admin` | `alumno`
- Estados: `pending` | `approved` | `rejected`
- Admins se siembran a mano (ver SETUP.md). No hay UI de alta de admin.

## Sprints
- Sprint 0 ✅ Infra y andamiaje
- Sprint 1 Auth completa (login, registro, emails, aprobación)
- Sprint 2 Panel admin (CRUD productos, contenidos, usuarios)
- Sprint 3 Vista alumno (navegación producto → nivel → contenido)
- Sprint 4 Selector de temas + embed Spotify
- Sprint 5 Endurecimiento y producción

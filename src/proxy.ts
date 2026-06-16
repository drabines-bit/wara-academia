import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren sesión activa
const PROTECTED = ['/admin', '/contenido', '/perfil']
// Rutas de auth que no deben verse logueado (excepto /registro/enviado que sí puede verse)
const AUTH_ONLY = ['/login', '/registro', '/olvide-contrasena']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresca la sesión y valida el token.
  // IMPORTANTE: Nunca usar getSession() aquí — no valida el JWT contra el servidor.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p))

  // Sin sesión → redirigir a login en rutas protegidas
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión → redirigir fuera de las páginas de auth
  if (isAuthOnly && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Excluir assets estáticos de Next.js y archivos públicos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

import { NextResponse } from 'next/server'
import { notifyDueNews } from '@/lib/news'

export const dynamic = 'force-dynamic'

// Disparado por Vercel Cron (ver vercel.json). Notifica en la campanita las
// novedades cuya publicación programada ya venció y todavía no se avisaron.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  const { notified } = await notifyDueNews()
  return NextResponse.json({ ok: true, notified })
}

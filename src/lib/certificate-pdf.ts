import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { CertificateData } from '@/app/actions/progress'

// A4 apaisado en puntos
const W = 841.89
const H = 595.28

const INK = rgb(0.1, 0.13, 0.19) // #1a2030
const MUTED = rgb(0.42, 0.47, 0.55)
const BRAND = rgb(0.73, 0.11, 0.11) // rojo WARA
const LINE = rgb(0.55, 0.58, 0.65)

function centerText(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = INK
) {
  const width = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: (W - width) / 2, y, size, font, color })
}

async function fetchPng(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([W, H])

  const serif = await doc.embedFont(StandardFonts.TimesRoman)
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold)
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic)
  const sans = await doc.embedFont(StandardFonts.Helvetica)
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold)

  // ── Marco doble ────────────────────────────────────────────────────────────
  page.drawRectangle({
    x: 24, y: 24, width: W - 48, height: H - 48,
    borderColor: INK, borderWidth: 2,
  })
  page.drawRectangle({
    x: 32, y: 32, width: W - 64, height: H - 64,
    borderColor: BRAND, borderWidth: 0.75,
  })

  // ── Encabezado ─────────────────────────────────────────────────────────────
  centerText(page, 'A C A D E M I A   W A R A   G P S', H - 92, sansBold, 13, BRAND)
  centerText(page, 'CERTIFICADO DE FINALIZACIÓN', H - 138, serifBold, 34)

  // Regla decorativa
  page.drawLine({
    start: { x: W / 2 - 110, y: H - 158 },
    end: { x: W / 2 + 110, y: H - 158 },
    thickness: 1,
    color: BRAND,
  })

  // ── Cuerpo ─────────────────────────────────────────────────────────────────
  centerText(page, 'Se certifica que', H - 210, serif, 16, MUTED)
  centerText(page, data.studentName, H - 252, serifItalic, 34)

  // Línea bajo el nombre
  const nameWidth = serifItalic.widthOfTextAtSize(data.studentName, 34)
  const lineHalf = Math.max(nameWidth / 2 + 24, 140)
  page.drawLine({
    start: { x: W / 2 - lineHalf, y: H - 262 },
    end: { x: W / 2 + lineHalf, y: H - 262 },
    thickness: 0.5,
    color: LINE,
  })

  centerText(page, 'completó satisfactoriamente la capacitación', H - 300, serif, 16, MUTED)
  centerText(page, data.courseName, H - 336, serifBold, 24)

  const fecha = new Date(data.issuedAt).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  centerText(page, `Emitido el ${fecha}`, H - 372, serif, 12, MUTED)

  // ── Firmas ─────────────────────────────────────────────────────────────────
  const SIG_LINE_W = 190
  const SIG_Y = 130 // altura de la línea de firma
  const leftX = W / 4 - SIG_LINE_W / 2 + 40
  const rightX = (3 * W) / 4 - SIG_LINE_W / 2 - 40

  const signers = [
    {
      x: leftX,
      name: data.disertanteName,
      title: data.disertanteTitle,
      sigUrl: data.disertanteSignatureUrl,
    },
    {
      x: rightX,
      name: data.presidenteName,
      title: data.presidenteTitle,
      sigUrl: data.presidenteSignatureUrl,
    },
  ]

  for (const s of signers) {
    // Imagen de firma sobre la línea (si está configurada)
    if (s.sigUrl) {
      const bytes = await fetchPng(s.sigUrl)
      if (bytes) {
        try {
          const img = await doc.embedPng(bytes)
          const maxW = SIG_LINE_W - 20
          const maxH = 52
          const scale = Math.min(maxW / img.width, maxH / img.height, 1)
          const w = img.width * scale
          const h = img.height * scale
          page.drawImage(img, {
            x: s.x + (SIG_LINE_W - w) / 2,
            y: SIG_Y + 4,
            width: w,
            height: h,
          })
        } catch {
          // PNG inválido: se deja la línea para firma manuscrita
        }
      }
    }

    page.drawLine({
      start: { x: s.x, y: SIG_Y },
      end: { x: s.x + SIG_LINE_W, y: SIG_Y },
      thickness: 0.75,
      color: INK,
    })

    const nameW = sansBold.widthOfTextAtSize(s.name, 11)
    page.drawText(s.name, {
      x: s.x + (SIG_LINE_W - nameW) / 2,
      y: SIG_Y - 16,
      size: 11,
      font: sansBold,
      color: INK,
    })
    const titleW = sans.widthOfTextAtSize(s.title, 9)
    page.drawText(s.title, {
      x: s.x + (SIG_LINE_W - titleW) / 2,
      y: SIG_Y - 29,
      size: 9,
      font: sans,
      color: MUTED,
    })
  }

  return doc.save()
}

export function certificateFileName(courseName: string, studentName: string): string {
  const clean = (s: string) =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `Certificado-${clean(courseName)}-${clean(studentName)}.pdf`
}

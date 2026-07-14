'use client'

import { useState } from 'react'
import { getCertificateData } from '@/app/actions/progress'

export function CertificateButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setLoading(true)
    setError('')
    try {
      const result = await getCertificateData(productId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      // Carga diferida: pdf-lib solo se descarga cuando se usa
      const { generateCertificatePdf, certificateFileName } = await import(
        '@/lib/certificate-pdf'
      )
      const bytes = await generateCertificatePdf(result.data)
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = certificateFileName(result.data.courseName, result.data.studentName)
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo generar el certificado. Probá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--success)] px-3.5 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
        Descargar certificado
      </button>
      {error && <p className="max-w-xs text-right text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
}

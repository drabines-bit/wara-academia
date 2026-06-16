import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Academia WARA GPS',
    default: 'Academia WARA GPS',
  },
  description: 'Portal de capacitación para clientes de WARA GPS.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR" data-theme="1" className="h-full">
      <head>
        {/* Evita flash de tema incorrecto al cargar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('wara-theme');if(t&&['1','2','3','4'].includes(t))document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

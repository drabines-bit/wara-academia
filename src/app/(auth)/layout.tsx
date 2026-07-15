import { Footer } from '@/components/Footer'
import { AuthBackdrop } from '@/components/auth/AuthBackdrop'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative isolate min-h-screen flex flex-col">
      <AuthBackdrop />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <Footer />
    </div>
  )
}

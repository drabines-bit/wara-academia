import { AlumnoNav } from '@/components/alumno/AlumnoNav'

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AlumnoNav />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  )
}

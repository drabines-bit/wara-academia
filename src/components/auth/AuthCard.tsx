export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-lg">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          {/* Logo placeholder — reemplazar con <Image> cuando haya asset */}
          <div className="h-8 w-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-xs font-bold text-white">W</span>
          </div>
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            Academia WARA GPS
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}

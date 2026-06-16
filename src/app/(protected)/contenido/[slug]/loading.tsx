export default function LoadingProducto() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div>
        <div className="h-4 w-12 rounded bg-[var(--bg-card)]" />
        <div className="mt-2 h-8 w-64 rounded-lg bg-[var(--bg-card)]" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-[var(--bg-card)]" />
      </div>
      <div className="flex gap-4 border-b border-[var(--border)] pb-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-20 rounded bg-[var(--bg-card)]" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]"
          />
        ))}
      </div>
    </div>
  )
}

export default function LoadingProductos() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div>
        <div className="h-8 w-40 rounded-lg bg-[var(--bg-card)]" />
        <div className="mt-2 h-4 w-72 rounded bg-[var(--bg-card)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-36 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]"
          />
        ))}
      </div>
    </div>
  )
}

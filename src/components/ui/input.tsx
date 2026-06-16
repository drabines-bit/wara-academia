import { forwardRef } from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-lg border px-3.5 py-2.5 text-sm',
            'bg-[var(--bg-card)] text-[var(--text-primary)]',
            'placeholder:text-[var(--text-muted)]',
            error
              ? 'border-[var(--danger)] focus:outline-[var(--danger)]'
              : 'border-[var(--border)] focus:outline-[var(--accent)]',
            'focus:outline focus:outline-2 focus:outline-offset-0',
            'transition-colors',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--danger)]">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

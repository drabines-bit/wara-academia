export type ToastTone = 'success' | 'error' | 'info'

export type ToastOptions = {
  id?: string
  text: string
  tone?: ToastTone
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

export type ToastEventDetail = Required<Pick<ToastOptions, 'id' | 'text' | 'tone' | 'duration'>> &
  Pick<ToastOptions, 'actionLabel' | 'onAction'>

export const TOAST_EVENT = 'admin-toast'
export const TOAST_DISMISS_EVENT = 'admin-toast-dismiss'

let counter = 0

export function showToast(opts: ToastOptions): string {
  const id = opts.id ?? `toast-${++counter}-${Date.now()}`
  const detail: ToastEventDetail = {
    id,
    text: opts.text,
    tone: opts.tone ?? 'info',
    duration: opts.duration ?? 5000,
    actionLabel: opts.actionLabel,
    onAction: opts.onAction,
  }
  window.dispatchEvent(new CustomEvent<ToastEventDetail>(TOAST_EVENT, { detail }))
  return id
}

export function dismissToast(id: string) {
  window.dispatchEvent(new CustomEvent<{ id: string }>(TOAST_DISMISS_EVENT, { detail: { id } }))
}

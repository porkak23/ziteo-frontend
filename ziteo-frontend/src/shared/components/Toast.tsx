import { useEffect } from 'react'

export interface ToastData {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastProps {
  toasts: ToastData[]
  onRemove: (id: string) => void
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-16 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 3000)
    return () => clearTimeout(t)
  }, [toast.id, onRemove])

  const bgClass =
    toast.type === 'success' ? 'bg-secondary-container text-on-secondary-container' :
    toast.type === 'error'   ? 'bg-error-container text-on-error-container' :
                               'bg-surface-container text-on-surface'

  const icon =
    toast.type === 'success' ? 'check_circle' :
    toast.type === 'error'   ? 'error' :
                               'info'

  return (
    <div data-testid={`toast-${toast.type}`} className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl shadow-md w-full max-w-sm ${bgClass}`}>
      <span className="material-symbols-outlined text-base leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <span className="font-body text-sm flex-1">{toast.message}</span>
    </div>
  )
}

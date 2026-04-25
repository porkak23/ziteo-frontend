import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import type { Notification } from '../types/notificationTypes'

interface NotificationBellProps {
  userId: string
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} d`
  return new Date(isoString).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function typeIcon(type: Notification['type']): string {
  switch (type) {
    case 'contract':            return 'handshake'
    case 'project_application': return 'construction'
    case 'order':               return 'shopping_bag'
    default:                    return 'info'
  }
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications(userId)

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const badgeLabel = unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : null

  const handleNotifClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        aria-label="Notificaciones"
      >
        <span
          className="material-symbols-outlined text-on-surface-variant text-2xl leading-none"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          notifications
        </span>
        {badgeLabel && (
          <span className="absolute top-1 right-1 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center rounded-full bg-primary text-white font-label font-semibold text-[10px] leading-none">
            {badgeLabel}
          </span>
        )}
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-2xl max-h-[70vh] flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="w-10 h-1 bg-on-surface/15 rounded-full mx-auto mt-3 mb-1" />

        <div className="flex items-center justify-between px-4 pt-2 pb-2">
          <span className="font-label font-semibold text-[15px] text-on-surface">
            Notificaciones
          </span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="font-label text-xs text-primary font-semibold hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="w-11 h-11 flex items-center justify-center text-on-surface-variant"
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined text-xl leading-none">
                close
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-6 flex flex-col gap-2">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-surface-container animate-pulse"
              />
            ))
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-on-surface-variant">
              <span
                className="material-symbols-outlined text-4xl leading-none"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                notifications_off
              </span>
              <span className="font-body text-sm">Sin notificaciones</span>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl border border-outline-variant transition-colors hover:bg-surface-container ${!n.is_read ? 'bg-primary/5' : 'bg-surface'}`}
              >
                <span
                  className="material-symbols-outlined text-xl leading-none mt-0.5 text-primary shrink-0"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  {typeIcon(n.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-label font-semibold text-sm text-on-surface truncate">
                    {n.title}
                  </p>
                  <p className="font-body text-xs text-on-surface-variant line-clamp-2">
                    {n.body}
                  </p>
                </div>
                <span className="font-label text-[10px] text-on-surface-variant shrink-0 mt-0.5">
                  {formatRelativeTime(n.created_at)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}

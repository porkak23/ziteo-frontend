import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'

interface AppNotification {
  id: string
  type: string
  title: string
  message: string | null
  is_read: boolean
  created_at: string
  user_id: string
}

const NOTIFICATION_ICONS: Record<string, string> = {
  contract: 'assignment',
  project: 'construction',
  order: 'inbox',
  payment: 'payments',
  message: 'chat',
  default: 'notifications',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

export function NotificationsScreen() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ['notifications', user?.user_id],
    enabled: !!user?.user_id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, message, is_read, created_at, user_id')
        .eq('user_id', user!.user_id)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as AppNotification[]
    },
  })

  useEffect(() => {
    if (!user?.user_id) return

    const channel = supabase
      .channel(`notifications:${user.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.user_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.user_id] })
          queryClient.invalidateQueries({ queryKey: ['recentNotifications', user.user_id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.user_id, queryClient])

  const { mutate: markAllRead, isPending: isMarking } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.user_id)
        .eq('is_read', false)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.user_id] })
      queryClient.invalidateQueries({ queryKey: ['recentNotifications', user?.user_id] })
    },
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-outline-variant bg-surface flex-shrink-0">
        <h1 className="font-headline font-extrabold text-xl text-on-surface">Notificaciones</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isMarking}
            className="text-xs text-primary font-label font-semibold active:opacity-70 transition-opacity disabled:opacity-50"
          >
            {isMarking ? 'Marcando...' : 'Marcar todas como leídas'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-20" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">notifications_off</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">Todo al día</p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">Aquí aparecerán los avisos de contratos, pedidos y mensajes</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-outline-variant">
            {notifications.map((n) => {
              const icon = NOTIFICATION_ICONS[n.type] ?? NOTIFICATION_ICONS.default
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3.5 ${!n.is_read ? 'bg-primary/5' : 'bg-surface'}`}
                >
                  <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5">
                    <span
                      className="material-symbols-outlined text-[18px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-label font-semibold text-sm text-on-surface leading-snug">
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    {n.message && (
                      <p className="font-body text-xs text-on-surface-variant mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    )}
                    <p className="font-body text-xs text-on-surface-variant mt-1 opacity-70">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

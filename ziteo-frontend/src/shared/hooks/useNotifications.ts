/*
 * SQL para crear la tabla notifications si no existiera:
 *
 * CREATE TABLE notifications (
 *   id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id             uuid NOT NULL,
 *   type                varchar NOT NULL CHECK (type IN ('contract','project_application','order','general')),
 *   title               varchar NOT NULL,
 *   message             text NOT NULL,
 *   related_entity_type varchar,
 *   related_entity_id   uuid,
 *   is_read             boolean NOT NULL DEFAULT false,
 *   read_at             timestamp,
 *   created_at          timestamp NOT NULL DEFAULT now()
 * );
 * CREATE INDEX notifications_user_id_idx ON notifications(user_id);
 * ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users see own notifications"
 *   ON notifications FOR ALL USING (user_id = auth.uid()::uuid);
 */

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Notification } from '../types/notificationTypes'

const QUERY_KEY = (userId: string) => ['notifications', userId]

// DB row shape (message vs body)
interface NotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  related_entity_type: string | null
  related_entity_id: string | null
  created_at: string
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as Notification['type'],
    title: row.title,
    body: row.message,
    is_read: row.is_read,
    related_entity_type: row.related_entity_type,
    related_entity_id: row.related_entity_id,
    created_at: row.created_at,
  }
}

export function useNotifications(userId: string) {
  const queryClient = useQueryClient()
  // Capture queryClient in a ref so the realtime effect never needs to re-run
  // when queryClient changes. React Query guarantees queryClient is a stable
  // singleton, but including it in the deps array risks spurious re-subscriptions
  // if the linting rule forces its presence.
  const queryClientRef = useRef(queryClient)

  const query = useQuery<Notification[]>({
    queryKey: QUERY_KEY(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        return ((data ?? []) as NotificationRow[]).map(rowToNotification)
      } catch {
        // Table may not exist in some environments — fail silently
        return []
      }
    },
  })

  // Realtime subscription
  useEffect(() => {
    if (!userId) return

    const uid = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`notifications:${userId}:${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = rowToNotification(payload.new as NotificationRow)
          queryClientRef.current.setQueryData<Notification[]>(
            QUERY_KEY(userId),
            (prev) => [newNotif, ...(prev ?? [])],
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // queryClient is intentionally omitted: it is a stable singleton from
    // React Query and will never change. Using queryClientRef.current avoids
    // a spurious channel teardown + re-subscription on every render.
  }, [userId])

  const markAsRead = async (id: string): Promise<boolean> => {
    // Optimistic update — revert on failure
    queryClient.setQueryData<Notification[]>(QUERY_KEY(userId), (prev) =>
      (prev ?? []).map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      // Revert optimistic update
      queryClient.setQueryData<Notification[]>(QUERY_KEY(userId), (prev) =>
        (prev ?? []).map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      )
      console.error('[useNotifications] markAsRead failed:', error.message)
      return false
    }
    return true
  }

  const markAllAsRead = async (): Promise<boolean> => {
    // Optimistic update
    const snapshot = queryClient.getQueryData<Notification[]>(QUERY_KEY(userId))
    queryClient.setQueryData<Notification[]>(QUERY_KEY(userId), (prev) =>
      (prev ?? []).map((n) => ({ ...n, is_read: true })),
    )

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      // Revert optimistic update
      queryClient.setQueryData<Notification[]>(QUERY_KEY(userId), snapshot)
      console.error('[useNotifications] markAllAsRead failed:', error.message)
      return false
    }
    return true
  }

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    markAsRead,
    markAllAsRead,
  }
}

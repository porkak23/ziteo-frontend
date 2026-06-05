/*
 * SQL para crear la tabla messages en Supabase:
 *
 * CREATE TABLE messages (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   sender_id uuid NOT NULL,
 *   receiver_id uuid NOT NULL,
 *   content text NOT NULL,
 *   is_read boolean NOT NULL DEFAULT false,
 *   created_at timestamp NOT NULL DEFAULT now()
 * );
 * CREATE INDEX messages_participants_idx ON messages(sender_id, receiver_id);
 * ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users see own messages"
 *   ON messages FOR ALL
 *   USING (sender_id = auth.uid()::uuid OR receiver_id = auth.uid()::uuid);
 */

import { useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

const QUERY_KEY = (a: string, b: string) =>
  ['chat', [a, b].sort().join('_')] as const

async function fetchMessages(
  currentUserId: string,
  otherUserId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    )
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    // Fail silently if table doesn't exist yet
    if (
      error.code === '42P01' ||
      error.message?.toLowerCase().includes('does not exist')
    ) {
      return []
    }
    throw error
  }
  return (data as Message[]) ?? []
}

async function markAsRead(currentUserId: string, otherUserId: string) {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', currentUserId)
    .eq('sender_id', otherUserId)
    .eq('is_read', false)
}

export function useChat(currentUserId: string, otherUserId: string) {
  const queryClient = useQueryClient()
  // useMemo gives a stable array reference — prevents useEffect from
  // unsubscribing/resubscribing the Realtime channel on every render.
  const queryKey = useMemo(() => QUERY_KEY(currentUserId, otherUserId), [currentUserId, otherUserId])

  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchMessages(currentUserId, otherUserId),
    enabled: Boolean(currentUserId && otherUserId),
  })

  // Mark messages as read on mount / when conversation changes
  useEffect(() => {
    if (currentUserId && otherUserId) {
      markAsRead(currentUserId, otherUserId).catch(() => {
        // Fail silently
      })
    }
  }, [currentUserId, otherUserId])

  // Realtime subscription
  useEffect(() => {
    if (!currentUserId || !otherUserId) return

    const uid = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`chat_${[currentUserId, otherUserId].sort().join('_')}:${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message
          const isRelevant =
            (newMsg.sender_id === currentUserId &&
              newMsg.receiver_id === otherUserId) ||
            (newMsg.sender_id === otherUserId &&
              newMsg.receiver_id === currentUserId)

          if (!isRelevant) return

          queryClient.setQueryData<Message[]>(queryKey, (prev = []) => {
            // Avoid duplicates (optimistic update may have already added it)
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })

          // Mark as read if we're the receiver
          if (newMsg.receiver_id === currentUserId) {
            markAsRead(currentUserId, otherUserId).catch(() => {})
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUserId, queryClient, queryKey])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      const optimisticMsg: Message = {
        id: `optimistic_${Date.now()}`,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: content.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      }

      // Optimistic update
      queryClient.setQueryData<Message[]>(queryKey, (prev = []) => [
        ...prev,
        optimisticMsg,
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('messages')
        .insert({
          conversation_id: [currentUserId, otherUserId].sort().join('_'),
          sender_id: currentUserId,
          receiver_id: otherUserId,
          content: content.trim(),
        })
        .select()
        .single()

      if (error) {
        // Rollback optimistic update
        queryClient.setQueryData<Message[]>(queryKey, (prev = []) =>
          prev.filter((m) => m.id !== optimisticMsg.id)
        )
        return
      }

      // Replace optimistic message with real one
      queryClient.setQueryData<Message[]>(queryKey, (prev = []) =>
        prev.map((m) =>
          m.id === optimisticMsg.id ? (data as Message) : m
        )
      )
    },
    [currentUserId, otherUserId, queryClient, queryKey]
  )

  return { messages, isLoading, sendMessage }
}

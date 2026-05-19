import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../features/auth/store/authStore'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  product_id: string | null
  read_at: string | null
  created_at: string
}

function buildConversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join('_')
}

export function useMessages(otherUserId: string) {
  const currentUser = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const conversationId = currentUser
    ? buildConversationId(currentUser.user_id, otherUserId)
    : null

  // Carga inicial
  useEffect(() => {
    if (!conversationId || !currentUser) return
    let cancelled = false

    const fetchMessages = async () => {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (cancelled) return
      if (err) { setError(err.message); return }
      setMessages(data as unknown as Message[])
      setLoading(false)
    }

    fetchMessages()

    return () => { cancelled = true }
  }, [conversationId, currentUser])

  // Suscripción Realtime
  useEffect(() => {
    if (!conversationId || !currentUser) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUser])

  // Marcar como leídos al abrir la conversación
  useEffect(() => {
    if (!conversationId || !currentUser) return
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', currentUser.user_id)
      .is('read_at', null)
      .then(() => {})
  }, [conversationId, currentUser])

  const sendMessage = useCallback(
    async (content: string, productId?: string | null): Promise<void> => {
      if (!currentUser || !conversationId) throw new Error('No autenticado')
      const { error: err } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.user_id,
        receiver_id: otherUserId,
        content: content.trim(),
        product_id: productId ?? null,
      })
      if (err) throw err
    },
    [currentUser, conversationId, otherUserId]
  )

  return { messages, loading, error, sendMessage }
}

// Hook para contar mensajes no leídos (para el badge)
export function useUnreadCount() {
  const currentUser = useAuthStore((s) => s.user)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!currentUser) return

    const fetchCount = () => {
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', currentUser.user_id)
        .is('read_at', null)
        .then(({ count: c }) => setCount(c ?? 0))
    }

    fetchCount()

    const channel = supabase
      .channel('unread_messages_count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUser.user_id}`,
      }, fetchCount)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUser])

  return count
}

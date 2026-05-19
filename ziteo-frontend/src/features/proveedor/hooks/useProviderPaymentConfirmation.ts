import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { queryKeys } from '../../../shared/query/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingPaymentOrder {
  id: string
  constructor_id: string
  total: number
  created_at: string
  payment_evidence_url: string
  payment_evidence_uploaded_at: string
  expires_at: string
  buyer_name: string | null
}

// ─── Query key ────────────────────────────────────────────────────────────────

const pendingPaymentsKey = (providerId: string) =>
  ['pending-payments', providerId] as const

// ─── useProviderPaymentConfirmation ──────────────────────────────────────────
// Lists orders that have a comprobante uploaded (payment_evidence_url IS NOT NULL)
// but are still in status='pending' — the provider must confirm or reject them.
// Also exposes confirmOrderPayment and rejectOrderPayment mutations.

export function useProviderPaymentConfirmation(providerId: string) {
  const queryClient = useQueryClient()
  const [channelSuffix] = useState(() => Math.random().toString(36).slice(2))
  const channelKey = useRef(`payment_confirm_${providerId}_${channelSuffix}`)

  // ── Realtime: invalidate when evidence is uploaded or status changes ─────────
  useEffect(() => {
    if (!providerId) return

    const channel = supabase
      .channel(channelKey.current)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `provider_id=eq.${providerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: pendingPaymentsKey(providerId) })
          // Also refresh the full incoming orders list so badge counts stay in sync
          queryClient.invalidateQueries({
            queryKey: queryKeys.incomingOrders(providerId),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [providerId, queryClient])

  // ── Query: orders awaiting payment confirmation ───────────────────────────────
  const query = useQuery<PendingPaymentOrder[]>({
    queryKey: pendingPaymentsKey(providerId),
    enabled: !!providerId,
    refetchInterval: 30_000, // fallback poll every 30 s if Realtime is down
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('orders')
        .select(`
          id,
          constructor_id,
          total,
          created_at,
          payment_evidence_url,
          payment_evidence_uploaded_at,
          expires_at,
          buyer:profiles!orders_constructor_id_fkey(name)
        `)
        .eq('provider_id', providerId)
        .eq('status', 'pending')
        .not('payment_evidence_url', 'is', null)
        .order('payment_evidence_uploaded_at', { ascending: true })

      if (error) {
        if (error.code === '42P01') return []
        throw error
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => ({
        id:                            row.id,
        constructor_id:                row.constructor_id,
        total:                         row.total,
        created_at:                    row.created_at,
        payment_evidence_url:          row.payment_evidence_url!,
        payment_evidence_uploaded_at:  row.payment_evidence_uploaded_at!,
        expires_at:                    row.expires_at,
        buyer_name: Array.isArray(row.buyer)
          ? (row.buyer as { name: string }[])[0]?.name ?? null
          : (row.buyer as { name: string } | null)?.name ?? null,
      }))
    },
  })

  // ── Mutation: confirm payment ────────────────────────────────────────────────
  const confirmMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.rpc('confirm_payment_by_provider', {
        p_order_id: orderId,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingPaymentsKey(providerId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.incomingOrders(providerId) })
    },
  })

  // ── Mutation: reject payment ─────────────────────────────────────────────────
  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { error } = await supabase.rpc('reject_payment_by_provider', {
        p_order_id: orderId,
        p_reason:   reason,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingPaymentsKey(providerId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.incomingOrders(providerId) })
    },
  })

  return {
    pendingPayments:      (query.data ?? []) as PendingPaymentOrder[],
    isLoading:            query.isLoading,
    pendingCount:         (query.data ?? []).length,
    confirmOrderPayment:  (orderId: string) => confirmMutation.mutateAsync(orderId),
    rejectOrderPayment:   (orderId: string, reason: string) =>
      rejectMutation.mutateAsync({ orderId, reason }),
    isConfirming:         confirmMutation.isPending,
    isRejecting:          rejectMutation.isPending,
    confirmError:         confirmMutation.error,
    rejectError:          rejectMutation.error,
  }
}

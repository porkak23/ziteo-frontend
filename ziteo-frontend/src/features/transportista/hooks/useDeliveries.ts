import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import type { Delivery, AcceptDeliveryResult } from '../types/deliveryTypes'

// ─── Query keys ──────────────────────────────────────────────────────────────

const POOL_KEY    = ['deliveries', 'pool']
const MY_JOBS_KEY = (driverId: string) => ['deliveries', 'driver', driverId]

// ─── usePendingDeliveries ────────────────────────────────────────────────────
// Fetches the open pool of deliveries available for transportistas to claim.
// Realtime subscription keeps the list fresh as new orders are confirmed.

export function usePendingDeliveries() {
  const queryClient = useQueryClient()
  const queryClientRef = useRef(queryClient)

  const query = useQuery<Delivery[]>({
    queryKey: POOL_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders (
            total,
            constructor_id,
            provider_id
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw new Error(error.message)
      return (data ?? []) as Delivery[]
    },
  })

  // Realtime: listen for new pending deliveries and deletions/updates
  useEffect(() => {
    const channel = supabase
      .channel(`deliveries:pool-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries' },
        () => {
          // Refetch instead of manual merge to keep data consistent
          queryClientRef.current.invalidateQueries({ queryKey: POOL_KEY })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return query
}

// ─── useMyDeliveries ─────────────────────────────────────────────────────────
// Fetches the deliveries assigned to the current driver.

export function useMyDeliveries() {
  const driver = useAuthStore((s) => s.user)
  const driverId = driver?.user_id ?? ''
  const queryClient = useQueryClient()
  const queryClientRef = useRef(queryClient)

  const query = useQuery<Delivery[]>({
    queryKey: MY_JOBS_KEY(driverId),
    enabled: !!driverId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders (
            total,
            constructor_id,
            provider_id
          )
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return (data ?? []) as Delivery[]
    },
  })

  // Realtime: reflect status changes of own deliveries
  useEffect(() => {
    if (!driverId) return
    const channel = supabase
      .channel(`deliveries:driver:${driverId}-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'deliveries',
          filter: `driver_id=eq.${driverId}`,
        },
        () => {
          queryClientRef.current.invalidateQueries({ queryKey: MY_JOBS_KEY(driverId) })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [driverId])

  return query
}

// ─── useAcceptDelivery ───────────────────────────────────────────────────────
// Calls the race-condition-safe RPC. If another driver claimed the delivery
// first, the RPC returns { success: false, message: '...' } which we surface.

export function useAcceptDelivery() {
  const queryClient = useQueryClient()
  const driver      = useAuthStore((s) => s.user)

  return useMutation<AcceptDeliveryResult, Error, string>({
    mutationFn: async (deliveryId: string) => {
      const { data, error } = await supabase.rpc('accept_delivery', {
        p_delivery_id: deliveryId,
      })

      if (error) throw new Error(error.message)
      return data as AcceptDeliveryResult
    },
    onSuccess: () => {
      // Refresh both the pool and the driver's jobs
      queryClient.invalidateQueries({ queryKey: POOL_KEY })
      if (driver?.user_id) {
        queryClient.invalidateQueries({ queryKey: MY_JOBS_KEY(driver.user_id) })
      }
    },
  })
}

// ─── useUpdateDeliveryStatus ─────────────────────────────────────────────────
// Advances delivery status (accepted → in_transit → delivered).

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient()
  const driver      = useAuthStore((s) => s.user)

  return useMutation<void, Error, { deliveryId: string; newStatus: 'in_transit' | 'delivered' | 'failed' }>({
    mutationFn: async ({ deliveryId, newStatus }) => {
      const { error } = await supabase.rpc('update_delivery_status', {
        p_delivery_id: deliveryId,
        p_new_status:  newStatus,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      if (driver?.user_id) {
        queryClient.invalidateQueries({ queryKey: MY_JOBS_KEY(driver.user_id) })
      }
      queryClient.invalidateQueries({ queryKey: POOL_KEY })
    },
  })
}

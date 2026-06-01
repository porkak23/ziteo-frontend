import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface PendingDelivery {
  id: string
  order_id: string
  cargo_type: 'light' | 'heavy'
  status: string
  pickup_address: string | null
  dropoff_address: string | null
  pickup_lat: number | null
  pickup_lng: number | null
  estimated_fee: number | null
  order: {
    total: number
    provider_name: string | null
  } | null
}

export function useAvailableDeliveries(vehicleType: 'heavy' | 'light') {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('deliveries-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deliveries' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['deliveries', 'available', vehicleType] })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deliveries' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['deliveries', 'available', vehicleType] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, vehicleType])

  return useQuery<PendingDelivery[]>({
    queryKey: ['deliveries', 'available', vehicleType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(
          'id, order_id, cargo_type, status, pickup_address, dropoff_address, pickup_lat, pickup_lng, estimated_fee, order:orders!deliveries_order_id_fkey(total, provider:profiles!orders_provider_id_fkey(name))'
        )
        .eq('status', 'pending')
        .is('driver_id', null)

      if (error) {
        if (error.code === '42P01') return []
        throw error
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (data ?? []).map((row: any) => ({
        id: row.id,
        order_id: row.order_id,
        cargo_type: row.cargo_type,
        status: row.status,
        pickup_address: row.pickup_address,
        dropoff_address: row.dropoff_address,
        pickup_lat: row.pickup_lat,
        pickup_lng: row.pickup_lng,
        estimated_fee: row.estimated_fee,
        order: row.order
          ? {
              total: row.order.total,
              provider_name: row.order.provider?.name ?? null,
            }
          : null,
      })) as PendingDelivery[]

      if (vehicleType === 'light') {
        return mapped.filter((d) => d.cargo_type === 'light')
      }
      return mapped
    },
  })
}

export function useAcceptDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ deliveryId }: { deliveryId: string; orderId?: string }) => {
      const { data, error } = await supabase.rpc('accept_delivery', { p_delivery_id: deliveryId })
      if (error) throw error
      const result = data as { success: boolean; message?: string; delivery_id?: string } | null
      if (!result || result.success !== true) {
        throw new Error(result?.message ?? 'No se pudo aceptar la entrega')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', 'available'] })
      queryClient.invalidateQueries({ queryKey: ['deliveries', 'my'] })
    },
  })
}

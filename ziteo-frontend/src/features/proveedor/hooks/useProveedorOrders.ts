import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { queryKeys } from '../../../shared/query/keys'
import { useEffect } from 'react'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price_unit: number
  product?: {
    id: string
    name: string
  } | null
}

export interface ProveedorOrder {
  id: string
  provider_id: string
  constructor_id: string
  status: string
  total: number
  created_at: string
  payment_confirmed_at?: string | null
  items: OrderItem[]
  buyer_name?: string
}

export function useIncomingOrders(providerId: string, onNewOrder?: () => void) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!providerId) return

    const channel = supabase
      .channel(`incoming_orders_${providerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `provider_id=eq.${providerId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.incomingOrders(providerId) })
          if (onNewOrder) {
            onNewOrder()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [providerId, queryClient, onNewOrder])

  return useQuery({
    queryKey: queryKeys.incomingOrders(providerId),
    enabled: !!providerId,
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          provider_id,
          constructor_id,
          status,
          total,
          created_at,
          payment_confirmed_at,
          buyer:profiles!orders_constructor_id_fkey(name)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

      if (ordersError) {
        if (ordersError.code === '42P01') return []
        throw ordersError
      }

      if (!ordersData || ordersData.length === 0) return []

      const orderIds = ordersData.map(o => o.id)

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          price_unit,
          product:products!order_items_product_id_fkey(id,name)
        `)
        .in('order_id', orderIds)

      if (itemsError) {
         if (itemsError.code === '42P01') return ordersData.map(o => ({ ...o, items: [] })) as ProveedorOrder[]
         throw itemsError
      }

      const itemsByOrder = (itemsData || []).reduce((acc: Record<string, OrderItem[]>, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = []
        acc[item.order_id].push({
           ...item,
           product: Array.isArray(item.product) ? item.product[0] : item.product
        })
        return acc
      }, {})

      return ordersData.map((order) => ({
        ...order,
        buyer_name: Array.isArray(order.buyer) ? (order.buyer as { name: string }[])[0]?.name : (order.buyer as { name: string } | null)?.name,
        items: itemsByOrder[order.id] || []
      })) as ProveedorOrder[]
    }
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string, providerId: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
      
      if (error) throw error
    },
    onSuccess: (_, { providerId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incomingOrders(providerId) })
    }
  })
}

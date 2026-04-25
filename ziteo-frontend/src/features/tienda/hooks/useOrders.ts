import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { useCart } from './useCart'
import type { CartItem } from './useCart'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderWithItems {
  id: string
  constructor_id: string
  provider_id: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  notes: string | null
  created_at: string
  items: {
    id: string
    product_id: string
    quantity: number
    price_unit: number
    product: { name: string } | null
  }[]
}

// ─── usePlaceOrder ────────────────────────────────────────────────────────────
// Groups cart items by provider_id and calls the atomic `place_order` RPC
// for each provider. The RPC handles orders + order_items in a single
// PostgreSQL transaction — no phantom orders if the connection drops.

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  const cartItems = useCart((s) => s.items)
  const clearCart = useCart((s) => s.clear)
  const currentUser = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async () => {
      if (cartItems.length === 0) throw new Error('El carrito está vacío')
      if (!currentUser?.user_id) throw new Error('Usuario no autenticado')

      // Group by providerId
      const byProvider = cartItems.reduce<Record<string, CartItem[]>>((acc, item) => {
        if (!acc[item.sellerId]) acc[item.sellerId] = []
        acc[item.sellerId].push(item)
        return acc
      }, {})

      const orderIds: string[] = []

      for (const [providerId, items] of Object.entries(byProvider)) {
        const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

        // Build items payload for the RPC
        const rpcItems = items.map((i) => ({
          product_id: i.productId,
          quantity:   i.quantity,
          price_unit: i.price,
        }))

        // Single atomic call — stock check + order + order_items in one transaction
        const { data: orderId, error } = await supabase.rpc('place_order', {
          p_constructor_id: currentUser.user_id,
          p_provider_id:    providerId,
          p_total:          total,
          p_items:          rpcItems,
        })

        if (error) {
          // Surface the PostgreSQL exception message directly to the user
          throw new Error(error.message)
        }

        orderIds.push(orderId as string)
      }

      return { orderIds, providerIds: Object.keys(byProvider) }
    },
    onSuccess: async ({ providerIds }) => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['orders'] })

      // Use the send_notification RPC so notifications go through the secure
      // SECURITY DEFINER path instead of a direct insert (which WITH CHECK (false) blocks).
      for (const pid of providerIds) {
        await supabase.rpc('send_notification', {
          p_user_id: pid,
          p_type:    'order',
          p_title:   'Nuevo pedido',
          p_message: 'Has recibido un nuevo pedido de materiales.',
        })
      }
    },
  })
}

// ─── useMyOrders ──────────────────────────────────────────────────────────────

export function useMyOrders(constructorId?: string) {
  const storeUser = useAuthStore((s) => s.user)
  const uid = constructorId ?? storeUser?.user_id ?? null

  return useQuery<OrderWithItems[]>({
    queryKey: ['orders', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, product:products(name))')
        .eq('constructor_id', uid!)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      return (data ?? []).map((o: any) => ({
        ...o,
        items: (o.items ?? []).map((item: any) => ({
          id:         item.id,
          product_id: item.product_id,
          quantity:   item.quantity,
          price_unit: item.unit_price ?? item.price_unit,
          product:    item.product ?? null,
        })),
      })) as OrderWithItems[]
    },
  })
}

// ─── Legacy alias ─────────────────────────────────────────────────────────────

export function useCreateOrder() {
  return usePlaceOrder()
}

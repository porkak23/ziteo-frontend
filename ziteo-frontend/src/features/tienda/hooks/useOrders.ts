import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { useCart } from './useCart'
import type { CartItem, CargoType } from './useCart'
import { track } from '../../../lib/analytics'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderWithItems {
  id: string
  constructor_id: string
  provider_id: string
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'expired'
  notes: string | null
  created_at: string
  expires_at: string | null
  estimated_delivery_at?: string | null
  payment_evidence_url: string | null
  payment_evidence_uploaded_at: string | null
  payment_confirmed_at: string | null
  payment_rejection_reason: string | null
  items: {
    id: string
    product_id: string
    quantity: number
    price_unit: number
    product: { name: string } | null
  }[]
  deliveries: { id: string; status: string; driver_id: string | null }[]
}

// ─── usePlaceOrder ────────────────────────────────────────────────────────────
// Groups cart items by provider_id and calls the atomic `place_order` RPC
// for each provider. The RPC handles orders + order_items in a single
// PostgreSQL transaction — no phantom orders if the connection drops.

export function usePlaceOrder() {
  const queryClient  = useQueryClient()
  const cartItems    = useCart((s) => s.items)
  const clearCart    = useCart((s) => s.clear)
  const cargoType    = useCart((s) => s.cargoType)
  const totalWeight  = useCart((s) => s.totalWeight)
  const currentUser  = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (vars: { deliveryAddress?: string } = {}) => {
      if (cartItems.length === 0) throw new Error('El carrito está vacío')
      if (!currentUser?.user_id) throw new Error('Usuario no autenticado')

      // Resolve effective cargo type: user override → auto-detection → null
      const autoDetected: CargoType | null = (() => {
        const w = totalWeight()
        if (w === null) return null
        return w < 5 ? 'light' : 'heavy'
      })()
      const effectiveCargo: CargoType | null = cargoType ?? autoDetected

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

        const oid = orderId as string
        orderIds.push(oid)

        // Patch cargo_type on the order if cargo was determined
        if (effectiveCargo) {
          const { error: cargoErr } = await supabase
            .from('orders')
            .update({ cargo_type: effectiveCargo })
            .eq('id', oid)
          if (cargoErr) console.warn('[placeOrder] cargo_type patch failed:', cargoErr.message)
        }

        // Patch delivery_address so the BD trigger can copy it to deliveries.dropoff_address
        if (vars.deliveryAddress) {
          const { error: addrErr } = await supabase
            .from('orders')
            .update({ delivery_address: vars.deliveryAddress })
            .eq('id', oid)
          if (addrErr) console.warn('[placeOrder] delivery_address patch failed:', addrErr.message)
        }
      }

      return { orderIds, providerIds: Object.keys(byProvider) }
    },
    onSuccess: async ({ orderIds, providerIds }) => {
      orderIds.forEach((id) => track.orderPlaced(id))
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
        // Also deliver as Web Push if the provider has an active subscription
        supabase.functions.invoke('notifications/send-push', {
          body: {
            user_id: pid,
            title:   'Nuevo pedido',
            body:    'Has recibido un nuevo pedido de materiales.',
            url:     '/',
          },
        }).catch((err: unknown) => console.warn('[send-push] order push failed:', err))
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
        .select('*, items:order_items(*, product:products(name)), deliveries(id, status, driver_id)')
        .eq('constructor_id', uid!)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((o: any) => ({
        ...o,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (o.items ?? []).map((item: any) => ({
          id:         item.id,
          product_id: item.product_id,
          quantity:   item.quantity,
          price_unit: item.unit_price ?? item.price_unit,
          product:    item.product ?? null,
        })),
        deliveries: o.deliveries ?? [],
      })) as OrderWithItems[]
    },
  })
}

// ─── useCancelOrder ───────────────────────────────────────────────────────────
// Cancels an order that is in 'pending' status.
// The DB trigger / RPC `restore_stock_on_cancel` (see migrations) releases the
// reserved stock automatically. The client just sets status = 'cancelled'.

export function useCancelOrder() {
  const queryClient = useQueryClient()
  const storeUser   = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        // Guard: only the constructor who owns the order can cancel it
        .eq('constructor_id', storeUser?.user_id ?? '')
        // Guard: only pending orders can be cancelled from this path
        .eq('status', 'pending')
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// ─── Legacy alias ─────────────────────────────────────────────────────────────

export function useCreateOrder() {
  return usePlaceOrder()
}

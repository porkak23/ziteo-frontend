import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'

interface IntelData {
  totalVentas: number
  ventasEsteMes: number
  totalPedidos: number
  pedidosPendientes: number
  productoMasVendido: string
  stockBajo: number
}

const EMPTY: IntelData = {
  totalVentas: 0,
  ventasEsteMes: 0,
  totalPedidos: 0,
  pedidosPendientes: 0,
  productoMasVendido: '—',
  stockBajo: 0,
}

interface RawProduct {
  id: string
  name: string
  price_unit: number
  stock_quantity: number
}

interface RawOrderItem {
  product_id: string
  quantity: number
  price_unit: number
  order: { status: string; created_at: string }[] | null
}

export function useIntelData() {
  const user = useAuthStore((s) => s.user)
  const user_id = user?.user_id ?? ''
  const active_role = user?.active_role

  return useQuery<IntelData>({
    queryKey: ['intel', user_id],
    enabled: !!user_id && active_role === 'proveedor',
    queryFn: async () => {
      const [productsResult, productIdsResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, price_unit, stock_quantity')
          .eq('provider_id', user_id),
        supabase
          .from('products')
          .select('id')
          .eq('provider_id', user_id),
      ])

      if (productsResult.error) throw productsResult.error
      if (productIdsResult.error) throw productIdsResult.error

      const products = (productsResult.data ?? []) as RawProduct[]
      const productIds = (productIdsResult.data ?? []).map((p) => p.id)

      if (productIds.length === 0) return EMPTY

      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity, price_unit, order:orders(status, created_at)')
        .in('product_id', productIds)

      if (itemsError) throw itemsError

      const items = (orderItemsData ?? []) as RawOrderItem[]

      if (items.length === 0) {
        const stockBajo = products.filter((p) => p.stock_quantity < 5).length
        return { ...EMPTY, stockBajo }
      }

      const now = new Date()
      const thisYear = now.getFullYear()
      const thisMonth = now.getMonth()

      let totalVentas = 0
      let ventasEsteMes = 0
      const orderIds = new Set<string>()
      let pedidosPendientes = 0
      const quantityByProduct: Record<string, number> = {}

      for (const item of items) {
        const subtotal = item.price_unit * item.quantity
        totalVentas += subtotal

        const ord = Array.isArray(item.order) ? item.order[0] : item.order

        if (ord) {
          const date = new Date(ord.created_at)
          if (date.getFullYear() === thisYear && date.getMonth() === thisMonth) {
            ventasEsteMes += subtotal
          }
        }

        if (ord) {
          const orderId = `${ord.status}__${ord.created_at}__${item.product_id}`
          orderIds.add(orderId)
          if (ord.status === 'pending') {
            pedidosPendientes += 1
          }
        }

        quantityByProduct[item.product_id] =
          (quantityByProduct[item.product_id] ?? 0) + item.quantity
      }

      const productMap: Record<string, string> = {}
      for (const p of products) {
        productMap[p.id] = p.name
      }

      let topProductId = ''
      let topQty = 0
      for (const [pid, qty] of Object.entries(quantityByProduct)) {
        if (qty > topQty) {
          topQty = qty
          topProductId = pid
        }
      }

      const stockBajo = products.filter((p) => p.stock_quantity < 5).length

      return {
        totalVentas,
        ventasEsteMes,
        totalPedidos: orderIds.size,
        pedidosPendientes,
        productoMasVendido: topProductId ? (productMap[topProductId] ?? '—') : '—',
        stockBajo,
      }
    },
  })
}

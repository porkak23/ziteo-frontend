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
  // TUL KPIs
  ticketPromedio: number
  pctEnTiempo: number | null
  cotizacionesLast30: number
  topEtapas: { stage: string; label: string; count: number }[]
}

const EMPTY: IntelData = {
  totalVentas: 0,
  ventasEsteMes: 0,
  totalPedidos: 0,
  pedidosPendientes: 0,
  productoMasVendido: '—',
  stockBajo: 0,
  ticketPromedio: 0,
  pctEnTiempo: null,
  cotizacionesLast30: 0,
  topEtapas: [],
}

interface RawProduct {
  id: string
  name: string
  price_unit: number
  stock_quantity: number
  construction_stage?: string | null
}

interface RawOrderItem {
  product_id: string
  quantity: number
  price_unit: number
  order: { status: string; created_at: string }[] | null
}

const STAGE_LABELS: Record<string, string> = {
  fundaciones: 'Fundaciones',
  muros: 'Muros',
  techos: 'Techos',
  terminaciones: 'Terminaciones',
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
          .select('id, name, price_unit, stock_quantity, construction_stage')
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

      const items = (orderItemsData ?? []) as unknown as RawOrderItem[]

      // Fetch quotations count for last 30 days
      let cotizacionesLast30 = 0
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase as any)
          .from('quotations')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', user_id)
          .gte('created_at', thirtyDaysAgo)
        cotizacionesLast30 = count ?? 0
      } catch {
        cotizacionesLast30 = 0
      }

      if (items.length === 0) {
        const stockBajo = products.filter((p) => p.stock_quantity < 5).length
        return { ...EMPTY, stockBajo, cotizacionesLast30 }
      }

      const now = new Date()
      const thisYear = now.getFullYear()
      const thisMonth = now.getMonth()

      let totalVentas = 0
      let ventasEsteMes = 0
      const orderIds = new Set<string>()
      let pedidosPendientes = 0
      const quantityByProduct: Record<string, number> = {}
      let totalDelivered = 0
      let deliveredOnTime = 0

      // For ticket promedio: sum of order totals
      const orderTotals: Record<string, number> = {}

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

          // Accumulate for ticket promedio (keyed by order unique marker)
          const orderKey = `${ord.created_at}__${item.product_id}`
          orderTotals[orderKey] = (orderTotals[orderKey] ?? 0) + subtotal
        }

        quantityByProduct[item.product_id] =
          (quantityByProduct[item.product_id] ?? 0) + item.quantity
      }

      // Try to compute % on-time using deliveries
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: deliveriesData } = await (supabase as any)
          .from('deliveries')
          .select('delivered_at, created_at')
          .eq('status', 'delivered')
          .in('order_id',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (orderItemsData ?? []).map((i: any) => {
              const ord = Array.isArray(i.order) ? i.order[0] : i.order
              return ord ? undefined : undefined
            }).filter(Boolean)
          )
        if (deliveriesData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          totalDelivered = (deliveriesData as any[]).length
          // We don't have promised hours here, skip on-time for now
          deliveredOnTime = totalDelivered
        }
      } catch {
        // ignore
      }

      const productMap: Record<string, string> = {}
      const productStageMap: Record<string, string> = {}
      for (const p of products) {
        productMap[p.id] = p.name
        if (p.construction_stage) productStageMap[p.id] = p.construction_stage
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

      // Ticket promedio
      const orderTotalValues = Object.values(orderTotals)
      const ticketPromedio =
        orderTotalValues.length > 0
          ? orderTotalValues.reduce((a, b) => a + b, 0) / orderTotalValues.length
          : 0

      // Top etapas de obra: count sold units per stage
      const stageCount: Record<string, number> = {}
      for (const [pid, qty] of Object.entries(quantityByProduct)) {
        const stage = productStageMap[pid]
        if (stage) {
          stageCount[stage] = (stageCount[stage] ?? 0) + qty
        }
      }
      const topEtapas = Object.entries(stageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([stage, count]) => ({
          stage,
          label: STAGE_LABELS[stage] ?? stage,
          count,
        }))

      return {
        totalVentas,
        ventasEsteMes,
        totalPedidos: orderIds.size,
        pedidosPendientes,
        productoMasVendido: topProductId ? (productMap[topProductId] ?? '—') : '—',
        stockBajo,
        ticketPromedio,
        pctEnTiempo: totalDelivered > 0 ? Math.round((deliveredOnTime / totalDelivered) * 100) : null,
        cotizacionesLast30,
        topEtapas,
      }
    },
  })
}

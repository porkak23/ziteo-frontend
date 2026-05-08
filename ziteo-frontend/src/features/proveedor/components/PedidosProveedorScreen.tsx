import { useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { useIncomingOrders, useUpdateOrderStatus } from '../hooks/useProveedorOrders'
import { OrderStatusChip } from './OrderStatusChip'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

// ─── Cargo type filter ───────────────────────────────────────────────────────

type CargoFilter = 'all' | 'light' | 'heavy'

const CARGO_TABS: { id: CargoFilter; label: string; icon: string }[] = [
  { id: 'all',   label: 'Todos',    icon: 'inbox' },
  { id: 'light', label: 'Ligeros',  icon: 'two_wheeler' },
  { id: 'heavy', label: 'Pesados',  icon: 'local_shipping' },
]

// ─── Hook: deliveries for order ids ─────────────────────────────────────────

function useDeliveriesByOrders(orderIds: string[]) {
  return useQuery<Record<string, string>>({
    queryKey: ['deliveries-cargo', orderIds.sort().join(',')],
    enabled: orderIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('deliveries')
        .select('order_id, cargo_type')
        .in('order_id', orderIds)
      if (error) {
        if (error.code === '42P01') return {}
        throw error
      }
      const map: Record<string, string> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of (data ?? []) as any[]) {
        if (row.order_id) map[row.order_id] = row.cargo_type ?? ''
      }
      return map
    },
  })
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PedidosProveedorScreen() {
  const user = useAuthStore((s) => s.user)
  const providerId = user?.user_id ?? ''

  const { toasts, showToast, removeToast } = useToast()
  const [cargoFilter, setCargoFilter] = useState<CargoFilter>('all')

  const { data: orders = [], isLoading } = useIncomingOrders(providerId, () => {
    showToast('¡Nuevo pedido recibido!', 'info')
  })

  const { mutate: updateStatus } = useUpdateOrderStatus()

  // Fetch cargo type for all loaded orders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderIds = (orders as any[]).map((o: any) => o.id)
  const { data: cargoMap = {} } = useDeliveriesByOrders(orderIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingCount = (orders as any[]).filter((o: any) => o.status === 'pending').length

  // Filtered orders based on cargo tab
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredOrders = (orders as any[]).filter((order: any) => {
    if (cargoFilter === 'all') return true
    const cargo = cargoMap[order.id]
    if (cargoFilter === 'light') return cargo === 'light' || cargo === ''  || cargo === undefined
    if (cargoFilter === 'heavy') return cargo === 'heavy'
    return true
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-40" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-3 pb-24">
      {toasts.length > 0 && <Toast toasts={toasts} onRemove={removeToast} />}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4">
        <h2 className="font-headline font-semibold text-lg text-on-surface">
          Pedidos recibidos
        </h2>
        {pendingCount > 0 && (
          <span className="bg-primary text-on-primary text-xs font-label px-2 py-1 rounded-full">
            {pendingCount} pendientes
          </span>
        )}
      </div>

      {/* ── Cargo filter tabs ──────────────────────────────────────────────── */}
      <div className="flex gap-2 px-4">
        {CARGO_TABS.map((tab) => {
          const isActive = cargoFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setCargoFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-label text-xs font-semibold transition-[background-color,border-color,color] ${
                isActive
                  ? 'bg-primary border-primary text-on-primary'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] leading-none"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Order list ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-4">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">inbox</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">
              {orders.length === 0 ? 'Sin pedidos por ahora' : 'Sin pedidos en esta categoría'}
            </p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">
              {orders.length === 0
                ? 'Cuando un cliente compre tus productos, los pedidos aparecerán aquí'
                : 'Prueba cambiando el filtro de tipo de carga'}
            </p>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filteredOrders.map((order: any) => {
            const dateLabel = order.created_at
              ? new Date(order.created_at).toLocaleDateString('es-BO')
              : ''
            const cargo = cargoMap[order.id]
            const isHeavy = cargo === 'heavy'
            const isLight = cargo === 'light'

            return (
              <div key={order.id} className="bg-surface rounded-2xl p-4 flex flex-col gap-3 border border-outline-variant">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm text-on-surface-variant">{dateLabel}</span>
                    {/* Cargo type badge */}
                    {(isHeavy || isLight) && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-label text-[10px] font-semibold ${
                        isHeavy
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                      }`}>
                        <span className="material-symbols-outlined text-[11px] leading-none"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isHeavy ? 'local_shipping' : 'two_wheeler'}
                        </span>
                        {isHeavy ? 'Pesado' : 'Ligero'}
                      </span>
                    )}
                  </div>
                  <OrderStatusChip status={order.status} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-base leading-none">
                    person
                  </span>
                  <span className="font-body text-sm font-semibold text-on-surface">
                    {order.buyer_name ?? 'Comprador'}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="font-body text-sm text-on-surface">
                        {item.quantity}x {item.product?.name ?? 'Producto'}
                      </span>
                      <span className="font-body text-sm text-on-surface-variant">
                        Bs. {(item.price_unit * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-outline-variant pt-3 mt-1">
                  <span className="font-label font-semibold text-on-surface text-sm">Total</span>
                  <span className="font-headline font-extrabold text-primary text-base">
                    Bs. {order.total.toFixed(2)}
                  </span>
                </div>

                {order.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(
                      { orderId: order.id, status: 'processing', providerId },
                      { onError: () => showToast('No se pudo actualizar el pedido', 'error') }
                    )}
                    className="mt-2 w-full bg-primary text-on-primary rounded-2xl py-3 text-sm font-label font-semibold transition-opacity active:opacity-70"
                  >
                    Procesar
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    onClick={() => updateStatus(
                      { orderId: order.id, status: 'shipped', providerId },
                      { onError: () => showToast('No se pudo actualizar el pedido', 'error') }
                    )}
                    className="mt-2 w-full bg-tertiary-container text-on-tertiary-container rounded-2xl py-3 text-sm font-label font-semibold transition-opacity active:opacity-70"
                  >
                    Marcar enviado
                  </button>
                )}
                {order.status === 'shipped' && (
                  <button
                    onClick={() => updateStatus(
                      { orderId: order.id, status: 'delivered', providerId },
                      { onError: () => showToast('No se pudo actualizar el pedido', 'error') }
                    )}
                    className="mt-2 w-full bg-status-success-bg text-status-success-text rounded-2xl py-3 text-sm font-label font-semibold transition-opacity active:opacity-70"
                  >
                    Confirmar entrega
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

import { useAuthStore } from '../../auth/store/authStore'
import { useIncomingOrders, useUpdateOrderStatus } from '../hooks/useProveedorOrders'
import type { ProveedorOrder, OrderItem } from '../hooks/useProveedorOrders'
import { OrderStatusChip } from './OrderStatusChip'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { usePaymentQr } from '../hooks/usePaymentQr'
import { useQueryClient } from '@tanstack/react-query'

export function PedidosProveedorScreen() {
  const user = useAuthStore((s) => s.user)
  const providerId = user?.user_id ?? ''
  
  const { toasts, showToast, removeToast } = useToast()

  const { data: orders = [], isLoading } = useIncomingOrders(providerId, () => {
    showToast('¡Nuevo pedido recibido!', 'info')
  })
  
  const { mutate: updateStatus } = useUpdateOrderStatus()
  const { confirmPayment } = usePaymentQr()
  const queryClient = useQueryClient()

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await confirmPayment(orderId)
      showToast('Pago confirmado', 'success')
      queryClient.invalidateQueries({ queryKey: ['incoming-orders', providerId] })
    } catch {
      showToast('Error al confirmar pago', 'error')
    }
  }

  const pendingCount = orders.filter((o: ProveedorOrder) => o.status === 'pending').length

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

      <div className="flex flex-col gap-3 px-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">inbox</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">Sin pedidos por ahora</p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">Cuando un cliente compre tus productos, los pedidos aparecerán aquí</p>
          </div>
        ) : (
          orders.map((order: ProveedorOrder) => {
            const dateLabel = order.created_at
              ? new Date(order.created_at).toLocaleDateString('es-BO')
              : ''

            return (
              <div key={order.id} className="bg-surface rounded-2xl p-4 flex flex-col gap-3 border border-outline-variant">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-on-surface-variant">{dateLabel}</span>
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
                  {order.items.map((item: OrderItem) => (
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

                {order.status === 'pending' && !order.payment_confirmed_at && (
                  <button
                    onClick={() => handleConfirmPayment(order.id)}
                    className="mt-2 w-full bg-secondary-container text-on-secondary-container rounded-2xl py-3 text-sm font-label font-semibold transition-opacity active:opacity-70 border border-outline-variant"
                  >
                    Confirmar pago recibido
                  </button>
                )}
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

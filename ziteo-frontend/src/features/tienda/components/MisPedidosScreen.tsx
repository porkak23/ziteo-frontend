import { useMyOrders } from '../hooks/useOrders'

const STATUS_CHIP: Record<string, string> = {
  pending:    'bg-surface-container text-on-surface-variant',
  processing: 'bg-secondary-container text-on-secondary-container',
  confirmed:  'bg-secondary-container text-on-secondary-container',
  shipped:    'bg-tertiary-container text-on-tertiary-container',
  delivered:  'bg-primary-container text-on-primary-container',
  cancelled:  'bg-error-container text-on-error-container',
}

const STATUS_LABEL: Record<string, string> = {
  pending:    'Pendiente',
  processing: 'En proceso',
  confirmed:  'Confirmado',
  shipped:    'En camino',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
}

export function MisPedidosScreen() {
  const { data: orders = [], isLoading } = useMyOrders()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-32" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 px-8">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">receipt_long</span>
        <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">Sin pedidos aún</p>
        <p className="font-body text-sm text-on-surface-variant/50 text-center">Tus compras en la tienda aparecerán aquí con su estado de entrega</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {orders.map((order) => {
        const chipClass = STATUS_CHIP[order.status] ?? STATUS_CHIP['pending']
        const dateLabel = order.created_at
          ? new Date(order.created_at).toLocaleDateString('es-BO')
          : ''

        return (
          <div key={order.id} className="bg-surface rounded-2xl p-4 flex flex-col gap-2 border border-outline-variant">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-on-surface-variant">{dateLabel}</span>
              <span className={`text-xs font-label rounded-full px-3 py-0.5 ${chipClass}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="font-body text-sm text-on-surface">
                    {item.quantity}x {item.product?.name ?? 'Producto'}
                  </span>
                  <span className="font-body text-sm text-on-surface">
                    Bs. {(item.price_unit * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant pt-2 mt-1">
              <span className="font-label font-semibold text-on-surface text-sm">Total</span>
              <span className="font-headline font-extrabold text-primary text-base">
                Bs. {order.total.toFixed(2)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

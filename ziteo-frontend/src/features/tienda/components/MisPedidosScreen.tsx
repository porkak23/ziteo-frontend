import { useMyOrders } from '../hooks/useOrders'
import { useState } from 'react'
import { usePaymentQr } from '../../proveedor/hooks/usePaymentQr'

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
  const { getSignedQrUrl } = usePaymentQr()
  
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedQrUrl, setSelectedQrUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  const handleVerQr = async (providerId: string) => {
    setQrModalOpen(true)
    setQrLoading(true)
    setSelectedQrUrl(null)
    try {
      const url = await getSignedQrUrl(providerId)
      setSelectedQrUrl(url)
    } finally {
      setQrLoading(false)
    }
  }

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
            
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <button
                onClick={() => handleVerQr(order.provider_id)}
                className="mt-2 w-full bg-secondary-container text-on-secondary-container rounded-2xl py-3 text-sm font-label font-semibold transition-opacity active:opacity-70"
              >
                Ver QR de pago
              </button>
            )}
          </div>
        )
      })}
      
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-scrim/30 flex items-end justify-center">
          <div className="bg-surface w-full max-w-md rounded-t-3xl p-6 flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-semibold text-lg text-on-surface">QR de Pago</h3>
              <button
                onClick={() => setQrModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-4 py-4">
              {qrLoading ? (
                <div className="w-48 h-48 bg-surface-container animate-pulse rounded-2xl" />
              ) : selectedQrUrl ? (
                <>
                  <img src={selectedQrUrl} alt="QR de pago" className="w-48 h-48 object-contain rounded-2xl" />
                  <p className="font-body text-sm text-center text-on-surface-variant">
                    Realiza el pago escaneando este QR. Avisa al proveedor cuando hayas pagado.
                  </p>
                  <a
                    href={selectedQrUrl}
                    download="qr-pago.png"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 bg-primary text-on-primary font-label font-semibold px-6 py-3 rounded-2xl"
                  >
                    Descargar QR
                  </a>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">qr_code_scanner</span>
                  <p className="font-body text-sm text-center text-on-surface-variant">
                    El proveedor aún no ha configurado su QR de cobro.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

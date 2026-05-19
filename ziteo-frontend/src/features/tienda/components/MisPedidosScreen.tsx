import { useMyOrders, useCancelOrder } from '../hooks/useOrders'
import type { OrderWithItems } from '../hooks/useOrders'
import { useState } from 'react'
import { QrPagoModal } from './QrPagoModal'
import { getOrderStatusLabel, getOrderStatusColor } from '../utils/orderStatus'
import { useCreateDispute } from '../hooks/useDispute'

const STATUS_CHIP: Record<string, string> = {
  pending:    'bg-surface-container text-on-surface-variant',
  confirmed:  'bg-secondary-container text-on-secondary-container',
  processing: 'bg-secondary-container text-on-secondary-container',
  shipped:    'bg-tertiary-container text-on-tertiary-container',
  delivered:  'bg-primary-container text-on-primary-container',
  cancelled:  'bg-error-container text-on-error-container',
  expired:    'bg-surface-container text-on-surface-variant',
}

function getDeliveryBadge(order: OrderWithItems): { label: string; className: string } | null {
  if (order.status !== 'processing') return null
  const deliveries = order.deliveries ?? []
  if (deliveries.length === 0) {
    return { label: 'Listo para retiro en tienda', className: 'bg-tertiary-container text-on-tertiary-container' }
  }
  const hasDriver = deliveries.some(d => d.driver_id !== null)
  if (hasDriver) {
    return { label: 'Transportista asignado — en camino', className: 'bg-primary-container text-on-primary-container' }
  }
  return { label: 'Buscando transportista...', className: 'bg-surface-container text-on-surface-variant' }
}

function EstimatedDelivery({ order }: { order: OrderWithItems }) {
  if (order.status !== 'shipped') return null
  const dateStr = order.estimated_delivery_at ?? null
  const label = dateStr
    ? `Entrega estimada: ${new Date(dateStr).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}`
    : 'Sin fecha estimada de entrega'
  return (
    <div className="text-xs font-label text-on-surface-variant mt-1">{label}</div>
  )
}

interface CancelConfirmProps {
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}

function CancelConfirmDialog({ onConfirm, onCancel, isPending }: CancelConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 bg-scrim/40 flex items-center justify-center px-6">
      <div className="bg-surface rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h3 className="font-headline font-semibold text-base text-on-surface">Cancelar pedido</h3>
        <p className="font-body text-sm text-on-surface-variant">
          Esta accion no se puede deshacer. El pedido quedara cancelado y el stock sera liberado.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 bg-surface-container text-on-surface-variant rounded-2xl py-3 text-sm font-label font-semibold transition-opacity disabled:opacity-60"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-error text-on-error rounded-2xl py-3 text-sm font-label font-semibold transition-opacity disabled:opacity-60"
          >
            {isPending ? 'Cancelando...' : 'Si, cancelar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DisputeModal ─────────────────────────────────────────────────────────────

const DISPUTE_REASONS = [
  'Producto no recibido',
  'Producto dañado o defectuoso',
  'Producto incorrecto',
  'Cantidad incorrecta',
  'Pago realizado pero no confirmado',
  'Otro motivo',
] as const

interface DisputeModalProps {
  orderId: string
  onClose: () => void
}

function DisputeModal({ orderId, onClose }: DisputeModalProps) {
  const { mutate: createDispute, isPending, isSuccess, error } = useCreateDispute()
  const [reason, setReason] = useState<string>(DISPUTE_REASONS[0])
  const [details, setDetails] = useState('')

  const detailsLength = details.trim().length
  const canSubmit = detailsLength >= 20 && !isPending

  const handleSubmit = () => {
    if (!canSubmit) return
    createDispute({ orderId, reason, details })
  }

  return (
    <div className="fixed inset-0 z-50 bg-scrim/40 flex items-end justify-center">
      <div className="bg-surface rounded-t-3xl w-full max-w-md p-6 flex flex-col gap-5 pb-10">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-semibold text-base text-on-surface">
            Reportar un problema
          </h3>
          <button
            onClick={onClose}
            disabled={isPending}
            className="font-label text-sm text-on-surface-variant px-2 py-1 rounded-lg active:opacity-60"
          >
            Cerrar
          </button>
        </div>

        {isSuccess ? (
          <div className="flex flex-col gap-4">
            <div className="bg-primary-container text-on-primary-container rounded-2xl px-4 py-4 font-body text-sm text-center">
              Tu reporte fue enviado correctamente. El equipo de Ziteo revisara la situacion y te contactara.
            </div>
            <button
              onClick={onClose}
              className="w-full bg-surface-container text-on-surface rounded-2xl py-3 font-label font-semibold text-sm"
            >
              Entendido
            </button>
          </div>
        ) : (
          <>
            {/* Motivo */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-xs text-on-surface-variant uppercase tracking-wide">
                Motivo del problema
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
                className="bg-surface-container text-on-surface rounded-2xl px-4 py-3 font-body text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {DISPUTE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Descripcion */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-xs text-on-surface-variant uppercase tracking-wide">
                Descripcion del problema
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                disabled={isPending}
                placeholder="Describe con detalle que sucedio (minimo 20 caracteres)..."
                rows={4}
                className="bg-surface-container text-on-surface rounded-2xl px-4 py-3 font-body text-sm border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 placeholder:text-on-surface-variant/50"
              />
              <span className={`font-body text-xs text-right ${detailsLength < 20 ? 'text-error' : 'text-on-surface-variant'}`}>
                {detailsLength} / minimo 20 caracteres
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-3 font-body text-sm">
                {error.message}
              </div>
            )}

            {/* Boton */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-primary text-on-primary rounded-2xl py-3 font-label font-semibold text-sm transition-opacity active:opacity-70 disabled:opacity-40"
            >
              {isPending ? 'Enviando reporte...' : 'Enviar reporte'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Derive the payment evidence state for a pending order
function evidenceState(order: OrderWithItems): 'idle' | 'waiting' {
  if (order.payment_evidence_url) return 'waiting'
  return 'idle'
}

export function MisPedidosScreen() {
  const { data: orders = [], isLoading, refetch } = useMyOrders()
  const { mutate: cancelOrder, isPending: cancelling } = useCancelOrder()

  const [qrOrder, setQrOrder] = useState<{ orderId: string; providerId: string } | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null)

  const handleCancelConfirm = (orderId: string) => {
    cancelOrder({ orderId }, {
      onSuccess: () => setCancelConfirmId(null),
      onError:   () => setCancelConfirmId(null),
    })
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
        <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">Sin pedidos aun</p>
        <p className="font-body text-sm text-on-surface-variant/50 text-center">
          Tus compras en la tienda apareceran aqui con su estado de entrega
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      {cancelConfirmId && (
        <CancelConfirmDialog
          isPending={cancelling}
          onConfirm={() => handleCancelConfirm(cancelConfirmId)}
          onCancel={() => setCancelConfirmId(null)}
        />
      )}

      {disputeOrderId && (
        <DisputeModal
          orderId={disputeOrderId}
          onClose={() => setDisputeOrderId(null)}
        />
      )}

      {orders.map((order) => {
        const chipClass   = STATUS_CHIP[order.status] ?? STATUS_CHIP['pending']
        const statusLabel = getOrderStatusLabel(order.status)
        const statusColor = getOrderStatusColor(order.status)
        const dateLabel   = order.created_at
          ? new Date(order.created_at).toLocaleDateString('es-BO')
          : ''
        const evState = evidenceState(order)

        return (
          <div key={order.id} className="bg-surface rounded-2xl p-4 flex flex-col gap-2 border border-outline-variant">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-on-surface-variant">{dateLabel}</span>
              <span className={`text-xs font-label rounded-full px-3 py-0.5 ${chipClass}`}>
                {statusLabel}
              </span>
            </div>

            <EstimatedDelivery order={order} />

            {(() => {
              const badge = getDeliveryBadge(order)
              return badge ? (
                <div className={`text-xs font-label rounded-lg px-3 py-1.5 mt-1 text-center ${badge.className}`}>
                  {badge.label}
                </div>
              ) : null
            })()}

            {/* Rejection reason from provider */}
            {order.payment_rejection_reason && (
              <div className="bg-error-container text-on-error-container rounded-lg px-3 py-2 font-body text-xs">
                Pago rechazado: {order.payment_rejection_reason}
              </div>
            )}

            {/* Items list */}
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

            {/* ── Payment action area ─────────────────────────────────────────── */}
            {order.status === 'pending' && evState === 'idle' && (
              <button
                onClick={() => setQrOrder({ orderId: order.id, providerId: order.provider_id })}
                className="mt-2 w-full bg-primary text-on-primary rounded-2xl py-3 text-sm font-label font-semibold transition-opacity active:opacity-70"
              >
                Ver QR y subir comprobante
              </button>
            )}

            {order.status === 'pending' && evState === 'waiting' && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="bg-secondary-container text-on-secondary-container rounded-2xl px-4 py-3 font-body text-sm text-center">
                  Comprobante enviado — esperando confirmacion del proveedor
                </div>
                <button
                  onClick={() => setQrOrder({ orderId: order.id, providerId: order.provider_id })}
                  className="w-full bg-surface-container text-on-surface rounded-2xl py-2 text-xs font-label font-semibold"
                >
                  Ver QR de pago
                </button>
              </div>
            )}

            {order.status === 'confirmed' && (
              <div className="mt-2 bg-primary-container text-on-primary-container rounded-2xl px-4 py-3 font-body text-sm text-center">
                Pago verificado por el proveedor — pedido en preparacion
              </div>
            )}

            {/* Cancel button only for pending orders without confirmed payment */}
            {order.status === 'pending' && (
              <button
                onClick={() => setCancelConfirmId(order.id)}
                className="w-full bg-surface-container text-error rounded-2xl py-2 text-xs font-label font-semibold transition-opacity active:opacity-70 border border-error/30 mt-1"
              >
                Cancelar pedido
              </button>
            )}

            {(order.status === 'cancelled' || order.status === 'expired') && (
              <div className={`text-xs font-label mt-1 ${statusColor}`}>
                {order.status === 'cancelled'
                  ? 'Pedido cancelado — el stock fue liberado automaticamente.'
                  : 'Pedido expirado por inactividad — el stock fue liberado automaticamente.'}
              </div>
            )}

            {/* Enlace para reportar problema — visible en órdenes delivered o cancelled */}
            {(order.status === 'delivered' || order.status === 'cancelled') && (
              <button
                onClick={() => setDisputeOrderId(order.id)}
                className="mt-1 text-xs font-label text-on-surface-variant underline underline-offset-2 text-left w-fit active:opacity-60"
              >
                Reportar un problema
              </button>
            )}
          </div>
        )
      })}

      {qrOrder && (
        <QrPagoModal
          providerId={qrOrder.providerId}
          orderId={qrOrder.orderId}
          onConfirmed={() => void refetch()}
          onClose={() => setQrOrder(null)}
        />
      )}
    </div>
  )
}

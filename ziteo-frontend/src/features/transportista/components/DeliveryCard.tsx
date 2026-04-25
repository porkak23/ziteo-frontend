import type { Delivery } from '../types/deliveryTypes'

const STATUS_LABEL: Record<string, string> = {
  pending:    'Disponible',
  accepted:   'Aceptado',
  in_transit: 'En camino',
  delivered:  'Entregado',
  failed:     'Fallido',
}

const STATUS_COLOR: Record<string, string> = {
  pending:    'bg-status-pending-bg text-status-pending-text',
  accepted:   'bg-status-info-bg text-status-info-text',
  in_transit: 'bg-status-warning-bg text-status-warning-text',
  delivered:  'bg-status-success-bg text-status-success-text',
  failed:     'bg-status-error-bg text-status-error-text',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-label font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[status] ?? 'bg-surface-container text-on-surface'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export function deliveryFee(delivery: Delivery): { raw: number | null; label: string } {
  const raw = delivery.estimated_fee ?? (delivery.order?.total != null ? delivery.order.total * 0.08 : null)
  return { raw, label: raw != null ? `Bs. ${raw.toFixed(2)}` : '—' }
}

interface DeliveryCardProps {
  delivery: Delivery
  onClick?: (id: string) => void
  /** When true, the card renders as a tappable list item with no inline CTAs. */
  asListItem?: boolean
  /** Slot under the meta row for CTAs (only used when asListItem is false). */
  children?: React.ReactNode
}

export function DeliveryCard({ delivery, onClick, asListItem, children }: DeliveryCardProps) {
  const fee = deliveryFee(delivery).label

  const cardClasses = 'bg-surface rounded-2xl border border-outline-variant p-4 flex flex-col gap-3 shadow-sm w-full text-left'
  const interactive = onClick
    ? 'cursor-pointer transition-[transform,opacity] active:scale-[0.99] active:opacity-90'
    : ''

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-label font-semibold text-on-surface text-sm truncate">
            Entrega #{delivery.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-xs text-on-surface-variant">
            {new Date(delivery.created_at).toLocaleDateString('es-BO', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-primary text-base leading-none mt-0.5 shrink-0">radio_button_checked</span>
          <span className="text-sm text-on-surface-variant flex-1">
            {delivery.pickup_address ?? 'Dirección de recogida pendiente'}
          </span>
        </div>
        <div className="w-px h-3 bg-outline-variant self-start ml-[11px]" />
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-error text-base leading-none mt-0.5 shrink-0">location_on</span>
          <span className="text-sm text-on-surface-variant flex-1">
            {delivery.dropoff_address ?? 'Dirección de entrega pendiente'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {delivery.distance_km != null && (
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-on-surface-variant text-sm leading-none">straighten</span>
            <span className="text-xs text-on-surface-variant">{delivery.distance_km} km</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-on-surface-variant text-sm leading-none">payments</span>
          <span className="text-xs font-label font-semibold text-primary">{fee}</span>
        </div>
      </div>

      {!asListItem && children}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={() => onClick(delivery.id)} className={`${cardClasses} ${interactive}`}>
        {body}
      </button>
    )
  }

  return <div className={cardClasses}>{body}</div>
}

export function DeliverySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-44" />
      ))}
    </div>
  )
}

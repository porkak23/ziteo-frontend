import { useMemo, useState } from 'react'
import { usePendingDeliveries, useMyDeliveries, useUpdateDeliveryStatus, useAcceptDelivery } from '../hooks/useDeliveries'
import { StatusBadge } from './DeliveryCard'
import { deliveryFee } from '../utils/deliveryUtils'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { PaymentCloseSheet } from './PaymentCloseSheet'
import { LiveMap } from '../../../shared/components/LiveMap'
import { useGeolocation } from '../../../shared/hooks/useGeolocation'
import type { Delivery } from '../types/deliveryTypes'

interface DeliveryDetailScreenProps {
  deliveryId: string
  onBack: () => void
  /** When true, hides CTAs (used from Historial). */
  readOnly?: boolean
}

function buildMapsUrl(d: Delivery): string {
  const origin = d.pickup_lat != null && d.pickup_lng != null
    ? `${d.pickup_lat},${d.pickup_lng}`
    : d.pickup_address ?? ''
  const destination = d.dropoff_lat != null && d.dropoff_lng != null
    ? `${d.dropoff_lat},${d.dropoff_lng}`
    : d.dropoff_address ?? ''
  const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'driving' })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function buildWazeUrl(d: Delivery): string {
  const lat = d.dropoff_lat ?? ''
  const lng = d.dropoff_lng ?? ''
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}

export function DeliveryDetailScreen({ deliveryId, onBack, readOnly }: DeliveryDetailScreenProps) {
  const { data: pool = [] }    = usePendingDeliveries()
  const { data: mine = [] }    = useMyDeliveries()
  const delivery = useMemo(
    () => [...mine, ...pool].find((d) => d.id === deliveryId),
    [pool, mine, deliveryId],
  )

  const { toasts, showToast, removeToast } = useToast()
  const { mutate: acceptDelivery, isPending: isAccepting } = useAcceptDelivery()
  const { mutate: updateStatus, isPending: isUpdating }    = useUpdateDeliveryStatus()

  // Only poll GPS while the driver actually has this job in hand — no point
  // tracking position for a still-pending job or a read-only Historial view.
  const trackingActive = delivery?.status === 'accepted' || delivery?.status === 'in_transit'
  const geo = useGeolocation(!readOnly && trackingActive)

  const [arrivedPickup, setArrivedPickup]         = useState(false)
  const [paymentSheetOpen, setPaymentSheetOpen]   = useState(false)
  const [paymentSettled, setPaymentSettled]        = useState(false)

  if (!delivery) {
    return (
      <div className="flex flex-col min-h-dvh bg-background">
        <DetailHeader onBack={onBack} title="Entrega" />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-on-surface-variant">No encontramos esta entrega. Puede haber sido reasignada.</p>
        </div>
      </div>
    )
  }

  const fee = deliveryFee(delivery).label
  const mapsUrl  = buildMapsUrl(delivery)
  const wazeUrl  = buildWazeUrl(delivery)
  const createdRelative = new Date(delivery.created_at).toLocaleString('es-BO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  function onAccept() {
    acceptDelivery(delivery!.id, {
      onSuccess: (result) => {
        if (result.success) showToast('¡Viaje aceptado!', 'success')
        else showToast(result.message ?? 'Este viaje ya fue tomado.', 'error')
      },
      onError: (err) => showToast(err.message, 'error'),
    })
  }

  function advance(newStatus: 'in_transit' | 'delivered') {
    updateStatus(
      { deliveryId: delivery!.id, newStatus },
      {
        onSuccess: () => {
          const msg = newStatus === 'in_transit'
            ? 'Recogida confirmada. ¡Buen viaje!'
            : '¡Entrega completada! Excelente trabajo.'
          showToast(msg, 'success')
          if (newStatus === 'in_transit') setArrivedPickup(false)
        },
        onError: (err) => showToast(err.message, 'error'),
      }
    )
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Toast toasts={toasts} onRemove={removeToast} />
      <PaymentCloseSheet
        deliveryId={deliveryId}
        open={paymentSheetOpen}
        onClose={() => setPaymentSheetOpen(false)}
        onSettled={() => setPaymentSettled(true)}
      />
      <DetailHeader onBack={onBack} title={`Entrega #${delivery.id.slice(0, 8).toUpperCase()}`} trailing={<StatusBadge status={delivery.status} />} />

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 flex flex-col gap-4">
        {/* Addresses timeline */}
        <section className="bg-surface rounded-2xl border border-outline-variant p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-lg leading-none mt-0.5 shrink-0">radio_button_checked</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-label font-semibold text-on-surface-variant uppercase tracking-wider">Origen</span>
              <span className="text-sm text-on-surface">{delivery.pickup_address ?? 'Pendiente'}</span>
            </div>
          </div>
          <div className="w-px h-4 bg-outline-variant ml-[11px]" />
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-lg leading-none mt-0.5 shrink-0">location_on</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-label font-semibold text-on-surface-variant uppercase tracking-wider">Destino</span>
              <span className="text-sm text-on-surface">{delivery.dropoff_address ?? 'Pendiente'}</span>
            </div>
          </div>
        </section>

        {/* Meta */}
        <section className="grid grid-cols-3 gap-2">
          <Meta icon="straighten" label="Distancia" value={delivery.distance_km != null ? `${delivery.distance_km} km` : '—'} />
          <Meta icon="payments" label="Pago" value={fee} accent />
          <Meta icon="schedule" label="Creado" value={createdRelative} small />
        </section>

        {/* Route map — driver's own live position + pickup/dropoff pins */}
        {trackingActive && (
          <LiveMap
            driverPosition={geo.position ? { lat: geo.position.lat, lng: geo.position.lng } : null}
            pickupLat={delivery.pickup_lat}
            pickupLng={delivery.pickup_lng}
            dropoffLat={delivery.dropoff_lat}
            dropoffLng={delivery.dropoff_lng}
            height={220}
          />
        )}

        {/* Navigation — delegates to native app so GPS stays reliable in background */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 rounded-xl border border-outline-variant bg-surface text-on-surface font-label font-semibold text-sm flex items-center justify-center gap-2 hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-base">map</span>
            Google Maps
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 rounded-xl border border-outline-variant bg-surface text-on-surface font-label font-semibold text-sm flex items-center justify-center gap-2 hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-base">directions_car</span>
            Waze
          </a>
        </div>

        {/* Notes */}
        {delivery.notes && (
          <section className="bg-surface-container rounded-2xl p-4 flex gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-base mt-0.5">sticky_note_2</span>
            <p className="text-sm text-on-surface-variant flex-1">{delivery.notes}</p>
          </section>
        )}

        {/* Actions */}
        {!readOnly && (
          <section className="flex flex-col gap-2 mt-2">
            {delivery.status === 'pending' && (
              <PrimaryButton onClick={onAccept} loading={isAccepting}>
                Aceptar viaje
              </PrimaryButton>
            )}

            {delivery.status === 'accepted' && !arrivedPickup && (
              <>
                <PrimaryButton onClick={() => setArrivedPickup(true)}>
                  Llegué al origen
                </PrimaryButton>
                <p className="text-xs text-on-surface-variant text-center">
                  Recibe la carga y luego confirma la recogida.
                </p>
              </>
            )}

            {delivery.status === 'accepted' && arrivedPickup && (
              <PrimaryButton onClick={() => advance('in_transit')} loading={isUpdating}>
                Confirmar recogida
              </PrimaryButton>
            )}

            {delivery.status === 'in_transit' && (
              <>
                {!paymentSettled && (
                  <button
                    type="button"
                    onClick={() => setPaymentSheetOpen(true)}
                    className="h-12 rounded-xl border border-primary text-primary font-label font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 active:opacity-70"
                  >
                    <span className="material-symbols-outlined text-base">payments</span>
                    Cobrar pago
                  </button>
                )}
                {paymentSettled && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-status-success-bg">
                    <span className="material-symbols-outlined text-status-success-text text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="font-label text-xs font-semibold text-status-success-text">Pago registrado</span>
                  </div>
                )}
                <PrimaryButton onClick={() => advance('delivered')} loading={isUpdating}>
                  Confirmar entrega
                </PrimaryButton>
              </>
            )}

            {delivery.status === 'delivered' && (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-status-success-bg">
                <span className="material-symbols-outlined text-status-success-text" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-sm font-label font-semibold text-status-success-text">Entrega completada</span>
              </div>
            )}

            {delivery.status === 'failed' && (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-status-error-bg">
                <span className="material-symbols-outlined text-status-error-text">error</span>
                <span className="text-sm font-label font-semibold text-status-error-text">Entrega marcada como fallida</span>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function DetailHeader({ onBack, title, trailing }: { onBack: () => void; title: string; trailing?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 bg-background border-b border-outline-variant">
      <div className="flex items-center gap-3 h-14 px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-on-surface text-base flex-1 truncate">{title}</h1>
        {trailing}
      </div>
    </div>
  )
}

function Meta({ icon, label, value, accent, small }: { icon: string; label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="bg-surface rounded-xl border border-outline-variant p-3 flex flex-col gap-0.5">
      <span className="material-symbols-outlined text-on-surface-variant text-base leading-none">{icon}</span>
      <span className="text-[11px] font-label font-semibold text-on-surface-variant uppercase tracking-wider mt-1">{label}</span>
      <span className={`font-label font-semibold ${accent ? 'text-primary' : 'text-on-surface'} ${small ? 'text-xs' : 'text-sm'} truncate`}>
        {value}
      </span>
    </div>
  )
}

function PrimaryButton({ onClick, loading, children }: { onClick: () => void; loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="h-12 rounded-xl bg-primary text-on-primary font-label font-semibold text-sm transition-opacity disabled:opacity-60 active:opacity-80"
    >
      {loading ? 'Procesando…' : children}
    </button>
  )
}

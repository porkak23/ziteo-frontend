import { Z } from '@/shared/design/tokens'
import type { AdminDriverOnline } from '@/features/admin/hooks/useAdminDriversOnline'
import type { AdminActiveDelivery, DeliveryStatus } from '@/features/admin/hooks/useAdminActiveDeliveries'
import { useRouteHistory } from '@/features/admin/hooks/useRouteHistory'

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  failed: 'Fallido',
}

interface DriverDetailSheetProps {
  driver: AdminDriverOnline
  delivery: AdminActiveDelivery | undefined
  silent: boolean
  onClose: () => void
}

export function DriverDetailSheet({ driver, delivery, silent, onClose }: DriverDetailSheetProps) {
  const { data: route = [], isLoading: routeLoading } = useRouteHistory(driver.driver_id)

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        background: Z.surface,
        borderTop: `1px solid ${Z.border}`,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        maxHeight: '45%',
        overflowY: 'auto',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: Z.text }}>
            {driver.vehicle_plate ?? 'Sin placa'}
          </div>
          <div style={{ fontSize: 12, color: Z.textMuted, marginTop: 2 }}>
            {driver.vehicle_type ?? 'Vehículo desconocido'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'transparent', color: Z.textMuted, fontSize: 14, cursor: 'pointer' }}
        >
          Cerrar
        </button>
      </div>

      {silent && (
        <div
          style={{
            background: '#EF444420',
            border: '1px solid #EF444460',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: '#EF4444',
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          SIN SEÑAL — última actualización {new Date(driver.updated_at).toLocaleTimeString('es-BO')}
        </div>
      )}

      {delivery && (
        <div style={{ marginBottom: 12, fontSize: 13, color: Z.text }}>
          <div>
            Estado: <strong>{STATUS_LABEL[delivery.status]}</strong>
          </div>
          {delivery.dropoff_address && (
            <div style={{ color: Z.textMuted, marginTop: 2 }}>Destino: {delivery.dropoff_address}</div>
          )}
        </div>
      )}

      <div style={{ fontSize: 12, color: Z.textMuted }}>
        {routeLoading && 'Cargando ruta…'}
        {!routeLoading && route.length < 2 && 'Sin suficiente historial para trazar la ruta.'}
        {!routeLoading && route.length >= 2 && `Ruta de las últimas 4h trazada en el mapa (${route.length} puntos).`}
      </div>
    </div>
  )
}

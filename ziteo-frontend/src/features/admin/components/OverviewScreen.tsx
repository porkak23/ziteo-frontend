import { Z } from '@/shared/design/tokens'
import { useDashboardKpis } from '@/features/app/hooks/useDashboardKpis'
import { useActivityFeed } from '@/features/admin/hooks/useActivityFeed'
import { useAdminAlerts, useAcknowledgeAlert } from '@/features/admin/hooks/useAdminAlerts'
import { useAdminDriversOnline } from '@/features/admin/hooks/useAdminDriversOnline'
import type { AlertSeverity } from '@/features/admin/hooks/useAdminAlerts'

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: Z.surface,
        border: `1px solid ${Z.border}`,
        borderRadius: 8,
        padding: 16,
        minWidth: 140,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 12, color: Z.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: Z.text }}>{value}</div>
    </div>
  )
}

export function OverviewScreen() {
  const { data: kpis } = useDashboardKpis()
  const { data: events = [] } = useActivityFeed()
  const { data: alerts = [] } = useAdminAlerts()
  const { data: drivers = [] } = useAdminDriversOnline()
  const acknowledge = useAcknowledgeAlert()

  const todayOrders = kpis?.ordersByDay?.[0]
  const gmvToday = todayOrders?.gmv ?? 0
  const ordersToday = todayOrders?.order_count ?? 0

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatTile label="GMV hoy" value={`Bs ${gmvToday.toLocaleString('es-BO')}`} />
        <StatTile label="Órdenes hoy" value={ordersToday} />
        <StatTile label="Choferes online" value={drivers.length} />
        <StatTile label="Alertas activas" value={alerts.length} />
      </div>

      {alerts.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: Z.text, marginBottom: 8 }}>
            Alertas activas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${SEVERITY_COLOR[alert.severity]}40`,
                  background: `${SEVERITY_COLOR[alert.severity]}10`,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: Z.text }}>
                    {alert.kind}
                  </span>
                  <span style={{ fontSize: 11, color: Z.textMuted }}>
                    {new Date(alert.created_at).toLocaleString('es-BO')}
                  </span>
                </div>
                <button
                  onClick={() => acknowledge.mutate(alert.id)}
                  disabled={acknowledge.pendingId === alert.id}
                  style={{
                    fontSize: 12,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: `1px solid ${Z.border}`,
                    background: Z.surface,
                    color: Z.text,
                    cursor: 'pointer',
                  }}
                >
                  {acknowledge.pendingId === alert.id ? '...' : 'Reconocer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: Z.text, marginBottom: 8 }}>
          Actividad en vivo
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 400,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        >
          {events.length === 0 && (
            <div style={{ color: Z.textMuted, padding: 12 }}>Sin actividad reciente.</div>
          )}
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 4,
                background: Z.surface,
              }}
            >
              <span style={{ color: Z.textMuted }}>
                {new Date(event.created_at).toLocaleTimeString('es-BO')}
              </span>
              <span style={{ color: Z.text, fontWeight: 600 }}>{event.event_name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

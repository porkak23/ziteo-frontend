import { useEffect, useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { useDashboardKpis } from '@/features/app/hooks/useDashboardKpis'
import { useActivityFeed } from '@/features/admin/hooks/useActivityFeed'
import { useAdminAlerts, useAcknowledgeAlert } from '@/features/admin/hooks/useAdminAlerts'
import { useAdminDriversOnline } from '@/features/admin/hooks/useAdminDriversOnline'
import { useEdgeFunctionHealth } from '@/features/admin/hooks/useEdgeFunctionHealth'
import { useMarketSources } from '@/features/admin/hooks/useMarketPrices'
import type { AlertSeverity } from '@/features/admin/hooks/useAdminAlerts'

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: Z.error,
  warning: Z.warning,
  info: Z.info,
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

// ─── Banda 1: Salud ─────────────────────────────────────────────────────────
// Semáforo único que responde "¿está todo bien?" sin entrar a la pestaña
// Salud. Agrega: alertas críticas activas, error rate de edge functions
// (umbral >5% ya usado en HealthScreen), y fuentes de mercado caídas
// (>24h sin last_ok_at, mismo umbral que MarketScreen).
type HealthStatus = 'ok' | 'warning' | 'critical'

function HealthBanner({
  criticalAlerts,
  warningAlerts,
  edgeErrorRatePct,
  staleSources,
}: {
  criticalAlerts: number
  warningAlerts: number
  edgeErrorRatePct: number | null
  staleSources: number
}) {
  let status: HealthStatus = 'ok'
  const reasons: string[] = []

  if (criticalAlerts > 0) {
    status = 'critical'
    reasons.push(`${criticalAlerts} alerta${criticalAlerts === 1 ? '' : 's'} crítica${criticalAlerts === 1 ? '' : 's'}`)
  }
  if (edgeErrorRatePct !== null && edgeErrorRatePct > 5) {
    status = 'critical'
    reasons.push(`error rate ${edgeErrorRatePct.toFixed(1)}%`)
  }
  if (status !== 'critical') {
    if (warningAlerts > 0) {
      status = 'warning'
      reasons.push(`${warningAlerts} advertencia${warningAlerts === 1 ? '' : 's'}`)
    }
    if (staleSources > 0) {
      status = 'warning'
      reasons.push(`${staleSources} fuente${staleSources === 1 ? '' : 's'} de mercado caída${staleSources === 1 ? '' : 's'}`)
    }
  }

  const COLOR: Record<HealthStatus, string> = { ok: Z.success, warning: Z.warning, critical: Z.error }
  const BG: Record<HealthStatus, string> = { ok: Z.successBg, warning: Z.warningBg, critical: Z.errorBg }
  const LABEL: Record<HealthStatus, string> = { ok: 'Todo bien', warning: 'Atención', critical: 'Crítico' }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 12,
        background: BG[status],
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR[status], flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 700, color: COLOR[status] }}>{LABEL[status]}</span>
      {reasons.length > 0 && (
        <span style={{ fontSize: 13, color: Z.textMuted }}>— {reasons.join(', ')}</span>
      )}
    </div>
  )
}

// ─── Banda 3: Feed unificado ────────────────────────────────────────────────
// Fusiona eventos + alertas en un solo stream cronológico. Reusa el canal
// realtime que ya trae useActivityFeed (límite de 3 canales del panel:
// events, admin_alerts, driver_locations — ver CLAUDE.md) en vez de abrir
// uno nuevo; las alertas llegan por su propio hook, que también reusa el
// canal admin_alerts existente.
type FeedKind = 'event' | 'alert'
interface FeedRow {
  key: string
  kind: FeedKind
  label: string
  createdAt: string
  severity?: AlertSeverity
}

function UnifiedFeed({
  events,
  alerts,
}: {
  events: { id: number; event_name: string; created_at: string }[]
  alerts: { id: string; kind: string; severity: AlertSeverity; created_at: string }[]
}) {
  const rows: FeedRow[] = [
    ...events.map((e) => ({ key: `event-${e.id}`, kind: 'event' as const, label: e.event_name, createdAt: e.created_at })),
    ...alerts.map((a) => ({ key: `alert-${a.id}`, kind: 'alert' as const, label: a.kind, createdAt: a.created_at, severity: a.severity })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
      {rows.length === 0 && <div style={{ color: Z.textMuted, padding: 12 }}>Sin actividad reciente.</div>}
      {rows.map((row) => (
        <div
          key={row.key}
          style={{
            display: 'flex',
            gap: 8,
            padding: '6px 8px',
            borderRadius: 4,
            background: row.kind === 'alert' ? `${SEVERITY_COLOR[row.severity!]}10` : Z.surface,
          }}
        >
          <span style={{ color: Z.textMuted }}>{new Date(row.createdAt).toLocaleTimeString('es-BO')}</span>
          {row.kind === 'alert' && (
            <span style={{ color: SEVERITY_COLOR[row.severity!], fontWeight: 700 }}>[alerta]</span>
          )}
          <span style={{ color: Z.text, fontWeight: 600 }}>{row.label}</span>
        </div>
      ))}
    </div>
  )
}

export function OverviewScreen() {
  const { data: kpis } = useDashboardKpis()
  const { data: events = [] } = useActivityFeed()
  const { data: alerts = [] } = useAdminAlerts()
  const { data: drivers = [] } = useAdminDriversOnline()
  const { data: edgeHealth = [] } = useEdgeFunctionHealth()
  const { data: marketSources = [] } = useMarketSources()
  const acknowledge = useAcknowledgeAlert()

  const todayOrders = kpis?.ordersByDay?.[0]
  const gmvToday = todayOrders?.gmv ?? 0
  const ordersToday = todayOrders?.order_count ?? 0

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length
  const warningAlerts = alerts.filter((a) => a.severity === 'warning').length
  const maxErrorRate = edgeHealth.length > 0 ? Math.max(...edgeHealth.map((f) => f.error_rate_pct)) : null
  // Date.now() es impuro y no puede leerse durante el render (dos renders con
  // los mismos datos darían resultados distintos). Se calcula en un efecto y
  // se guarda en estado; el intervalo mantiene el contador fresco sin depender
  // de que llegue un refetch.
  const [staleSources, setStaleSources] = useState(0)
  useEffect(() => {
    const recount = () => {
      const now = Date.now()
      setStaleSources(marketSources.filter((s) => {
        if (!s.enabled) return false
        if (!s.last_ok_at) return true
        return now - new Date(s.last_ok_at).getTime() > 24 * 60 * 60 * 1000
      }).length)
    }
    recount()
    const id = setInterval(recount, 60_000)
    return () => clearInterval(id)
  }, [marketSources])

  const paymentRate = kpis?.paymentRate?.confirmation_rate
  const licitacionesRate = kpis?.licitacionesEngagement?.engagement_rate
  const activeProviders = kpis?.activeProviders?.with_products
  const availableMaestros = kpis?.activeMaestros?.available
  const topCity = kpis?.gmvByCity?.[0]
  const signupsWeek = (kpis?.signupsByDay ?? []).reduce((sum, d) => sum + d.signups, 0)

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Banda 1: Salud */}
      <HealthBanner
        criticalAlerts={criticalAlerts}
        warningAlerts={warningAlerts}
        edgeErrorRatePct={maxErrorRate}
        staleSources={staleSources}
      />

      {/* Banda 2: Negocio */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatTile label="GMV hoy" value={`Bs ${gmvToday.toLocaleString('es-BO')}`} />
        <StatTile label="Órdenes hoy" value={ordersToday} />
        <StatTile label="Choferes online" value={drivers.length} />
        <StatTile label="Alertas activas" value={alerts.length} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatTile label="Confirmación de pago" value={paymentRate !== undefined ? `${paymentRate.toFixed(0)}%` : '—'} />
        <StatTile label="Engagement licitaciones" value={licitacionesRate !== undefined ? `${licitacionesRate.toFixed(0)}%` : '—'} />
        <StatTile label="Proveedores con catálogo" value={activeProviders ?? '—'} />
        <StatTile label="Maestros disponibles" value={availableMaestros ?? '—'} />
        <StatTile label="Registros (7d)" value={signupsWeek} />
        {topCity && (
          <StatTile label={`GMV top: ${topCity.city}`} value={`Bs ${topCity.total_gmv.toLocaleString('es-BO')}`} />
        )}
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

      {/* Banda 3: Feed unificado */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: Z.text, marginBottom: 8 }}>
          Actividad en vivo
        </h3>
        <UnifiedFeed events={events} alerts={alerts} />
      </div>
    </div>
  )
}

import { Z } from '@/shared/design/tokens'
import { useActivityFeed } from '@/features/admin/hooks/useActivityFeed'
import { useEdgeFunctionHealth } from '@/features/admin/hooks/useEdgeFunctionHealth'
import { useSentryHealth, usePostHogHealth } from '@/features/admin/hooks/useAdminTelemetry'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 14, fontWeight: 600, color: Z.text, marginBottom: 8 }}>{children}</h3>
}

function NotConfiguredCard({ label, envVars }: { label: string; envVars: string[] }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: `1px dashed ${Z.border}`,
        background: Z.surface,
        fontSize: 12,
        color: Z.textMuted,
      }}
    >
      <div style={{ fontWeight: 600, color: Z.text, marginBottom: 4 }}>{label} no configurado</div>
      <div>Configura: {envVars.join(', ')}</div>
    </div>
  )
}

export function HealthScreen() {
  const { data: events = [] } = useActivityFeed()
  const { data: edgeHealth = [] } = useEdgeFunctionHealth()
  const { data: sentry } = useSentryHealth()
  const { data: posthog } = usePostHogHealth()

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SectionTitle>Edge Functions (última hora)</SectionTitle>
        {edgeHealth.length === 0 && (
          <div style={{ color: Z.textMuted, fontSize: 13, padding: 12 }}>
            Sin datos — solo funciones que adoptaron el wrapper de telemetría reportan aquí.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {edgeHealth.map((fn) => {
            const unhealthy = fn.error_rate_pct > 5
            return (
              <div
                key={fn.function_name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${unhealthy ? '#EF444460' : Z.border}`,
                  background: unhealthy ? '#EF444410' : Z.surface,
                  fontSize: 13,
                }}
              >
                <span style={{ color: Z.text, fontFamily: 'monospace' }}>{fn.function_name}</span>
                <span style={{ color: unhealthy ? '#EF4444' : Z.textMuted }}>
                  {fn.request_count} req · {fn.error_rate_pct}% error · p95 {fn.p95_duration_ms}ms
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <SectionTitle>Sentry (errores 24h)</SectionTitle>
        {sentry?.configured === false && (
          <NotConfiguredCard label="Sentry" envVars={['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT']} />
        )}
        {sentry?.configured && sentry.error && (
          <div style={{ color: '#EF4444', fontSize: 12 }}>{sentry.error}</div>
        )}
        {sentry?.configured && Array.isArray(sentry.issues) && (
          <div style={{ fontSize: 13, color: Z.text }}>{sentry.issues.length} issues sin resolver</div>
        )}
      </div>

      <div>
        <SectionTitle>PostHog</SectionTitle>
        {posthog?.configured === false && (
          <NotConfiguredCard label="PostHog" envVars={['POSTHOG_PERSONAL_API_KEY', 'POSTHOG_PROJECT_ID']} />
        )}
        {posthog?.configured && posthog.error && (
          <div style={{ color: '#EF4444', fontSize: 12 }}>{posthog.error}</div>
        )}
      </div>

      <div>
        <SectionTitle>Event stream</SectionTitle>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 300,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        >
          {events.slice(0, 20).map((event) => (
            <div key={event.id} style={{ display: 'flex', gap: 8, padding: '4px 8px' }}>
              <span style={{ color: Z.textMuted }}>{new Date(event.created_at).toLocaleTimeString('es-BO')}</span>
              <span style={{ color: Z.text }}>{event.event_name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

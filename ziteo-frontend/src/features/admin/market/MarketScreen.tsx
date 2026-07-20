import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Z } from '@/shared/design/tokens'
import { useMarketPriceHistory, usePriceDeviation, useMarketSources } from '@/features/admin/hooks/useMarketPrices'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 14, fontWeight: 600, color: Z.text, marginBottom: 8 }}>{children}</h3>
}

function sourceIsStale(lastOkAt: string | null): boolean {
  if (!lastOkAt) return true
  return Date.now() - new Date(lastOkAt).getTime() > 24 * 60 * 60 * 1000
}

export function MarketScreen() {
  const { data: history = [] } = useMarketPriceHistory()
  const { data: deviation = [] } = usePriceDeviation()
  const { data: sources = [] } = useMarketSources()

  const usdBobSeries = history
    .filter((p) => p.commodity === 'usd_bob_parallel')
    .map((p) => ({
      date: new Date(p.captured_at).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' }),
      price: p.price,
    }))

  const latestUsdBob = usdBobSeries[usdBobSeries.length - 1]?.price

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SectionTitle>USD/BOB paralelo</SectionTitle>
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: `1px solid ${Z.border}`,
            background: Z.surface,
          }}
        >
          {latestUsdBob !== undefined && (
            <div style={{ fontSize: 24, fontWeight: 700, color: Z.text, marginBottom: 12 }}>
              Bs {latestUsdBob.toFixed(2)}
            </div>
          )}
          {usdBobSeries.length === 0 && (
            <div style={{ color: Z.textMuted, fontSize: 13 }}>Sin datos aún — el cron de ingesta corre cada 3h.</div>
          )}
          {usdBobSeries.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={usdBobSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={Z.border} />
                <XAxis dataKey="date" stroke={Z.textMuted} fontSize={11} />
                <YAxis stroke={Z.textMuted} fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: Z.surface, border: `1px solid ${Z.border}`, borderRadius: 6, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="price" stroke={Z.orange} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Desviación catálogo vs mercado</SectionTitle>
        {deviation.length === 0 && (
          <div style={{ color: Z.textMuted, fontSize: 13, padding: 12 }}>
            Sin categorías con commodity_key configurado, o sin datos de mercado aún.
          </div>
        )}
        {deviation.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deviation.map((row) => {
              const isHigh = Math.abs(row.deviation_pct) > 15
              return (
                <div
                  key={row.commodity_key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 8,
                    border: `1px solid ${isHigh ? '#F59E0B60' : Z.border}`,
                    background: isHigh ? '#F59E0B10' : Z.surface,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: Z.text }}>{row.category_name}</span>
                  <span style={{ color: isHigh ? '#F59E0B' : Z.textMuted, fontWeight: isHigh ? 700 : 400 }}>
                    {row.deviation_pct > 0 ? '+' : ''}{row.deviation_pct}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>Fuentes de datos</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sources.map((source) => {
            const stale = sourceIsStale(source.last_ok_at)
            return (
              <div
                key={source.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${Z.border}`,
                  background: Z.surface,
                  fontSize: 13,
                }}
              >
                <span style={{ color: Z.text }}>{source.label}</span>
                <span style={{ color: stale ? '#EF4444' : Z.success, fontWeight: 600 }}>
                  {stale ? 'Caída' : 'OK'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

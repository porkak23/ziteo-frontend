import { useIntelData } from '../hooks/useIntel'

interface MetricCardProps {
  icon: string
  value: string
  label: string
}

function MetricCard({ icon, value, label }: MetricCardProps) {
  return (
    <div className="bg-surface rounded-2xl p-4 flex flex-col gap-1 border border-outline-variant">
      <span className="material-symbols-outlined text-primary text-xl leading-none">{icon}</span>
      <span className="font-headline text-2xl text-on-surface leading-tight">{value}</span>
      <span className="font-body text-xs text-on-surface-variant">{label}</span>
    </div>
  )
}

const STAGE_BADGE: Record<string, { bg: string; text: string; bar: string }> = {
  fundaciones: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', bar: 'bg-amber-500' },
  muros:       { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300', bar: 'bg-slate-500' },
  techos:      { bg: 'bg-blue-100 dark:bg-blue-900/30',  text: 'text-blue-800 dark:text-blue-200',   bar: 'bg-blue-500' },
  terminaciones: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', bar: 'bg-green-500' },
}

export function IntelScreen() {
  const { data, isLoading } = useIntelData()

  return (
    <div className="flex flex-col gap-5 pb-8">
      <h1 className="font-headline font-extrabold text-2xl text-on-surface px-4 pt-4">
        Inteligencia de Negocio
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Core metrics ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 px-4">
            <MetricCard
              icon="payments"
              value={`Bs. ${(data?.totalVentas ?? 0).toLocaleString('es-BO')}`}
              label="Ventas totales"
            />
            <MetricCard
              icon="calendar_month"
              value={`Bs. ${(data?.ventasEsteMes ?? 0).toLocaleString('es-BO')}`}
              label="Este mes"
            />
            <MetricCard
              icon="receipt_long"
              value={String(data?.totalPedidos ?? 0)}
              label="Pedidos totales"
            />
            <MetricCard
              icon="pending"
              value={String(data?.pedidosPendientes ?? 0)}
              label="Pendientes"
            />
          </div>

          {/* ── TUL KPIs ────────────────────────────────────────────────────── */}
          <div className="px-4">
            <span className="font-label text-on-surface-variant text-xs uppercase tracking-wide">
              Métricas de rendimiento
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 px-4">
            <MetricCard
              icon="shopping_bag"
              value={`Bs. ${(data?.ticketPromedio ?? 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`}
              label="Ticket promedio"
            />
            <MetricCard
              icon="request_quote"
              value={String(data?.cotizacionesLast30 ?? 0)}
              label="Cotizaciones (30 días)"
            />
          </div>

          {/* ── On-time rate ─────────────────────────────────────────────────── */}
          {data?.pctEnTiempo != null && (
            <div className="mx-4 bg-surface rounded-2xl border border-outline-variant p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    timer
                  </span>
                  <span className="font-label font-semibold text-on-surface text-sm">Entregas en tiempo</span>
                </div>
                <span className={`font-headline font-extrabold text-xl ${
                  data.pctEnTiempo >= 90 ? 'text-green-600' :
                  data.pctEnTiempo >= 70 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {data.pctEnTiempo}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    data.pctEnTiempo >= 90 ? 'bg-green-500' :
                    data.pctEnTiempo >= 70 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.pctEnTiempo}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Top etapas de obra ───────────────────────────────────────────── */}
          {(data?.topEtapas ?? []).length > 0 && (
            <div className="flex flex-col gap-2 px-4">
              <span className="font-label text-on-surface-variant text-xs uppercase tracking-wide">
                Ventas por etapa de obra
              </span>
              <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
                {(data?.topEtapas ?? []).map((etapa, idx, arr) => {
                  const badge = STAGE_BADGE[etapa.stage]
                  const maxCount = arr[0].count
                  const pct = maxCount > 0 ? Math.round((etapa.count / maxCount) * 100) : 0
                  return (
                    <div
                      key={etapa.stage}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        idx < arr.length - 1 ? 'border-b border-outline-variant' : ''
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded-md font-label text-xs font-semibold ${badge?.bg ?? 'bg-surface-container'} ${badge?.text ?? 'text-on-surface-variant'}`}>
                        {etapa.label}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full rounded-full ${badge?.bar ?? 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-label font-semibold text-on-surface text-sm tabular-nums w-8 text-right">
                        {etapa.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Stock alert ──────────────────────────────────────────────────── */}
          {(data?.stockBajo ?? 0) > 0 && (
            <div className="flex flex-col gap-2 px-4">
              <span className="font-label text-on-surface-variant text-xs uppercase tracking-wide">
                Alertas
              </span>
              <div className="bg-error-container text-on-error-container rounded-2xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-xl leading-none">warning</span>
                <span className="font-body text-sm">
                  {data?.stockBajo} producto(s) con stock bajo (&lt; 10 unidades)
                </span>
              </div>
            </div>
          )}

          {/* ── Top product ──────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <span className="font-label text-on-surface-variant text-xs uppercase tracking-wide px-4">
              Producto más vendido
            </span>
            <div className="bg-secondary-container rounded-2xl px-4 py-3 mx-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-on-secondary-container text-xl leading-none">
                star
              </span>
              <span className="font-label text-on-secondary-container">
                {data?.productoMasVendido ?? '—'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

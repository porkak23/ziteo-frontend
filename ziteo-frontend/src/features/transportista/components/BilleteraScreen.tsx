import { useDriverEarnings, COMMISSION_RATE } from '../hooks/useDriverEarnings'
import { useNavStore } from '../../../shared/store/navStore'

function fmt(n: number): string {
  return `Bs. ${n.toFixed(2)}`
}

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return d.toLocaleDateString('es-BO', { weekday: 'long', day: '2-digit', month: 'short' })
}

export function BilleteraScreen() {
  const { today, week, byDay, loading } = useDriverEarnings()
  const setTab = useNavStore((s) => s.setTab)

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <div className="px-4 py-4 flex flex-col gap-4 pb-24">
        {/* Hero: weekly earnings */}
        <section
          aria-labelledby="weekly-earnings-title"
          className="bg-surface-container rounded-3xl p-6 flex flex-col gap-4 border border-outline-variant"
        >
          <div className="flex items-center justify-between">
            <span id="weekly-earnings-title" className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wider">
              Esta semana
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-label font-semibold bg-surface text-on-surface-variant px-2 py-1 rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-xs leading-none">schedule</span>
              Mercado Pago · Próximamente
            </span>
          </div>

          {loading ? (
            <div className="h-12 w-40 bg-surface-container-high animate-pulse rounded-lg" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-black text-primary text-[44px] leading-none tracking-tight">
                {fmt(week.net)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span>{week.deliveries} flete{week.deliveries === 1 ? '' : 's'}</span>
            <span className="w-px h-3 bg-outline-variant" />
            <span>Promedio {fmt(week.average)}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
            <span className="text-xs text-on-surface-variant">Hoy</span>
            <span className="font-label font-semibold text-on-surface text-sm">{fmt(today.net)}</span>
          </div>
        </section>

        {/* Desglose */}
        <section aria-labelledby="breakdown-title" className="bg-surface rounded-2xl border border-outline-variant p-4 flex flex-col gap-3">
          <h2 id="breakdown-title" className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wider">
            Desglose · esta semana
          </h2>
          <dl className="flex flex-col gap-2.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-on-surface-variant">Bruto</dt>
              <dd className="font-label font-semibold text-on-surface">{fmt(week.gross)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-on-surface-variant">Comisión Ziteo ({Math.round(COMMISSION_RATE * 100)}%)</dt>
              <dd className="font-label font-semibold text-on-surface-variant">−{fmt(week.commission)}</dd>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-outline-variant">
              <dt className="font-label font-semibold text-on-surface">Neto a recibir</dt>
              <dd className="font-label font-bold text-primary">{fmt(week.net)}</dd>
            </div>
          </dl>
        </section>

        {/* Últimos días */}
        <section aria-labelledby="recent-days-title" className="flex flex-col gap-2">
          <h2 id="recent-days-title" className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wider px-1">
            Últimos 7 días
          </h2>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-surface-container animate-pulse rounded-xl" />
              ))}
            </div>
          ) : byDay.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-outline-variant p-6 flex flex-col items-center gap-2 text-center">
              <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl">savings</span>
              <p className="text-sm text-on-surface-variant">Aún no tienes entregas completadas esta semana.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {byDay.map((d) => (
                <li
                  key={d.date}
                  className="bg-surface rounded-xl border border-outline-variant px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-label font-semibold text-on-surface text-sm capitalize">
                      {formatDayLabel(d.date)}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {d.deliveries} flete{d.deliveries === 1 ? '' : 's'}
                    </span>
                  </div>
                  <span className="font-label font-semibold text-primary">{fmt(d.net)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actions */}
        <section className="flex flex-col gap-2 mt-2">
          <button
            type="button"
            onClick={() => setTab('historial')}
            className="w-full h-12 rounded-xl border border-outline-variant bg-surface text-on-surface font-label font-semibold text-sm transition-colors hover:bg-surface-container"
          >
            Ver historial completo
          </button>
          <button
            type="button"
            disabled
            title="Próximamente"
            className="w-full h-12 rounded-xl bg-surface-container text-on-surface-variant font-label font-semibold text-sm opacity-60 cursor-not-allowed"
          >
            Registrar cuenta bancaria
          </button>
        </section>
      </div>
    </div>
  )
}

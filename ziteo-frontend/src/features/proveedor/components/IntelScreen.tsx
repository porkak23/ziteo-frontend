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

export function IntelScreen() {
  const { data, isLoading } = useIntelData()

  return (
    <div className="flex flex-col gap-5 pb-8">
      <h1 className="font-headline font-extrabold text-2xl text-on-surface px-4 pt-4">
        Inteligencia de Negocio
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-24" />
          ))}
        </div>
      ) : (
        <>
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

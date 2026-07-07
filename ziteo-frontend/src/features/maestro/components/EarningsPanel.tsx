import { useEarnings } from '../hooks/useEarnings'

interface EarningsPanelProps {
  maestroId: string
}

export function EarningsPanel({ maestroId }: EarningsPanelProps) {
  const { data, isLoading } = useEarnings(maestroId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 bg-surface rounded-2xl border border-outline-variant animate-pulse mb-2">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-surface-container rounded-lg w-32"></div>
          <div className="h-6 bg-surface-container rounded-full w-24"></div>
        </div>
        <div className="flex gap-2">
           <div className="h-[90px] bg-surface-container rounded-xl flex-1"></div>
           <div className="h-[90px] bg-surface-container rounded-xl flex-1"></div>
           <div className="h-[90px] bg-surface-container rounded-xl flex-1"></div>
        </div>
        <div className="h-24 flex items-end gap-2 mt-2">
           <div className="bg-surface-container rounded-t-lg flex-1 h-[40%]"></div>
           <div className="bg-surface-container rounded-t-lg flex-1 h-[60%]"></div>
           <div className="bg-surface-container rounded-t-lg flex-1 h-[30%]"></div>
           <div className="bg-surface-container rounded-t-lg flex-1 h-[80%]"></div>
           <div className="bg-surface-container rounded-t-lg flex-1 h-[50%]"></div>
           <div className="bg-surface-container rounded-t-lg flex-1 h-[90%]"></div>
        </div>
      </div>
    )
  }

  const { totalEarned = 0, completedCount = 0, avgBudget = 0, chartData = [] } = data || {}
  const maxAmount = chartData.length > 0 ? Math.max(...chartData.map(d => d.amount)) : 0

  return (
    <div className="flex flex-col gap-4 px-4 py-4 bg-surface rounded-2xl border border-outline-variant mb-2 shadow-sm">
      <div className="flex items-center justify-between h-7">
        <h2 className="font-title text-lg text-on-surface m-0 leading-none">Mis Ganancias</h2>
        <span className="font-body text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-full whitespace-nowrap">
          Últimos 6 meses
        </span>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col gap-1 flex-1 bg-surface-container rounded-xl p-3 min-w-0">
          <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
          <span className="font-body text-xs text-on-surface-variant leading-tight truncate">Total ganado</span>
          <span className="font-label text-sm text-on-surface font-semibold truncate" title={`Bs. ${totalEarned.toLocaleString('es-BO')}`}>
            Bs. {totalEarned.toLocaleString('es-BO')}
          </span>
        </div>
        <div className="flex flex-col gap-1 flex-1 bg-surface-container rounded-xl p-3 min-w-0">
          <span className="material-symbols-outlined text-primary text-[20px]">task_alt</span>
          <span className="font-body text-xs text-on-surface-variant leading-tight truncate">Trabajos</span>
          <span className="font-label text-sm text-on-surface font-semibold truncate">
            {completedCount}
          </span>
        </div>
        <div className="flex flex-col gap-1 flex-1 bg-surface-container rounded-xl p-3 min-w-0">
          <span className="material-symbols-outlined text-primary text-[20px]">trending_up</span>
          <span className="font-body text-xs text-on-surface-variant leading-tight truncate">Promedio</span>
          <span className="font-label text-sm text-on-surface font-semibold truncate" title={`Bs. ${Math.round(avgBudget).toLocaleString('es-BO')}`}>
            Bs. {Math.round(avgBudget).toLocaleString('es-BO')}
          </span>
        </div>
      </div>

      <div className="flex items-end gap-2 h-24 mt-2">
        {chartData.map((d, i) => {
          const heightPercent = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
              <div className="relative w-full flex-1">
                <div
                  className={`absolute bottom-0 left-0 w-full h-full rounded-t-lg origin-bottom transition-[transform,background-color] duration-500 ease-in-out ${d.amount > 0 ? 'bg-primary' : 'bg-surface-container'}`}
                  style={{ transform: `scaleY(${(d.amount > 0 ? Math.max(heightPercent, 15) : 15) / 100})` }}
                  title={`Bs. ${d.amount.toLocaleString('es-BO')}`}
                />
              </div>
              <span className="text-xs text-on-surface-variant font-body">{d.month}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

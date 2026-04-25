import { useMemo, useState } from 'react'
import { useMyDeliveries } from '../hooks/useDeliveries'
import { DeliveryCard, DeliverySkeleton } from './DeliveryCard'
import { DeliveryDetailScreen } from './DeliveryDetailScreen'
import type { Delivery } from '../types/deliveryTypes'

type Range = 'today' | '7d' | '30d' | 'all'

const RANGE_OPTIONS: { id: Range; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: '7d',    label: '7 días' },
  { id: '30d',   label: '30 días' },
  { id: 'all',   label: 'Todo' },
]

function cutoffForRange(range: Range): Date | null {
  const now = new Date()
  if (range === 'today') {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (range === '7d') {
    const d = new Date(now)
    d.setDate(now.getDate() - 7)
    return d
  }
  if (range === '30d') {
    const d = new Date(now)
    d.setDate(now.getDate() - 30)
    return d
  }
  return null
}

function groupByDate(deliveries: Delivery[]): [string, Delivery[]][] {
  const map = new Map<string, Delivery[]>()
  for (const d of deliveries) {
    const ref = d.delivered_at ?? d.updated_at ?? d.created_at
    const key = new Date(ref).toLocaleDateString('es-BO', {
      weekday: 'long', day: '2-digit', month: 'short',
    })
    const bucket = map.get(key) ?? []
    bucket.push(d)
    map.set(key, bucket)
  }
  return Array.from(map.entries())
}

export function HistorialScreen() {
  const { data: myDeliveries = [], isLoading } = useMyDeliveries()
  const [range, setRange] = useState<Range>('7d')
  const [query, setQuery] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const base = myDeliveries.filter((d) => d.status === 'delivered' || d.status === 'failed')
    const cutoff = cutoffForRange(range)
    const q = query.trim().toLowerCase()
    return base.filter((d) => {
      const ref = d.delivered_at ?? d.updated_at ?? d.created_at
      if (cutoff && new Date(ref) < cutoff) return false
      if (q) {
        const hay = `${d.pickup_address ?? ''} ${d.dropoff_address ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [myDeliveries, range, query])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  if (detailId) {
    return <DeliveryDetailScreen deliveryId={detailId} readOnly onBack={() => setDetailId(null)} />
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Filters */}
      <div className="sticky top-14 z-10 bg-background border-b border-outline-variant">
        <div className="px-4 pt-3 pb-3 flex flex-col gap-3">
          <label className="flex items-center gap-2 bg-surface-container rounded-xl h-11 px-3">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por dirección"
              aria-label="Buscar entregas por dirección"
              className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant"
            />
          </label>

          <div role="tablist" aria-label="Rango de fechas" className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
            {RANGE_OPTIONS.map((opt) => {
              const active = range === opt.id
              return (
                <button
                  key={opt.id}
                  id={`tab-${opt.id}`}
                  role="tab"
                  aria-selected={active}
                  aria-controls="panel-range"
                  onClick={() => setRange(opt.id)}
                  className={`h-11 px-4 rounded-full text-sm font-label font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        role="tabpanel"
        id="panel-range"
        aria-labelledby={`tab-${range}`}
        className="flex-1 overflow-y-auto px-4 py-4 pb-24"
      >
        {isLoading ? (
          <DeliverySkeleton />
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/20">history</span>
            <p className="font-headline font-bold text-on-surface/60 text-lg text-center">Sin entregas en este rango</p>
            <p className="font-body text-sm text-on-surface-variant text-center">
              Ajusta el filtro o completa un viaje para verlo aquí.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(([label, items]) => (
              <section key={label} className="flex flex-col gap-2">
                <h3 className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-wider capitalize px-1">
                  {label}
                </h3>
                <div className="flex flex-col gap-3">
                  {items.map((d) => (
                    <DeliveryCard key={d.id} delivery={d} onClick={setDetailId} asListItem />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

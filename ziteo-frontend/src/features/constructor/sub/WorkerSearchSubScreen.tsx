import { useState } from 'react'
import { useMaestros, DEFAULT_MAESTRO_FILTERS, type Maestro } from '../../contratar/hooks/useMaestros'
import { ZHeader } from '@/shared/design/components/ZHeader'
import { WorkerProfileSubScreen } from './WorkerProfileSubScreen'

const SPECIALTY_FILTERS = ['Todos', 'Disponibles', 'Albañilería', 'Electricidad', 'Plomería', 'Carpintería', 'Soldadura']

function WorkerAvatar({ worker }: { worker: Maestro }) {
  const initial = worker.name.charAt(0).toUpperCase()
  if (worker.avatar_url) {
    return (
      <img
        src={worker.avatar_url}
        alt={worker.name}
        className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
      />
    )
  }
  return (
    <div className="w-12 h-12 rounded-full flex-shrink-0 bg-primary/15 flex items-center justify-center">
      <span className="font-headline font-bold text-base text-primary">{initial}</span>
    </div>
  )
}

function RateLabel({ rateType, rateAmount }: { rateType: string; rateAmount: number }) {
  if (rateAmount === 0) return null
  const suffix = rateType === 'per_hour' ? '/h' : rateType === 'per_day' ? '/día' : ''
  return (
    <span className="font-body text-xs font-semibold text-primary">
      Bs.{rateAmount}{suffix}
    </span>
  )
}

function WorkerCard({ worker, onTap }: { worker: Maestro; onTap: () => void }) {
  const mainSpecialty = worker.specialties[0] ?? 'Especialista'
  const secondSpecialty = worker.specialties[1]

  return (
    <button
      onClick={onTap}
      className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-outline-variant w-full text-left active:opacity-75 transition-opacity"
    >
      <WorkerAvatar worker={worker} />

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-label font-semibold text-sm text-on-surface truncate">{worker.name}</span>
          {worker.available && (
            <span className="flex-shrink-0 text-[10px] font-label font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Disponible
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-body text-xs text-on-surface-variant">{mainSpecialty}</span>
          {secondSpecialty && (
            <>
              <span className="text-on-surface-variant/40 text-xs">·</span>
              <span className="font-body text-xs text-on-surface-variant">{secondSpecialty}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {worker.experience_years > 0 && (
            <span className="font-body text-xs text-on-surface-variant">
              {worker.experience_years} año{worker.experience_years !== 1 ? 's' : ''}
            </span>
          )}
          <RateLabel rateType={worker.rate_type} rateAmount={worker.rate_amount} />
        </div>
      </div>

      <span className="font-body text-xs text-on-surface-variant flex-shrink-0 ml-1">{worker.city}</span>
    </button>
  )
}

function FilterChips({ active, onChange }: { active: string; onChange: (f: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {SPECIALTY_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-label font-semibold transition-colors ${
            active === f
              ? 'bg-primary text-on-primary'
              : 'bg-surface border border-outline-variant text-on-surface-variant'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  )
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="font-label text-sm text-on-surface-variant">
        No se encontraron maestros
      </span>
      <button
        onClick={onClear}
        className="font-label text-xs font-semibold text-primary"
      >
        Limpiar filtros
      </button>
    </div>
  )
}

interface Props {
  onBack: () => void
}

export function WorkerSearchSubScreen({ onBack }: Props) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [selectedWorker, setSelectedWorker] = useState<Maestro | null>(null)

  const { data: workers = [], isLoading } = useMaestros({ ...DEFAULT_MAESTRO_FILTERS, search: search.trim() })

  const filtered = workers.filter((w) => {
    if (activeFilter === 'Disponibles') return w.available
    if (activeFilter !== 'Todos') {
      return w.specialties.some((s) =>
        s.toLowerCase().includes(activeFilter.toLowerCase())
      )
    }
    return true
  })

  if (selectedWorker) {
    return (
      <WorkerProfileSubScreen
        worker={selectedWorker}
        onBack={() => setSelectedWorker(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-background" style={{ animation: 'zFadeSlideIn 0.25s ease' }}>
      <ZHeader title="Contratar Maestros" onBack={onBack} />

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-4 py-4">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface border border-outline-variant">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="flex-1 bg-transparent text-on-surface font-body text-sm placeholder:text-on-surface-variant focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="font-label text-xs text-on-surface-variant active:opacity-70"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Filter chips */}
        <FilterChips active={activeFilter} onChange={setActiveFilter} />

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onClear={() => { setSearch(''); setActiveFilter('Todos') }} />
        ) : (
          <div className="flex flex-col gap-3">
            <span className="font-label text-xs text-on-surface-variant px-1">
              {filtered.length} maestro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </span>
            {filtered.map((w) => (
              <WorkerCard key={w.user_id} worker={w} onTap={() => setSelectedWorker(w)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

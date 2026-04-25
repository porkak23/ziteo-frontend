import { useState } from 'react'
import { useLicitacionesAbiertas, usePostularse, type Licitacion } from '../hooks/useLicitaciones'
import { useAuthStore } from '../../auth/store/authStore'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { BOLIVIAN_CITIES } from '../../auth/constants/authConstants'

const SPECIALTIES = [
  'Albañilería',
  'Electricidad',
  'Plomería',
  'Carpintería',
  'Pintura',
  'Gasfitería',
  'Soldadura',
  'Otro',
]

function formatBudget(min: number | null, max: number | null): string {
  if (!min && !max) return 'A convenir'
  if (min && max) return `Bs. ${min.toLocaleString('es-BO')} – ${max.toLocaleString('es-BO')}`
  if (min) return `Desde Bs. ${min.toLocaleString('es-BO')}`
  return `Hasta Bs. ${max!.toLocaleString('es-BO')}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return new Date(dateStr).toLocaleDateString('es-BO')
}

function PostularseModal({
  licitacion,
  onClose,
  onConfirm,
  isPending,
}: {
  licitacion: Licitacion
  onClose: () => void
  onConfirm: (message: string, budget: string) => void
  isPending: boolean
}) {
  const [message, setMessage] = useState('')
  const [budget, setBudget] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-surface rounded-t-2xl border-t border-outline-variant px-4 pt-4 pb-8 flex flex-col gap-4 animate-[fadeSlideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>
        <div className="flex items-center justify-between">
          <h2 className="font-title text-base text-on-surface">Postularme a "{licitacion.title}"</h2>
          <button onClick={onClose} className="text-on-surface-variant p-1">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-label text-xs text-on-surface-variant">Mensaje (opcional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Preséntate y describe tu experiencia..."
              rows={3}
              className="bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none resize-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label text-xs text-on-surface-variant">Presupuesto propuesto (Bs.) — opcional</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0"
              min={0}
              className="bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none"
            />
          </div>
          <button
            onClick={() => onConfirm(message, budget)}
            disabled={isPending}
            className="w-full bg-primary text-on-primary rounded-2xl py-3 text-sm font-label font-semibold disabled:opacity-50 transition-opacity active:opacity-80"
          >
            {isPending ? 'Enviando...' : 'Confirmar postulación'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CITY_FILTERS = ['Todas las ciudades', ...BOLIVIAN_CITIES]
const SPECIALTY_FILTERS = ['Todas las especialidades', ...SPECIALTIES]

export function LicitacionFeed() {
  const user = useAuthStore((s) => s.user)
  const [filterCity, setFilterCity] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('')
  const [postulando, setPostulando] = useState<Licitacion | null>(null)

  const { data: licitaciones = [], isLoading } = useLicitacionesAbiertas(
    filterCity || filterSpecialty ? { city: filterCity || undefined, specialty: filterSpecialty || undefined } : undefined
  )
  const { mutate: postularse, isPending } = usePostularse()
  const { toasts, showToast, removeToast } = useToast()

  const handleConfirm = (message: string, budget: string) => {
    if (!postulando || !user?.user_id) return
    postularse(
      {
        licitacion_id: postulando.id,
        maestro_id: user.user_id,
        message: message.trim() || undefined,
        proposed_budget: budget ? parseFloat(budget) : undefined,
      },
      {
        onSuccess: () => {
          showToast('Postulación enviada correctamente', 'success')
          setPostulando(null)
        },
        onError: () => {
          showToast('Error al enviar la postulación', 'error')
        },
      }
    )
  }

  const pillBase = 'shrink-0 rounded-full px-3 py-1.5 text-[13px] font-label transition-colors'
  const pillInactive = `${pillBase} border border-outline-variant text-on-surface-variant`
  const pillActive = `${pillBase} bg-primary/10 border border-primary/30 text-primary font-semibold`

  return (
    <div className="flex flex-col gap-3">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Filtros — ciudad */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        {CITY_FILTERS.map((city) => {
          const value = city === 'Todas las ciudades' ? '' : city
          const isActive = filterCity === value
          return (
            <button
              key={city}
              onClick={() => setFilterCity(value)}
              className={isActive ? pillActive : pillInactive}
            >
              {city}
            </button>
          )
        })}
      </div>

      {/* Filtros — especialidad */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        {SPECIALTY_FILTERS.map((spec) => {
          const value = spec === 'Todas las especialidades' ? '' : spec
          const isActive = filterSpecialty === value
          return (
            <button
              key={spec}
              onClick={() => setFilterSpecialty(value)}
              className={isActive ? pillActive : pillInactive}
            >
              {spec}
            </button>
          )
        })}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-4 px-4">
        {isLoading ? (
          <>
            <div className="bg-surface-container animate-pulse rounded-2xl h-[140px]" />
            <div className="bg-surface-container animate-pulse rounded-2xl h-[140px]" />
            <div className="bg-surface-container animate-pulse rounded-2xl h-[140px]" />
          </>
        ) : licitaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">gavel</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">Sin licitaciones disponibles</p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">Vuelve más tarde o ajusta los filtros de ciudad y especialidad</p>
          </div>
        ) : (
          licitaciones.map((lic) => (
            <div key={lic.id} className="bg-surface rounded-2xl p-4 flex flex-col gap-3 border border-outline-variant/50">
              {/* Header: título + fecha */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="font-headline text-base text-on-surface line-clamp-1">{lic.title}</h3>
                  {lic.description && (
                    <p className="font-body text-xs text-on-surface-variant line-clamp-2 mt-0.5">{lic.description}</p>
                  )}
                </div>
                <span className="font-label text-xs text-on-surface-variant shrink-0 mt-0.5">{timeAgo(lic.created_at)}</span>
              </div>

              {/* Metadatos: ciudad, especialidad, presupuesto */}
              <div className="flex flex-wrap gap-2">
                {lic.city && (
                  <span className="flex items-center gap-1 text-xs text-on-surface-variant font-body">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {lic.city}
                  </span>
                )}
                {lic.specialty && (
                  <span className="flex items-center gap-1 text-xs text-on-surface-variant font-body">
                    <span className="material-symbols-outlined text-[14px]">build</span>
                    {lic.specialty}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-primary font-label font-semibold">
                  <span className="material-symbols-outlined text-[14px]">payments</span>
                  {formatBudget(lic.budget_min, lic.budget_max)}
                </span>
              </div>

              {/* Footer: avatar + CTA */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="font-label text-[13px] text-primary font-semibold">
                      {lic.constructor?.name?.charAt(0).toUpperCase() ?? 'C'}
                    </span>
                  </div>
                  <span className="font-body text-xs text-on-surface">{lic.constructor?.name ?? 'Constructor'}</span>
                </div>

                <button
                  disabled={lic._ya_postulado}
                  onClick={() => setPostulando(lic)}
                  className={`px-4 py-2 rounded-xl text-xs font-label font-semibold transition-opacity active:opacity-80 ${
                    lic._ya_postulado
                      ? 'bg-surface-container text-on-surface-variant cursor-default'
                      : 'bg-primary text-on-primary'
                  }`}
                >
                  {lic._ya_postulado ? 'Ya postulado ✓' : 'Postularme'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {postulando && (
        <PostularseModal
          licitacion={postulando}
          onClose={() => setPostulando(null)}
          onConfirm={handleConfirm}
          isPending={isPending}
        />
      )}
    </div>
  )
}

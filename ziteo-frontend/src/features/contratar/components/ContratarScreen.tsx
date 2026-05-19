import { useState, useEffect } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { BOLIVIAN_CITIES } from '../../auth/constants/authConstants'
import {
  useMaestros,
  useContratarMaestro,
  isMaestroProfileCompleto,
  ESPECIALIDADES_MAESTRO,
  DEFAULT_MAESTRO_FILTERS,
  type Maestro,
  type MaestroFilters,
} from '../hooks/useMaestros'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { ChatScreen } from '../../../shared/components/ChatScreen'
import { useProfileReviews } from '../../../shared/hooks/useReviews'
import { StarRating } from '../../../shared/components/StarRating'
import { ReviewCard } from '../../../shared/components/ReviewCard'

import { CityFilter } from '../../../shared/components/CityFilter'
import { useHabilidades } from '../../maestro/hooks/useHabilidades'
import { AdBanner } from '../../../shared/components/AdBanner'

function MaestroHabilidadesSection({ maestroId }: { maestroId: string }) {
  const [expanded, setExpanded] = useState(false)
  const { data: habilidades, isLoading, isError } = useHabilidades(maestroId)

  if (isLoading || isError || !habilidades || habilidades.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-outline-variant/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between text-xs font-label font-semibold text-primary"
      >
        <span>Habilidades ({habilidades.length})</span>
        <span className="font-label text-on-surface-variant">{expanded ? 'Ocultar' : 'Ver'}</span>
      </button>
      {expanded && (
        <div className="flex flex-col gap-2 mt-1">
          {habilidades.map((h) => (
            <div key={h.id} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-body text-on-surface">
                <span>{h.skill}</span>
                <span className="font-semibold text-primary">{h.porcentaje}%</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${h.porcentaje}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MaestroReviewSection({ maestroId }: { maestroId: string }) {
  const { data } = useProfileReviews(maestroId)
  const [expanded, setExpanded] = useState(false)

  if (!data || data.totalCount === 0) {
    return (
      <div className="flex items-center gap-1 text-on-surface-variant mt-2 pt-2 border-t border-outline-variant/50">
        <StarRating value={0} readonly size="sm" />
        <span className="text-xs font-body">(0 reseñas)</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-outline-variant/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-on-surface">
          <span className="font-label font-bold text-sm">{data.averageRating.toFixed(1)}</span>
          <StarRating value={data.averageRating} readonly size="sm" />
          <span className="text-xs font-body text-on-surface-variant">({data.totalCount} reseñas)</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-label text-primary font-semibold"
        >
          {expanded ? 'Ocultar' : 'Ver reseñas'}
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 mt-1 py-1">
          {data.reviews.map(r => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ContratoFormProps {
  maestro: Maestro
  constructorId: string
  onClose: () => void
}

function ContratoForm({ maestro, constructorId, onClose }: ContratoFormProps) {
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [city, setCity] = useState<string>(BOLIVIAN_CITIES[0])
  const [success, setSuccess] = useState(false)
  const { toasts, showToast, removeToast } = useToast()

  const { mutate: contratar, isPending } = useContratarMaestro()

  function handleSubmit() {
    if (!description.trim() || !budget) return

    contratar(
      {
        constructor_id: constructorId,
        maestro_id: maestro.user_id,
        description: description.trim(),
        budget: Number(budget),
        city: city,
      },
      {
        onSuccess: () => {
          showToast('Contrato enviado al maestro', 'success')
          setSuccess(true)
          setTimeout(() => {
            setSuccess(false)
            onClose()
          }, 2000)
        },
        onError: () => {
          showToast('Error al enviar el contrato', 'error')
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="h-14 flex items-center gap-3 px-4 border-b border-outline-variant flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-11 h-11 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Volver"
        >
          Volver
        </button>
        <h2 className="font-label font-semibold text-on-surface text-sm truncate flex-1">
          Contratar a {maestro.name}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {success ? (
          <div className="bg-primary-container text-on-primary-container rounded-2xl p-4 font-body text-sm text-center">
            Contrato enviado
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contract-desc" className="font-label text-xs text-on-surface-variant">
                Descripcion del trabajo
              </label>
              <textarea
                id="contract-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el trabajo que necesitas..."
                required
                className="min-h-24 bg-surface-container rounded-2xl p-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contract-budget" className="font-label text-xs text-on-surface-variant">
                Presupuesto (Bs.)
              </label>
              <input
                id="contract-budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ej. 2500"
                required
                className="bg-surface-container rounded-2xl px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contract-city" className="font-label text-xs text-on-surface-variant">Ciudad</label>
              <select
                id="contract-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-surface-container rounded-2xl px-4 py-3 font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                {BOLIVIAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !description.trim() || !budget}
              className="w-full bg-primary text-on-primary rounded-2xl py-3 font-label font-semibold text-sm transition-opacity disabled:opacity-60"
            >
              {isPending ? 'Enviando...' : 'Enviar contrato'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

interface ChatWith {
  userId: string
  name: string
}

interface ContratarScreenProps {
  onViewProfile?: (maestroId: string) => void
  initialHireMaestroId?: string | null
}

export function ContratarScreen({ onViewProfile, initialHireMaestroId }: ContratarScreenProps) {
  const user = useAuthStore((s) => s.user)
  const constructorId = user?.user_id ?? ''

  const [selectedMaestro, setSelectedMaestro] = useState<Maestro | null>(null)
  const [chatWith, setChatWith] = useState<ChatWith | null>(null)

  // Filters — city defaults to the constructor's city if known; others default
  const [filters, setFilters] = useState<MaestroFilters>({
    ...DEFAULT_MAESTRO_FILTERS,
    city: user?.city ?? '',
  })
  const [showAllCities, setShowAllCities] = useState(!user?.city)

  // Debounce search input
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: maestros, isLoading } = useMaestros(filters)

  // Auto-open ContratoForm if navigated from MaestroProfileScreen "Contratar"
  useEffect(() => {
    if (initialHireMaestroId && maestros && !selectedMaestro) {
      const found = maestros.find(m => m.user_id === initialHireMaestroId)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setSelectedMaestro(found)
    }
  }, [initialHireMaestroId, maestros, selectedMaestro])

  if (selectedMaestro) {
    return (
      <ContratoForm
        maestro={selectedMaestro}
        constructorId={constructorId}
        onClose={() => setSelectedMaestro(null)}
      />
    )
  }

  const handleCityFilter = (city: string) => {
    setFilters((prev) => ({ ...prev, city }))
    setShowAllCities(city === '')
  }

  return (
    <div className="flex flex-col h-full">
      {chatWith && (
        <ChatScreen
          otherUserId={chatWith.userId}
          otherUserName={chatWith.name}
          onClose={() => setChatWith(null)}
        />
      )}

      {/* Filter bar */}
      <div className="pt-4 flex-shrink-0 flex flex-col gap-3">
        <CityFilter value={filters.city} onChange={handleCityFilter} />

        {/* "Ver todas las ciudades" toggle */}
        {user?.city && (
          <div className="px-4 flex items-center gap-2">
            <button
              onClick={() => handleCityFilter(showAllCities ? (user.city ?? '') : '')}
              className={`text-xs font-label font-semibold px-3 py-1 rounded-full border transition-colors ${
                showAllCities
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant'
              }`}
            >
              {showAllCities ? 'Filtrando: todas las ciudades' : 'Ver todas las ciudades'}
            </button>
          </div>
        )}

        {/* Specialty filter */}
        <div className="px-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, specialty: '' }))}
            className={`flex-shrink-0 text-xs font-label font-semibold px-3 py-1 rounded-full border transition-colors ${
              filters.specialty === ''
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container text-on-surface-variant border-outline-variant'
            }`}
          >
            Todas
          </button>
          {ESPECIALIDADES_MAESTRO.map((esp) => (
            <button
              key={esp}
              onClick={() => setFilters((prev) => ({ ...prev, specialty: prev.specialty === esp ? '' : esp }))}
              className={`flex-shrink-0 text-xs font-label font-semibold px-3 py-1 rounded-full border transition-colors ${
                filters.specialty === esp
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant'
              }`}
            >
              {esp}
            </button>
          ))}
        </div>

        {/* Availability toggle + name search */}
        <div className="px-4 flex items-center gap-3 pb-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              role="switch"
              aria-checked={filters.onlyAvailable}
              onClick={() => setFilters((prev) => ({ ...prev, onlyAvailable: !prev.onlyAvailable }))}
              className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${
                filters.onlyAvailable ? 'bg-primary' : 'bg-surface-container'
              } border border-outline-variant`}
            >
              <span
                className={`absolute top-0.5 transition-all w-4 h-4 rounded-full bg-surface shadow-sm ${
                  filters.onlyAvailable ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </div>
            <span className="text-xs font-label text-on-surface-variant">Solo disponibles</span>
          </label>

          <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-full px-3 py-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre..."
              aria-label="Buscar maestros"
              className="flex-1 bg-transparent font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
        {isLoading && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-container rounded-2xl animate-pulse" />
            ))}
          </>
        )}

        {!isLoading && (!maestros || maestros.length === 0) && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">
              Sin maestros disponibles
            </p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">
              {filters.search
                ? 'Ningún resultado para esa búsqueda'
                : filters.specialty
                ? `No hay maestros de ${filters.specialty} en esta ciudad`
                : 'No hay maestros registrados con estos filtros todavía'}
            </p>
            {(filters.specialty || !filters.onlyAvailable) && (
              <button
                onClick={() => setFilters({ ...DEFAULT_MAESTRO_FILTERS, city: filters.city })}
                className="text-xs font-label text-primary font-semibold mt-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!isLoading && maestros && maestros.length > 0 && (
          <AdBanner variant="banner" className="mb-1" />
        )}

        {!isLoading &&
          maestros?.map((maestro) => {
            const initial = maestro.name?.charAt(0)?.toUpperCase() ?? '?'
            const profileCompleto = isMaestroProfileCompleto(maestro)

            return (
              <div
                key={maestro.user_id}
                className="flex flex-col bg-surface rounded-2xl p-3 border border-outline-variant"
              >
                <div className="flex items-start gap-3">
                  {maestro.avatar_url ? (
                    <img
                      src={maestro.avatar_url}
                      alt={maestro.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label font-semibold text-base flex-shrink-0">
                      {initial}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-label font-semibold text-on-surface text-sm truncate">
                        {maestro.name}
                      </span>
                      {!profileCompleto && (
                        <span className="text-xs font-label text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full flex-shrink-0">
                          Perfil incompleto
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <span className="text-xs font-body">{maestro.city}</span>
                    </div>

                    {profileCompleto ? (
                      <>
                        <div className="flex items-center gap-1 text-on-surface-variant mt-0.5">
                          <span className="text-xs font-body">
                            Bs. {maestro.rate_amount}/
                            {maestro.rate_type === 'per_day'
                              ? 'día'
                              : maestro.rate_type === 'per_hour'
                              ? 'hora'
                              : 'proyecto'}
                          </span>
                        </div>
                        {maestro.specialties.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            {maestro.specialties.slice(0, 3).map((sp) => (
                              <span
                                key={sp}
                                className="text-xs font-label bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full"
                              >
                                {sp}
                              </span>
                            ))}
                            {maestro.specialties.length > 3 && (
                              <span className="text-xs font-label text-on-surface-variant">
                                +{maestro.specialties.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs font-body text-on-surface-variant/60 mt-0.5">
                        Este maestro aún no completó su perfil
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/50">
                  {onViewProfile && (
                    <button
                      type="button"
                      onClick={() => onViewProfile(maestro.user_id)}
                      className="flex-1 bg-surface-container text-on-surface-variant rounded-2xl px-3 py-1.5 text-sm font-label font-semibold transition-opacity active:opacity-75 border border-outline-variant"
                    >
                      Ver perfil
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setChatWith({ userId: maestro.user_id, name: maestro.name })}
                    className="flex-1 bg-surface-container text-on-surface rounded-2xl px-3 py-1.5 text-sm font-label font-semibold transition-opacity active:opacity-75 border border-outline-variant"
                  >
                    Chatear
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMaestro(maestro)}
                    className="flex-1 bg-primary text-on-primary rounded-2xl px-3 py-1.5 text-sm font-label font-semibold transition-opacity active:opacity-75"
                  >
                    Contratar
                  </button>
                </div>

                <MaestroHabilidadesSection maestroId={maestro.user_id} />
                <MaestroReviewSection maestroId={maestro.user_id} />
              </div>
            )
          })}
      </div>
    </div>
  )
}

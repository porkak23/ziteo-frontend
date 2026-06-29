import { MapPicker } from '../../../shared/components/MapPicker'
import type { MapPickerValue } from '../../../shared/components/MapPicker'

export type DeliveryMethod = 'delivery' | 'pickup'

export interface ProjectLocation {
  id: string
  name: string
  location_lat: number | null
  location_lng: number | null
  location_address: string | null
}

interface DeliverySectionProps {
  method: DeliveryMethod
  onMethodChange: (method: DeliveryMethod) => void
  location: MapPickerValue | null
  onLocationChange: (loc: MapPickerValue) => void
  projects?: ProjectLocation[]
  originProjectId?: string | null
  onOriginProjectChange?: (projectId: string | null) => void
}

const METHODS: { key: DeliveryMethod; label: string; sub: string }[] = [
  { key: 'delivery', label: 'Envío a domicilio', sub: 'La app gestiona el transporte' },
  { key: 'pickup',   label: 'Recoger en tienda', sub: 'Retiras con tu vehículo' },
]

export function DeliverySection({
  method,
  onMethodChange,
  location,
  onLocationChange,
  projects,
  originProjectId,
  onOriginProjectChange,
}: DeliverySectionProps) {
  const projectsWithCoords = (projects ?? []).filter(
    (p) => p.location_lat != null && p.location_lng != null,
  )
  const showProjectPicker = method === 'delivery' && projectsWithCoords.length > 0

  function handleProjectSelect(projectId: string) {
    if (!projectId) {
      onOriginProjectChange?.(null)
      return
    }
    const p = projectsWithCoords.find((pr) => pr.id === projectId)
    if (!p || p.location_lat == null || p.location_lng == null) return
    onOriginProjectChange?.(p.id)
    onLocationChange({ lat: p.location_lat, lng: p.location_lng, address: p.location_address ?? '' })
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-label text-xs text-on-surface-variant">Método de entrega</p>

      <div className="grid grid-cols-2 gap-2">
        {METHODS.map((dm) => {
          const active = method === dm.key
          return (
            <button
              key={dm.key}
              type="button"
              onClick={() => onMethodChange(dm.key)}
              className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-outline'
              }`}
              aria-pressed={active}
            >
              <span className="font-label text-xs font-semibold leading-tight">{dm.label}</span>
              <span className="font-body text-[11px] leading-tight opacity-70">{dm.sub}</span>
            </button>
          )
        })}
      </div>

      {method === 'delivery' && (
        <>
          {showProjectPicker && (
            <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-3 py-2">
              <span className="material-symbols-outlined text-base text-on-surface-variant shrink-0">
                location_on
              </span>
              <select
                className="flex-1 bg-transparent font-body text-xs text-on-surface outline-none cursor-pointer"
                value={originProjectId ?? ''}
                onChange={(e) => handleProjectSelect(e.target.value)}
                aria-label="Cargar ubicación de un proyecto"
              >
                <option value="">Cargar desde un terreno / proyecto…</option>
                {projectsWithCoords.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.location_address ? ` — ${p.location_address}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <MapPicker
            label="Dirección de entrega"
            value={location}
            onChange={onLocationChange}
            placeholder="¿A dónde enviamos tu pedido?"
            height={180}
          />
        </>
      )}
    </div>
  )
}

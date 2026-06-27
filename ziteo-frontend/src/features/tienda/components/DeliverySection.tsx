import { MapPicker } from '../../../shared/components/MapPicker'
import type { MapPickerValue } from '../../../shared/components/MapPicker'

export type DeliveryMethod = 'delivery' | 'pickup'

interface DeliverySectionProps {
  method: DeliveryMethod
  onMethodChange: (method: DeliveryMethod) => void
  location: MapPickerValue | null
  onLocationChange: (loc: MapPickerValue) => void
}

const METHODS: { key: DeliveryMethod; label: string; sub: string }[] = [
  { key: 'delivery', label: 'Envío a domicilio', sub: 'La app gestiona el transporte' },
  { key: 'pickup',   label: 'Recoger en tienda', sub: 'Retiras con tu vehículo' },
]

export function DeliverySection({ method, onMethodChange, location, onLocationChange }: DeliverySectionProps) {
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
              <span className="font-label text-xs font-semibold leading-tight">
                {dm.label}
              </span>
              <span className="font-body text-[11px] leading-tight opacity-70">
                {dm.sub}
              </span>
            </button>
          )
        })}
      </div>

      {method === 'delivery' && (
        <MapPicker
          label="Dirección de entrega"
          value={location}
          onChange={onLocationChange}
          placeholder="¿A dónde enviamos tu pedido?"
          height={180}
        />
      )}
    </div>
  )
}

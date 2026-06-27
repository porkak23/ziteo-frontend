import type { CargoType } from '../hooks/useCart'

const CARGO_LABELS: Record<CargoType, string> = {
  light: 'Carga ligera · Moto',
  heavy: 'Carga pesada · Camión',
}

const CARGO_ICONS: Record<CargoType, string> = {
  light: 'two_wheeler',
  heavy: 'local_shipping',
}

interface CargoSelectorProps {
  value: CargoType | null
  detected: CargoType | null
  hasWeight: boolean
  onChange: (type: CargoType) => void
}

export function CargoSelector({ value, detected, hasWeight, onChange }: CargoSelectorProps) {
  const effective = value ?? detected

  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-label text-xs text-on-surface-variant">
        Tipo de entrega
        {hasWeight && detected !== null && (
          <span className="ml-1 text-on-surface-variant/60">(detectado automáticamente)</span>
        )}
        {!hasWeight && (
          <span className="ml-1 text-on-surface-variant/60">(selecciona manualmente)</span>
        )}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(['light', 'heavy'] as CargoType[]).map((type) => {
          const isActive = effective === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-outline'
              }`}
              aria-pressed={isActive}
              aria-label={CARGO_LABELS[type]}
            >
              <span
                className="material-symbols-outlined text-[18px] leading-none shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {CARGO_ICONS[type]}
              </span>
              <span className="font-label text-xs font-medium leading-tight">
                {CARGO_LABELS[type]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

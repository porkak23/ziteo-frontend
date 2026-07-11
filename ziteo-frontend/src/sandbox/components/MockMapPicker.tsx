import { Z } from '@/shared/design/tokens'
import type { MapPickerValue } from '@/shared/components/MapPicker'
import { MockMapCanvas } from './MockMap'
import { STORE, SITE, DRIVER_START } from '@/sandbox/fixtures/coords'

interface MockMapPickerProps {
  value?: MapPickerValue | null
  onChange: (value: MapPickerValue) => void
  label?: string
  height?: number
}

const OPTIONS: { key: string; label: string; point: MapPickerValue; kind: 'store' | 'site' }[] = [
  { key: 'store', label: 'Tienda (recogida)', point: { ...STORE }, kind: 'store' },
  { key: 'site', label: 'Obra (entrega)', point: { ...SITE, address: SITE.address }, kind: 'site' },
  {
    key: 'other',
    label: 'Otro punto de prueba',
    point: { lat: DRIVER_START.lat, lng: DRIVER_START.lng, address: '[SIM] Punto de referencia — Santa Cruz' },
    kind: 'site',
  },
]

export function MockMapPicker({ value, onChange, label, height = 280 }: MockMapPickerProps) {
  const markers = value
    ? [{ point: { lat: value.lat, lng: value.lng }, label: 'Seleccionado', kind: 'driver' as const }]
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: Z.textSec, fontFamily: Z.font }}>{label}</label>
      )}
      <MockMapCanvas markers={markers} height={height} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.point)}
            style={{
              padding: '8px 12px',
              borderRadius: Z.r.sm,
              border: `1px solid ${Z.border}`,
              background: value?.address === opt.point.address ? Z.orangePastel : Z.surface,
              color: Z.text,
              fontSize: 13,
              fontFamily: Z.font,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value?.address && (
        <p style={{ fontSize: 12, color: Z.textMuted, fontFamily: Z.font, margin: 0 }}>{value.address}</p>
      )}
    </div>
  )
}

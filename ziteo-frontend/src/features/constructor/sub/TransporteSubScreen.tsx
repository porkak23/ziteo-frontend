import { useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { ZHeader } from '@/shared/design/components/ZHeader'
import { ZButton } from '@/shared/design/components/ZButton'
import { ZIcon } from '@/shared/design/components/ZIcon'

function IconTruck({ color = Z.textSec, size = 28 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="5" width="14" height="12" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M15 9h4l3 4v4h-7V9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <circle cx="6" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="19" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  )
}

function IconVan({ color = Z.textSec, size = 28 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="8" width="13" height="9" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="6" cy="18" r="2" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="18" cy="18" r="2" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M15 11h3l3 3v3h-6" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  )
}

interface Props {
  onBack: () => void
}

const TRANSPORT_OPTIONS = [
  {
    key: 'pesado',
    title: 'Transporte Pesado',
    desc: 'Camiones, volquetas',
    Icon: IconTruck,
  },
  {
    key: 'ligero',
    title: 'Transporte Ligero',
    desc: 'Motos, camionetas',
    Icon: IconVan,
  },
] as const

type TransportKey = 'pesado' | 'ligero' | ''

export function TransporteSubScreen({ onBack }: Props) {
  const [type, setType] = useState<TransportKey>('')
  const [desc, setDesc] = useState('')

  const canSubmit = type !== '' && desc.trim() !== ''

  function handleSubmit() {
    if (!canSubmit) return
    // TODO: submit to backend
    onBack()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'zFadeSlideIn 0.25s ease' }}>
      <ZHeader title="Solicitar Transporte" onBack={onBack} />
      <div style={{
        flex: 1, padding: '8px 20px 24px', display: 'flex', flexDirection: 'column',
        gap: 20, overflowY: 'auto',
      }}>
        <div>
          <h3 style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.text, margin: 0 }}>
            Tipo de transporte
          </h3>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>
            Selecciona según tu carga
          </p>
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TRANSPORT_OPTIONS.map(({ key, title, desc: subtitle, Icon }) => {
            const selected = type === key
            return (
              <button
                key={key}
                onClick={() => setType(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                  borderRadius: Z.r.md,
                  border: `2px solid ${selected ? Z.orange : Z.border}`,
                  background: selected ? Z.orangeLight : Z.surface,
                  cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Icon color={selected ? Z.orangeDark : Z.textSec} size={28} />
                <div>
                  <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{title}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>{subtitle}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Map placeholder */}
        <div>
          <label style={{
            fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec,
            display: 'block', marginBottom: 8,
          }}>
            Ubicación de entrega
          </label>
          <div style={{
            height: 140, borderRadius: Z.r.md, border: `1.5px dashed ${Z.border}`,
            background: `linear-gradient(135deg, ${Z.blueLight} 0%, ${Z.divider} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8,
          }}>
            <ZIcon name="map-pin" size={28} color={Z.blue} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: Z.textMuted }}>mapa interactivo</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{
            fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec,
            display: 'block', marginBottom: 8,
          }}>
            Descripción de la carga *
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ej: 100 bolsas de cemento IP-30, peso aprox. 5000kg"
            style={{
              width: '100%', height: 80, borderRadius: Z.r.sm,
              border: `1.5px solid ${Z.border}`, background: Z.surface,
              padding: 14, fontFamily: Z.font, fontSize: 14, color: Z.text,
              resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <ZButton disabled={!canSubmit} onClick={handleSubmit}>
          Solicitar Transporte
        </ZButton>
      </div>
    </div>
  )
}

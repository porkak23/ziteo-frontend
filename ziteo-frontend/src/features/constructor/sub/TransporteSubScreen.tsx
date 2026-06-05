import { useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { ZHeader } from '@/shared/design/components/ZHeader'
import { ZButton } from '@/shared/design/components/ZButton'
import { ZSelect } from '@/shared/design/components/ZSelect'
import { MapPicker, type MapPickerValue } from '@/shared/components/MapPicker'
import { Toast } from '@/shared/components/Toast'
import { useToast } from '@/shared/hooks/useToast'
import { useAuthStore } from '../../auth/store/authStore'
import { useProyectos } from '../../proyectos/hooks/useProyectos'
import { useCreateTransportRequest } from '../../transporte/hooks/useTransportRequests'

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
  { key: 'pesado', title: 'Transporte Pesado', desc: 'Camiones, volquetas', Icon: IconTruck },
  { key: 'ligero', title: 'Transporte Ligero', desc: 'Motos, camionetas', Icon: IconVan },
] as const

type TransportKey = 'pesado' | 'ligero' | ''
type DestMode = 'proyecto' | 'otra'

export function TransporteSubScreen({ onBack }: Props) {
  const user = useAuthStore((s) => s.user)
  const { toasts, showToast, removeToast } = useToast()
  const { data: proyectos = [] } = useProyectos({ constructor_id: user?.user_id })
  const { mutate: createRequest, isPending } = useCreateTransportRequest()

  const [type, setType] = useState<TransportKey>('')
  const [desc, setDesc] = useState('')
  const [pickup, setPickup] = useState<MapPickerValue | null>(null)
  const [destMode, setDestMode] = useState<DestMode>('proyecto')
  const [projectId, setProjectId] = useState('')
  const [dropoff, setDropoff] = useState<MapPickerValue | null>(null)

  const selectedProject = proyectos.find((p) => p.id === projectId)

  // Dirección/coords de destino según el modo
  const dropoffAddress =
    destMode === 'proyecto'
      ? selectedProject?.location_address ?? selectedProject?.city ?? ''
      : dropoff?.address ?? ''
  const dropoffLat = destMode === 'proyecto' ? selectedProject?.location_lat ?? null : dropoff?.lat || null
  const dropoffLng = destMode === 'proyecto' ? selectedProject?.location_lng ?? null : dropoff?.lng || null

  const destReady = destMode === 'proyecto' ? !!selectedProject : !!dropoffAddress
  const canSubmit = type !== '' && desc.trim() !== '' && destReady

  function handleSubmit() {
    if (!canSubmit) return
    createRequest(
      {
        cargo_type: type === 'pesado' ? 'heavy' : 'light',
        pickup_address: pickup?.address ?? '',
        dropoff_address: dropoffAddress,
        pickup_lat: pickup?.lat || null,
        pickup_lng: pickup?.lng || null,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        description: desc.trim(),
        city: selectedProject?.city ?? user?.city ?? undefined,
      },
      {
        onSuccess: () => {
          showToast('Solicitud de transporte enviada', 'success')
          setTimeout(onBack, 800)
        },
        onError: (err) => {
          showToast(err instanceof Error ? err.message : 'Error al solicitar transporte', 'error')
        },
      }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'zFadeSlideIn 0.25s ease' }}>
      <Toast toasts={toasts} onRemove={removeToast} />
      <ZHeader title="Solicitar Transporte" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
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

        {/* Punto de recojo */}
        <MapPicker
          label="Punto de recojo (origen)"
          value={pickup}
          onChange={setPickup}
          placeholder="¿Dónde se recoge la carga?"
          height={200}
        />

        {/* Destino: proyecto registrado o dirección por mapa */}
        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 8 }}>
            Destino de la entrega
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {([
              { key: 'proyecto' as const, label: 'Un proyecto' },
              { key: 'otra' as const, label: 'Otra ubicación' },
            ]).map((opt) => {
              const active = destMode === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setDestMode(opt.key)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: Z.r.sm,
                    border: `1.5px solid ${active ? Z.orange : Z.border}`,
                    background: active ? Z.orangeLight : Z.surface,
                    color: active ? Z.orangeDark : Z.textSec,
                    fontFamily: Z.font, fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {destMode === 'proyecto' ? (
            proyectos.length > 0 ? (
              <ZSelect
                label=""
                value={projectId}
                onChange={setProjectId}
                placeholder="Selecciona un proyecto"
                options={proyectos.map((p) => ({ value: p.id, label: p.name }))}
              />
            ) : (
              <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted, margin: 0 }}>
                No tienes proyectos registrados. Usa "Otra ubicación".
              </p>
            )
          ) : (
            <MapPicker
              value={dropoff}
              onChange={setDropoff}
              placeholder="Dirección de entrega"
              height={200}
            />
          )}
        </div>

        {/* Description */}
        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 8 }}>
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

        <ZButton disabled={!canSubmit || isPending} onClick={handleSubmit}>
          {isPending ? 'Enviando...' : 'Solicitar Transporte'}
        </ZButton>
      </div>
    </div>
  )
}

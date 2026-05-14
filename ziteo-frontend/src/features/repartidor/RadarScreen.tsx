import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Z } from '@/shared/design/tokens'
import { SummaryCard } from '@/shared/design/shell/SummaryCard'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { ZButton } from '@/shared/design/components/ZButton'
import { ZIcon } from '@/shared/design/components/ZIcon'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type RadarMode = 'offline' | 'online' | 'active'
type VehicleType = 'heavy' | 'light'

const DRIVER_POS: [number, number] = [-17.7833, -63.1821]

interface MapJob {
  id: number
  lat: number
  lng: number
  type: VehicleType
  title: string
  from: string
  to: string
  dist: string
  weight: string
  pay: number
  time: string
}

const MAP_JOBS: MapJob[] = [
  { id: 1, lat: -17.770, lng: -63.195, type: 'heavy', title: '100 bolsas Cemento',    from: 'Ferretería San José',  to: 'Zona Norte',    dist: '4.5 km', weight: '5,000 kg', pay: 150, time: '35 min' },
  { id: 2, lat: -17.800, lng: -63.168, type: 'heavy', title: 'Arena Fina 2m³',        from: 'Cantera Sur',          to: 'Los Pinos',     dist: '8.2 km', weight: '3,000 kg', pay: 200, time: '50 min' },
  { id: 3, lat: -17.776, lng: -63.175, type: 'light', title: 'Herramientas Express',  from: 'Ferretería Central',   to: 'Zona Este',     dist: '1.8 km', weight: '15 kg',    pay: 45,  time: '12 min' },
  { id: 4, lat: -17.762, lng: -63.160, type: 'heavy', title: '20 barras Fierro 12mm', from: 'Distribuidora Norte',  to: 'Edificio Sur',  dist: '6.0 km', weight: '200 kg',   pay: 120, time: '40 min' },
]

const TRIP_HISTORY = [
  { id: 1, title: '50 bolsas Cemento',    from: 'Ferretería San José', to: 'Zona Norte', pay: 80,  date: 'Hoy 09:30', km: 4.5 },
  { id: 2, title: 'Herramientas Express', from: 'Central',             to: 'Zona Este',  pay: 45,  date: 'Hoy 08:00', km: 1.8 },
]

// height of: bottom(24) + nav(58) = 82px
const NAV_CLEARANCE = 82

function makeJobIcon(type: VehicleType) {
  const color = type === 'heavy' ? Z.orange : Z.blue
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-size:13px">${type === 'heavy' ? '🏗' : '⚡'}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

const driverIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${Z.orangeDark};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const destIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#16A34A;border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,0.25)">E</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function MapInvalidateSize({ mode }: { mode: RadarMode }) {
  const map = useMap()
  const prevMode = useRef<RadarMode>(mode)
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  useEffect(() => {
    if (prevMode.current !== mode) {
      prevMode.current = mode
      // wait for CSS transition to finish then re-validate
      const t = setTimeout(() => map.invalidateSize(), 420)
      return () => clearTimeout(t)
    }
  }, [map, mode])
  return null
}

function TruckIcon({ color = Z.textMuted, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="5" width="14" height="12" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M15 9h4l3 4v4h-7V9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <circle cx="6" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="19" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  )
}

function MsgIcon({ color = '#fff', size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function ChevronIcon({ up = false, color = Z.textMuted, size = 18 }: { up?: boolean; color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: up ? 'rotate(180deg)' : undefined, transition: 'transform 0.25s' }}>
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MapLayer({
  mode,
  visibleJobs,
  activeJob,
  onJobClick,
}: {
  mode: RadarMode
  visibleJobs: MapJob[]
  activeJob: MapJob | null
  onJobClick: (job: MapJob) => void
}) {
  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={DRIVER_POS} icon={driverIcon} />
      {mode !== 'offline' && visibleJobs.map(job => (
        <Marker
          key={job.id}
          position={[job.lat, job.lng]}
          icon={makeJobIcon(job.type)}
          eventHandlers={{ click: () => onJobClick(job) }}
        >
          <Circle
            center={[job.lat, job.lng]}
            radius={350}
            pathOptions={{ color: job.type === 'heavy' ? Z.orange : Z.blue, fillOpacity: 0.08, weight: 0 }}
          />
        </Marker>
      ))}
      {mode === 'active' && activeJob && (
        <Marker
          position={[activeJob.lat + 0.008, activeJob.lng + 0.009]}
          icon={destIcon}
        />
      )}
    </>
  )
}

export interface JobAlert {
  title: string
  pay: number
  dist: string
  type: VehicleType
}

export function RadarScreen({ onNewJobOffer }: { onNewJobOffer?: (a: JobAlert) => void }) {
  const [mode, setMode] = useState<RadarMode>('offline')
  const [vehicleType, setVehicleType] = useState<VehicleType>('heavy')
  const [selectedJob, setSelectedJob] = useState<MapJob | null>(null)
  const [activeJob, setActiveJob] = useState<MapJob | null>(null)
  const [deliveryStep, setDeliveryStep] = useState(0)
  const [showOfferPop, setShowOfferPop] = useState(false)
  const [sheetCollapsed, setSheetCollapsed] = useState(false)

  useEffect(() => {
    if (mode === 'online') {
      const t = setTimeout(() => {
        setShowOfferPop(true)
        const offer = MAP_JOBS[0]
        onNewJobOffer?.({ title: offer.title, pay: offer.pay, dist: offer.dist, type: offer.type })
      }, 2500)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowOfferPop(false)
    return undefined
  }, [mode, onNewJobOffer])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSheetCollapsed(false) }, [mode])

  const visibleJobs = MAP_JOBS.filter(j => j.type === vehicleType)
  const currentOffer = selectedJob ?? MAP_JOBS[0]

  const handleGoOnline = () => { setMode('online'); setActiveJob(null); setDeliveryStep(0) }
  const handleAccept = (job: MapJob) => {
    setSelectedJob(null)
    setShowOfferPop(false)
    setActiveJob(job)
    setMode('active')
  }

  const isFullscreen = mode !== 'offline'
  const sheetContentHeight = mode === 'active' ? 280 : 220
  const sheetHeight = sheetCollapsed ? 44 : sheetContentHeight

  const floatingControls = (
    <div style={{
      position: 'absolute', top: 10, left: 10, right: 10, zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', pointerEvents: 'auto' }}>
        {([{ key: 'heavy' as const, label: '🚛 Camión' }, { key: 'light' as const, label: '🏍 Moto' }]).map(v => (
          <button key={v.key} onClick={() => setVehicleType(v.key)} style={{
            padding: '7px 12px', border: 'none', cursor: 'pointer', outline: 'none',
            background: vehicleType === v.key ? Z.orangeDark : 'rgba(255,255,255,0.95)',
            color: vehicleType === v.key ? '#fff' : Z.text,
            fontFamily: Z.font, fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
          }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
        <span style={{
          fontFamily: Z.font, fontSize: 10, fontWeight: 700,
          color: isFullscreen ? Z.orangeDark : Z.textMuted,
          padding: '4px 10px', borderRadius: 20,
          background: isFullscreen ? Z.orangeLight : 'rgba(255,255,255,0.95)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          {isFullscreen ? '● EN LÍNEA' : '○ OFFLINE'}
        </span>
        <div
          onClick={() => mode === 'offline' ? handleGoOnline() : setMode('offline')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && (mode === 'offline' ? handleGoOnline() : setMode('offline'))}
          aria-label={isFullscreen ? 'Desconectarse' : 'Conectarse'}
          style={{
            width: 50, height: 28, borderRadius: 14, padding: 2, cursor: 'pointer',
            background: isFullscreen ? Z.orange : Z.border, transition: 'background 0.3s',
            display: 'flex', alignItems: 'center',
            boxShadow: isFullscreen ? '0 2px 10px rgba(232,115,58,0.4)' : '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s',
            transform: isFullscreen ? 'translateX(22px)' : 'translateX(0)',
          }} />
        </div>
      </div>
    </div>
  )

  return (
    // overflow:hidden so the offline panel sliding down doesn't create a scrollbar
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>

      {/* ── Map — always fullscreen, behind all panels ───────────────────── */}
      <div style={{ position: 'absolute', inset: 0, isolation: 'isolate' }}>
        <MapContainer
          center={DRIVER_POS}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <MapInvalidateSize mode={mode} />
          <MapLayer mode={mode} visibleJobs={visibleJobs} activeJob={activeJob} onJobClick={setSelectedJob} />
        </MapContainer>
        {floatingControls}
      </div>

      {/* ── Offline info panel — slides down off-screen when going online ── */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        top: '42vh',
        bottom: NAV_CLEARANCE,
        background: Z.bg,
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        zIndex: 10,
        overflowY: 'auto',
        transform: mode === 'offline' ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
        // keep it in the DOM so tap on "ACTIVAR RADAR" transition is smooth
      }}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
          <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.textMuted }}>
            Estás fuera de línea
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <SummaryCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={Z.orange} strokeWidth="2" fill="none" /></svg>}
              label="Ganancias hoy" value="Bs 125" color={Z.orange}
            />
            <SummaryCard
              icon={<TruckIcon color={Z.blue} size={16} />}
              label="Viajes hoy" value="2" color={Z.blue}
            />
            <SummaryCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M3 12l2-2 4 4 4-4 4 4 4-4" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" fill="none" /></svg>}
              label="Km recorridos" value="6.3" color={Z.orange}
            />
          </div>
          <button
            onClick={handleGoOnline}
            style={{
              padding: '16px', borderRadius: Z.r.lg, border: 'none', cursor: 'pointer',
              background: Z.gradOrange, color: '#fff', outline: 'none',
              fontFamily: Z.font, fontSize: 16, fontWeight: 800, letterSpacing: 1,
              boxShadow: '0 4px 20px rgba(164,55,0,0.3)',
            }}
          >
            ACTIVAR RADAR
          </button>
          <div>
            <SectionTitle title="Últimos Viajes" />
            <div style={{ marginTop: 8 }}>
              {TRIP_HISTORY.map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', borderBottom: `1px solid ${Z.divider}`,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: Z.orange, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>{t.title}</div>
                    <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, marginTop: 2 }}>
                      {t.from} → {t.to} · {t.km}km
                    </div>
                  </div>
                  <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, whiteSpace: 'nowrap' }}>
                    Bs {t.pay}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Online / Active bottom sheet ─────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: NAV_CLEARANCE,
        left: 0,
        right: 0,
        height: sheetHeight,
        transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s, transform 0.3s',
        opacity: isFullscreen ? 1 : 0,
        transform: isFullscreen ? 'translateY(0)' : 'translateY(100%)',
        background: Z.surface,
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: isFullscreen ? 'auto' : 'none',
      }}>
        <button
          onClick={() => setSheetCollapsed(c => !c)}
          style={{
            width: '100%', padding: '10px 16px 8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}
          aria-label={sheetCollapsed ? 'Expandir panel' : 'Colapsar panel'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: Z.border, margin: '0 auto' }} />
            <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>
              {mode === 'online'
                ? `${visibleJobs.length} solicitudes disponibles`
                : activeJob?.title ?? 'Entrega activa'
              }
            </span>
          </div>
          <ChevronIcon up={!sheetCollapsed} color={Z.textMuted} size={18} />
        </button>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 12px' }}>
          {mode === 'online' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                    borderRadius: Z.r.md, background: Z.bg, border: `1px solid ${Z.border}`,
                    cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: job.type === 'heavy' ? Z.orangeLight : Z.blueLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    {job.type === 'heavy' ? '🏗' : '⚡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{job.title}</div>
                    <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 2 }}>
                      {job.from} → {job.to}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                      <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>📍 {job.dist}</span>
                      <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>⏱ {job.time}</span>
                      <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>⚖ {job.weight}</span>
                    </div>
                  </div>
                  <span style={{ fontFamily: Z.font, fontSize: 17, fontWeight: 800, color: Z.orangeDark, flexShrink: 0 }}>
                    Bs {job.pay}
                  </span>
                </button>
              ))}
            </div>
          )}

          {mode === 'active' && activeJob && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{
                  fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '4px 10px',
                  borderRadius: 20, background: Z.orangeLight, color: Z.orangeDark,
                }}>
                  EN CAMINO
                </span>
              </div>
              {[
                { label: 'Recoger carga',          sub: activeJob.from },
                { label: 'En camino',               sub: `${activeJob.dist} · ${activeJob.time}` },
                { label: 'Entregar y escanear QR',  sub: activeJob.to },
              ].map((step, i) => {
                const done = deliveryStep > i
                const current = i === deliveryStep
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: done ? Z.orange : current ? Z.orangeLight : Z.divider,
                        border: `2px solid ${done ? Z.orange : current ? Z.orange : Z.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {done
                          ? <ZIcon name="check" size={14} color="#fff" />
                          : <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 800, color: current ? Z.orangeDark : Z.textMuted }}>{i + 1}</span>
                        }
                      </div>
                      {i < 2 && <div style={{ width: 2, height: 20, background: done ? Z.orange : Z.divider, margin: '4px 0' }} />}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: current ? Z.text : Z.textMuted }}>
                        {step.label}
                      </div>
                      <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, marginTop: 2 }}>
                        {step.sub}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <ZButton
                  onClick={() => {
                    if (deliveryStep < 2) {
                      setDeliveryStep(s => s + 1)
                    } else {
                      setMode('online')
                      setActiveJob(null)
                      setDeliveryStep(0)
                    }
                  }}
                >
                  {deliveryStep === 0 ? 'Carga recogida ✓' : deliveryStep === 1 ? 'Escanear QR de Entrega' : 'Finalizar Entrega'}
                </ZButton>
                <button style={{
                  width: 48, height: 48, borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                  background: Z.bg, cursor: 'pointer', outline: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }} aria-label="Chat">
                  <MsgIcon color={Z.blue} size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Job offer modal ───────────────────────────────────────────────── */}
      {(selectedJob !== null || showOfferPop) && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 20,
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{
            background: Z.surface, borderRadius: '20px 20px 0 0', padding: '20px',
            width: '100%', paddingBottom: NAV_CLEARANCE + 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 28 }}>{currentOffer.type === 'heavy' ? '🏗' : '⚡'}</div>
              <div>
                <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>
                  {currentOffer.title}
                </div>
                <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>
                  {currentOffer.from} → {currentOffer.to}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontFamily: Z.font, fontSize: 24, fontWeight: 800, color: Z.orangeDark }}>
                  Bs {currentOffer.pay}
                </div>
                <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>{currentOffer.time}</div>
              </div>
            </div>
            <div style={{
              display: 'flex', gap: 14, padding: '12px', borderRadius: Z.r.md,
              background: Z.bg, marginBottom: 16,
            }}>
              <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec }}>
                📍 {currentOffer.dist}
              </div>
              <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec }}>
                ⚖ {currentOffer.weight}
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.blue }}>
                ✓ Apto para tu vehículo
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <ZButton
                variant="secondary"
                style={{ flex: 1 }}
                onClick={() => { setSelectedJob(null); setShowOfferPop(false) }}
              >
                Rechazar
              </ZButton>
              <ZButton style={{ flex: 2 }} onClick={() => handleAccept(currentOffer)}>
                Aceptar Entrega
              </ZButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

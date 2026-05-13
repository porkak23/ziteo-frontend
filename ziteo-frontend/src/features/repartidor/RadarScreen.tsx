import { useState, useEffect } from 'react'
import { Z } from '@/shared/design/tokens'
import { SummaryCard } from '@/shared/design/shell/SummaryCard'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { ZButton } from '@/shared/design/components/ZButton'
import { ZIcon } from '@/shared/design/components/ZIcon'

type RadarMode = 'offline' | 'online' | 'active'
type VehicleType = 'heavy' | 'light'

interface MapJob {
  id: number
  x: number
  y: number
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
  { id: 1, x: 110, y: 90, type: 'heavy', title: '100 bolsas Cemento', from: 'Ferretería San José', to: 'Zona Norte', dist: '4.5 km', weight: '5,000 kg', pay: 150, time: '35 min' },
  { id: 2, x: 300, y: 230, type: 'heavy', title: 'Arena Fina 2m³', from: 'Cantera Sur', to: 'Los Pinos', dist: '8.2 km', weight: '3,000 kg', pay: 200, time: '50 min' },
  { id: 3, x: 70, y: 270, type: 'light', title: 'Herramientas Express', from: 'Ferretería Central', to: 'Zona Este', dist: '1.8 km', weight: '15 kg', pay: 45, time: '12 min' },
  { id: 4, x: 320, y: 100, type: 'heavy', title: '20 barras Fierro 12mm', from: 'Distribuidora Norte', to: 'Edificio Sur', dist: '6.0 km', weight: '200 kg', pay: 120, time: '40 min' },
]

const TRIP_HISTORY = [
  { id: 1, title: '50 bolsas Cemento', from: 'Ferretería San José', to: 'Zona Norte', pay: 80, date: 'Hoy 09:30', km: 4.5 },
  { id: 2, title: 'Herramientas Express', from: 'Central', to: 'Zona Este', pay: 45, date: 'Hoy 08:00', km: 1.8 },
]

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

function FakeMap({ mode, vehicleType, jobs, activeJob }: {
  mode: RadarMode
  vehicleType: VehicleType
  jobs: MapJob[]
  activeJob: { from: [number, number]; to: [number, number] } | null
}) {
  const isOffline = mode === 'offline'
  const w = 402
  const h = 370

  const roadMain = isOffline ? '#D0D0D0' : '#E8EDF2'
  const roadSec = isOffline ? '#E0E0E0' : '#F1F4F7'
  const blockBg = isOffline ? '#EFEFEF' : '#F8F6F2'
  const blockAlt = isOffline ? '#E8E8E8' : '#F2F0EC'

  const blocks: [number, number, number, number][] = [
    [8,8,74,54],[90,8,74,54],[172,8,74,54],[254,8,74,54],[336,8,58,54],
    [8,70,74,54],[90,70,74,54],[172,70,74,54],[254,70,74,54],[336,70,58,54],
    [8,132,74,54],[90,132,74,54],[172,132,74,54],[254,132,74,54],[336,132,58,54],
    [8,194,74,54],[90,194,74,54],[172,194,74,54],[254,194,74,54],[336,194,58,54],
    [8,256,74,54],[90,256,74,54],[172,256,74,54],[254,256,74,54],[336,256,58,54],
    [8,318,74,44],[90,318,74,44],[172,318,74,44],[254,318,74,44],[336,318,58,44],
  ]

  return (
    <div style={{
      position: 'relative', width: '100%', height: h, overflow: 'hidden',
      transition: 'filter 0.5s', filter: isOffline ? 'grayscale(0.85)' : 'none',
      flexShrink: 0,
    }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0 }}
        preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="rHeat1" cx="50%" cy="50%"><stop offset="0%" stopColor="#E8733A" stopOpacity="0.28"/><stop offset="100%" stopColor="#E8733A" stopOpacity="0"/></radialGradient>
          <radialGradient id="rHeat2" cx="50%" cy="50%"><stop offset="0%" stopColor="#E8733A" stopOpacity="0.18"/><stop offset="100%" stopColor="#E8733A" stopOpacity="0"/></radialGradient>
          <radialGradient id="rHeat3" cx="50%" cy="50%"><stop offset="0%" stopColor="#3A7BD5" stopOpacity="0.12"/><stop offset="100%" stopColor="#3A7BD5" stopOpacity="0"/></radialGradient>
        </defs>
        <rect width={w} height={h} fill={blockBg} />
        {blocks.map(([x, y, bw, bh], i) => (
          <rect key={i} x={x} y={y} width={bw} height={bh} rx="3" fill={i % 3 === 0 ? blockAlt : blockBg} />
        ))}
        {[64, 126, 188, 250, 312].map(y => <rect key={y} x="0" y={y} width={w} height="8" fill={roadMain} />)}
        {[82, 164, 246, 328].map(x => <rect key={x} x={x} y="0" width="10" height={h} fill={roadMain} />)}
        {[64, 126, 188, 250, 312].map(y => <rect key={'sh'+y} x="0" y={y+4} width={w} height="1" fill={roadSec} />)}
        <line x1="0" y1={h} x2={w * 0.6} y2="0" stroke={roadMain} strokeWidth="8" />
        <circle cx="246" cy="188" r="20" fill={roadMain} />
        <circle cx="246" cy="188" r="13" fill={blockBg} />
        {!isOffline && (
          <>
            <ellipse cx="130" cy="100" rx="70" ry="60" fill="url(#rHeat1)" />
            <ellipse cx="300" cy="240" rx="65" ry="55" fill="url(#rHeat2)" />
            <ellipse cx="80" cy="280" rx="50" ry="40" fill="url(#rHeat3)" />
          </>
        )}
        {activeJob && (
          <path
            d={`M${activeJob.from[0]},${activeJob.from[1]} Q${(activeJob.from[0]+activeJob.to[0])/2},${activeJob.from[1]} ${activeJob.to[0]},${activeJob.to[1]}`}
            stroke="#A43700" strokeWidth="4" strokeDasharray="8 4" fill="none" strokeLinecap="round"
          />
        )}
        {!isOffline && jobs.map((job, i) => (
          <g key={i}>
            <circle cx={job.x} cy={job.y} r="18" fill={job.type === 'heavy' ? Z.orange : Z.blue} opacity="0.15" />
            <circle cx={job.x} cy={job.y} r="12" fill={job.type === 'heavy' ? Z.orange : Z.blue} opacity="0.9" />
            <text x={job.x} y={job.y+4} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
              {job.type === 'heavy' ? '🏗' : '⚡'}
            </text>
          </g>
        ))}
        {activeJob && (
          <>
            <circle cx={activeJob.from[0]} cy={activeJob.from[1]} r="10" fill="#16A34A" />
            <text x={activeJob.from[0]} y={activeJob.from[1]+4} textAnchor="middle" fontSize="9" fill="white">P</text>
            <circle cx={activeJob.to[0]} cy={activeJob.to[1]} r="10" fill={Z.orangeDark} />
            <text x={activeJob.to[0]} y={activeJob.to[1]+4} textAnchor="middle" fontSize="9" fill="white">E</text>
          </>
        )}
      </svg>

      <div style={{
        position: 'absolute', left: '49%', top: 175, transform: 'translate(-50%,-50%)',
        width: 24, height: 24, borderRadius: '50%',
        background: Z.orangeDark, border: '3px solid #fff',
        animation: !isOffline ? 'driverPulse 1.5s ease-in-out infinite' : 'none',
        zIndex: 2,
      }} />

      {!isOffline && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          padding: '5px 14px', borderRadius: 20, zIndex: 3,
          background: 'rgba(255,255,255,0.9)',
          fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.text,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap',
        }}>
          {vehicleType === 'heavy' ? '🚛 Camión · Radio 20km' : '🏍 Moto · Radio 5km'}
        </div>
      )}
    </div>
  )
}

export function RadarScreen() {
  const [mode, setMode] = useState<RadarMode>('offline')
  const [vehicleType, setVehicleType] = useState<VehicleType>('heavy')
  const [selectedJob, setSelectedJob] = useState<MapJob | null>(null)
  const [activeJob, setActiveJob] = useState<MapJob | null>(null)
  const [deliveryStep, setDeliveryStep] = useState(0)
  const [showOfferPop, setShowOfferPop] = useState(false)

  useEffect(() => {
    if (mode === 'online') {
      const t = setTimeout(() => setShowOfferPop(true), 2500)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowOfferPop(false)
    return undefined
  }, [mode])

  const visibleJobs = vehicleType === 'heavy'
    ? MAP_JOBS.filter(j => j.type === 'heavy')
    : MAP_JOBS.filter(j => j.type === 'light')

  const activeJobData: { from: [number, number]; to: [number, number] } = { from: [200, 175], to: [320, 90] }

  const handleGoOnline = () => { setMode('online'); setActiveJob(null); setDeliveryStep(0) }
  const handleAccept = (job: MapJob) => {
    setSelectedJob(null)
    setShowOfferPop(false)
    setActiveJob(job)
    setMode('active')
  }

  const currentOffer = selectedJob ?? MAP_JOBS[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        }}>
          {([{ key: 'heavy' as const, label: '🚛 Camión' }, { key: 'light' as const, label: '🏍 Moto' }]).map(v => (
            <button key={v.key} onClick={() => setVehicleType(v.key)} style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer', outline: 'none',
              background: vehicleType === v.key ? Z.orangeDark : 'rgba(255,255,255,0.88)',
              color: vehicleType === v.key ? '#fff' : Z.text,
              fontFamily: Z.font, fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}>{v.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: Z.font, fontSize: 10, fontWeight: 700,
            color: mode !== 'offline' ? Z.orangeDark : Z.textMuted,
            padding: '4px 10px', borderRadius: 20,
            background: mode !== 'offline' ? Z.orangeLight : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(8px)',
          }}>
            {mode !== 'offline' ? '● EN LÍNEA' : '○ OFFLINE'}
          </span>
          <div
            onClick={() => mode === 'offline' ? handleGoOnline() : setMode('offline')}
            role="button"
            aria-label={mode !== 'offline' ? 'Desconectarse' : 'Conectarse'}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && (mode === 'offline' ? handleGoOnline() : setMode('offline'))}
            style={{
              width: 50, height: 28, borderRadius: 14, padding: 2, cursor: 'pointer',
              background: mode !== 'offline' ? Z.orange : Z.border, transition: 'background 0.3s',
              display: 'flex', alignItems: 'center',
              boxShadow: mode !== 'offline' ? '0 2px 10px rgba(232,115,58,0.4)' : 'none',
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s',
              transform: mode !== 'offline' ? 'translateX(22px)' : 'translateX(0)',
            }} />
          </div>
        </div>
      </div>

      <FakeMap
        mode={mode}
        vehicleType={vehicleType}
        jobs={visibleJobs}
        activeJob={mode === 'active' ? activeJobData : null}
      />

      {mode === 'offline' && (
        <div style={{
          flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16,
          background: Z.bg,
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.textMuted }}>
            Estás fuera de línea
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <SummaryCard
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={Z.orange} strokeWidth="2" fill="none" />
                </svg>
              }
              label="Ganancias hoy"
              value="Bs 125"
              color={Z.orange}
            />
            <SummaryCard
              icon={<TruckIcon color={Z.blue} size={16} />}
              label="Viajes hoy"
              value="2"
              color={Z.blue}
            />
            <SummaryCard
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M3 12l2-2 4 4 4-4 4 4 4-4" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              }
              label="Km recorridos"
              value="6.3"
              color={Z.orange}
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
          <div style={{ marginTop: 4 }}>
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
      )}

      {mode === 'online' && (
        <div style={{
          background: Z.surface, borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          padding: '14px 16px 80px', flex: 1, overflowY: 'auto',
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text, marginBottom: 12 }}>
            {visibleJobs.length} solicitudes disponibles
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleJobs.map(job => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                  borderRadius: Z.r.md, background: Z.bg, border: `1px solid ${Z.border}`,
                  cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: job.type === 'heavy' ? Z.orangeLight : Z.blueLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {job.type === 'heavy' ? '🏗' : '⚡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{job.title}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 2 }}>
                    {job.from} → {job.to}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>📍 {job.dist}</span>
                    <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>⏱ {job.time}</span>
                    <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>⚖ {job.weight}</span>
                  </div>
                </div>
                <span style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.orangeDark, flexShrink: 0 }}>
                  Bs {job.pay}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'active' && activeJob && (
        <div style={{
          background: Z.surface, borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          padding: '16px 16px 80px', flex: 1, overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 800, color: Z.text }}>
              {activeJob.title}
            </div>
            <span style={{
              fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '4px 10px',
              borderRadius: 20, background: Z.orangeLight, color: Z.orangeDark,
            }}>
              EN CAMINO
            </span>
          </div>

          {[
            { label: 'Recoger carga', sub: activeJob.from },
            { label: 'En camino', sub: `${activeJob.dist} · ${activeJob.time}` },
            { label: 'Entregar y escanear QR', sub: activeJob.to },
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
                      : <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 800, color: current ? Z.orangeDark : Z.textMuted }}>{i+1}</span>
                    }
                  </div>
                  {i < 2 && (
                    <div style={{ width: 2, height: 24, background: done ? Z.orange : Z.divider, margin: '4px 0' }} />
                  )}
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

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {deliveryStep < 3 && (
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
            )}
            <button style={{
              width: 48, height: 48, borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
              background: Z.surface, cursor: 'pointer', outline: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
              aria-label="Chat"
            >
              <MsgIcon color={Z.blue} size={20} />
            </button>
          </div>
        </div>
      )}

      {(selectedJob !== null || showOfferPop) && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 30,
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{
            background: Z.surface, borderRadius: '20px 20px 0 0', padding: '20px',
            width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 28 }}>
                {currentOffer.type === 'heavy' ? '🏗' : '⚡'}
              </div>
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
                <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>
                  {currentOffer.time}
                </div>
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
              <ZButton
                style={{ flex: 2 }}
                onClick={() => handleAccept(currentOffer)}
              >
                Aceptar Entrega
              </ZButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

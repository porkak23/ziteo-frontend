import React, { useState, useCallback, useRef, lazy, Suspense } from 'react'
import { Z } from '@/shared/design/tokens'
import { RoleDashNav } from '@/shared/design/shell/RoleDashNav'
import { ZAvatar } from '@/shared/design/components/ZAvatar'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { DashHeader } from '@/shared/design/shell'
import { useAuthStore } from '@/features/auth/store/authStore'
import AvatarMenu from '@/shared/components/AvatarMenu'

const RadarScreen = lazy(() =>
  import('./RadarScreen').then((m) => ({ default: m.RadarScreen }))
)
const GananciasScreen = lazy(() =>
  import('./GananciasScreen').then((m) => ({ default: m.GananciasScreen }))
)

interface JobAlert { title: string; pay: number; dist: string; type: 'heavy' | 'light' }

type RepartidorTab = 'radar' | 'pedidos' | 'ganancias' | 'perfil'

function RNavIconRadar({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2" fill={color} />
      <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke={color} strokeWidth="1.8" opacity="0.3" fill="none" />
      <path d="M12 6a6 6 0 100 12A6 6 0 0012 6z" stroke={color} strokeWidth="1.8" opacity="0.6" fill="none" />
      <path d="M12 10v-8M12 10l5-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function RNavIconList({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function RNavIconEarnings({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function RNavIconUser({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  )
}

function IconStar({ color = '#F59E0B', size = 13 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2l-5-4.9 6.9-1L12 2z" fill={color} />
    </svg>
  )
}

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
    </div>
  )
}

const TABS: { key: RepartidorTab; label: string; Icon: (p: { color?: string; size?: number }) => React.ReactElement }[] = [
  { key: 'radar',     label: 'Radar',    Icon: RNavIconRadar },
  { key: 'pedidos',   label: 'Pedidos',  Icon: RNavIconList },
  { key: 'ganancias', label: 'Ganancias', Icon: RNavIconEarnings },
  { key: 'perfil',    label: 'Perfil',   Icon: RNavIconUser },
]

const TRIP_HISTORY = [
  { id: 1, title: '50 bolsas Cemento', from: 'Ferretería San José', to: 'Zona Norte', pay: 80, date: 'Hoy 09:30', km: 4.5 },
  { id: 2, title: 'Herramientas Express', from: 'Central', to: 'Zona Este', pay: 45, date: 'Hoy 08:00', km: 1.8 },
  { id: 3, title: 'Arena 1m³', from: 'Cantera Sur', to: 'Centro', pay: 110, date: 'Ayer', km: 6.2 },
  { id: 4, title: '80 bolsas Cemento', from: 'Ferretería Norte', to: 'Los Pinos', pay: 130, date: 'Ayer', km: 5.1 },
]

type PedidosFilter = 'Activos' | 'Completados' | 'Historial'

function PedidosTab() {
  const [filter, setFilter] = useState<PedidosFilter>('Activos')

  return (
    <div style={{ padding: '16px 20px 80px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
        Mis Pedidos
      </h2>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {(['Activos', 'Completados', 'Historial'] as PedidosFilter[]).map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            style={{
              fontFamily: Z.font, fontSize: 12, fontWeight: filter === opt ? 700 : 500,
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === opt ? Z.orangeDark : Z.surface,
              color: filter === opt ? '#fff' : Z.textSec,
              whiteSpace: 'nowrap', transition: 'all 0.2s', outline: 'none',
              boxShadow: filter === opt ? 'none' : `0 0 0 1px ${Z.border}`,
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {filter === 'Activos' && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <RNavIconList color={Z.textMuted} size={44} />
          <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>
            No tienes entregas activas en este momento
          </p>
          <p style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, marginTop: 4 }}>
            Activa tu radar para recibir solicitudes
          </p>
        </div>
      )}

      {filter !== 'Activos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TRIP_HISTORY.map(t => (
            <div
              key={t.id}
              style={{
                padding: '14px 16px', borderRadius: Z.r.md,
                background: Z.surface, border: `1px solid ${Z.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
                  {t.title}
                </span>
                <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.orangeDark }}>
                  Bs {t.pay}
                </span>
              </div>
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>
                {t.from} → {t.to}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>📍 {t.km}km</span>
                <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>🕐 {t.date}</span>
                <span style={{
                  marginLeft: 'auto', fontFamily: Z.font, fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 20, background: '#DCFCE7', color: Z.success,
                }}>
                  Entregado
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PerfilTab() {
  const user = useAuthStore((s) => s.user)
  const displayName = user?.name ?? 'Carlos Condori'
  const city = user?.city ?? 'Santa Cruz'

  return (
    <div style={{ overflowY: 'auto', paddingBottom: 80 }}>
      <div style={{
        padding: '24px 20px 20px',
        background: `linear-gradient(180deg, ${Z.orangeLight} 0%, ${Z.bg} 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <ZAvatar name={displayName} size={80} />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>
            {displayName}
          </h3>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>
            Transportista · {city}
          </p>
        </div>
        <div style={{
          display: 'flex', gap: 16, padding: '12px 20px', borderRadius: Z.r.full,
          background: Z.surface, border: `1px solid ${Z.border}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text }}>4.9</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(i => <IconStar key={i} color="#F59E0B" size={13} />)}
            </div>
          </div>
          <div style={{ width: 1, background: Z.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text }}>247</div>
            <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>viajes</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <SectionTitle title="Mi Vehículo" />
          <div style={{
            marginTop: 10, padding: '16px', borderRadius: Z.r.md,
            background: Z.surface, border: `1px solid ${Z.border}`,
            display: 'flex', gap: 14, alignItems: 'center',
          }}>
            <span style={{ fontSize: 36 }}>🚛</span>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>
                Camión de Carga
              </div>
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>
                Toyota Dyna · Placa 3456-ABC
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span style={{
                  fontFamily: Z.font, fontSize: 11, fontWeight: 600, padding: '4px 10px',
                  borderRadius: 20, background: Z.orangeLight, color: Z.orangeDark,
                }}>
                  Carga máx: 3T
                </span>
                <span style={{
                  fontFamily: Z.font, fontSize: 11, fontWeight: 600, padding: '4px 10px',
                  borderRadius: 20, background: Z.blueLight, color: Z.blueDark,
                }}>
                  Verificado ✓
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle title="Documentos" />
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { doc: 'Licencia de conducir', status: 'Vigente', ok: true },
              { doc: 'SOAT', status: 'Vigente hasta Mar 2026', ok: true },
              { doc: 'Tarjeta de propiedad', status: 'Vigente', ok: true },
              { doc: 'Revisión técnica', status: 'Vence Jun 2025', ok: false },
            ].map(d => (
              <div
                key={d.doc}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: Z.r.sm,
                  background: Z.surface, border: `1px solid ${d.ok ? Z.border : '#FECACA'}`,
                }}
              >
                <div>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>
                    {d.doc}
                  </div>
                  <div style={{
                    fontFamily: Z.font, fontSize: 11,
                    color: d.ok ? Z.textMuted : Z.error, marginTop: 2,
                  }}>
                    {d.status}
                  </div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: d.ok ? '#DCFCE7' : '#FFF1F1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 12 }}>{d.ok ? '✓' : '!'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


function RepartidorChatFab() {
  return (
    <button
      style={{
        position: 'fixed', bottom: 92, left: 18, width: 48, height: 48,
        borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: Z.gradMixed, boxShadow: '0 4px 16px rgba(232,115,58,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25,
      }}
      aria-label="Chat"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" fill="none"
        />
      </svg>
    </button>
  )
}

function JobAlertToast({ alert, onDismiss }: { alert: JobAlert; onDismiss: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 70, left: 12, right: 12, zIndex: 300,
      background: Z.surface, borderRadius: Z.r.md,
      boxShadow: '0 6px 24px rgba(0,0,0,0.16)', border: `1px solid ${Z.orangePastel}`,
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      animation: 'alertDrop 0.3s cubic-bezier(0.22,1,0.36,1)',
      transformOrigin: 'top right',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0, fontSize: 18,
        background: alert.type === 'heavy' ? Z.orangeLight : Z.blueLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {alert.type === 'heavy' ? '🏗' : '⚡'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {alert.title}
        </div>
        <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 2 }}>
          📍 {alert.dist} · <span style={{ color: Z.orangeDark, fontWeight: 700 }}>Bs {alert.pay}</span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          width: 28, height: 28, borderRadius: 8, border: 'none', background: Z.divider,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: Z.textMuted, fontFamily: Z.font, fontSize: 14, flexShrink: 0,
        }}
        aria-label="Cerrar alerta"
      >
        ✕
      </button>
    </div>
  )
}

export function RepartidorApp() {
  const [activeTab, setActiveTab] = useState<RepartidorTab>('radar')
  const [showAccount, setShowAccount] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [activeAlert, setActiveAlert] = useState<JobAlert | null>(null)
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNewJobOffer = useCallback((alert: JobAlert) => {
    setAlertCount(c => c + 1)
    setActiveAlert(alert)
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current)
    alertTimerRef.current = setTimeout(() => setActiveAlert(null), 5000)
  }, [])

  const handleBellClick = () => {
    setAlertCount(0)
    setActiveAlert(null)
    setActiveTab('radar')
  }

  const isRadar = activeTab === 'radar'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: Z.bg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <style>{`@keyframes alertDrop { from { opacity:0; transform:scale(0.88) translateY(-10px); transform-origin: top right; } to { opacity:1; transform:scale(1) translateY(0); transform-origin: top right; } }`}</style>

      <DashHeader
        onProfile={() => setShowAccount(true)}
        onNotif={handleBellClick}
        notifCount={alertCount}
      />
      <AvatarMenu isOpen={showAccount} onClose={() => setShowAccount(false)} />

      {activeAlert && (
        <JobAlertToast alert={activeAlert} onDismiss={() => setActiveAlert(null)} />
      )}

      <main style={{
        flex: 1,
        overflow: isRadar ? 'hidden' : 'auto',
        display: isRadar ? 'flex' : 'block',
        flexDirection: isRadar ? 'column' : undefined,
        paddingBottom: isRadar ? 0 : 96,
      }}>
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'radar'    && <RadarScreen onNewJobOffer={handleNewJobOffer} />}
          {activeTab === 'pedidos'  && <PedidosTab />}
          {activeTab === 'ganancias' && <GananciasScreen />}
          {activeTab === 'perfil'   && <PerfilTab />}
        </Suspense>
      </main>

      <RoleDashNav tabs={TABS} activeTab={activeTab} onTabChange={(k) => setActiveTab(k as RepartidorTab)} />
      <RepartidorChatFab />
    </div>
  )
}

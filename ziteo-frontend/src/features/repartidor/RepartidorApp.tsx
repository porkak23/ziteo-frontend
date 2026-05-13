import { useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { ZAvatar } from '@/shared/design/components/ZAvatar'
import { ZIcon } from '@/shared/design/components/ZIcon'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { useNavStore } from '@/shared/store/navStore'
import { useAuthStore } from '@/features/auth/store/authStore'
import { RadarScreen } from './RadarScreen'
import { GananciasScreen } from './GananciasScreen'

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

function RepartidorHeader({ onProfile }: { onProfile: () => void }) {
  const setTab = useNavStore((s) => s.setTab)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '54px 20px 10px', background: Z.bg,
      position: 'relative', zIndex: 10, flexShrink: 0,
    }}>
      <span style={{
        fontFamily: Z.font, fontWeight: 800, fontSize: 22, letterSpacing: 2,
        background: Z.gradMixed, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        ZITEO
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => setTab('notificaciones')}
          style={{
            position: 'relative', width: 38, height: 38, borderRadius: 12, border: 'none',
            background: Z.surface, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          aria-label="Notificaciones"
        >
          <ZIcon name="bell" size={20} color={Z.textSec} />
        </button>
        <div onClick={onProfile} style={{ cursor: 'pointer' }} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onProfile()} aria-label="Perfil">
          <ZAvatar name="CC" size={38} />
        </div>
      </div>
    </div>
  )
}

function RepartidorNav({ activeTab, onTabChange }: {
  activeTab: RepartidorTab
  onTabChange: (tab: RepartidorTab) => void
}) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 14, right: 14, height: 58,
      borderRadius: 29, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)',
      zIndex: 30, padding: '0 4px',
    }}>
      {TABS.map(({ key, label, Icon }) => {
        const active = activeTab === key
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            aria-label={label}
            aria-pressed={active}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: active ? Z.orangeLight : 'transparent',
              border: 'none', cursor: 'pointer', outline: 'none',
              padding: '7px 14px', borderRadius: 16, transition: 'all 0.2s ease', minWidth: 0,
            }}
          >
            <Icon color={active ? Z.orangeDark : Z.textMuted} size={21} />
            <span style={{
              fontFamily: Z.font, fontSize: 9.5, fontWeight: active ? 700 : 500,
              color: active ? Z.orangeDark : Z.textMuted, letterSpacing: 0.2,
            }}>
              {label}
            </span>
          </button>
        )
      })}
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

export function RepartidorApp() {
  const [activeTab, setActiveTab] = useState<RepartidorTab>('radar')
  const setGlobalTab = useNavStore((s) => s.setTab)

  const handleProfile = () => setActiveTab('perfil')

  const isRadar = activeTab === 'radar'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: Z.bg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {!isRadar && <RepartidorHeader onProfile={handleProfile} />}

      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: isRadar ? 0 : 96 }}>
        {activeTab === 'radar' && (
          <div style={{ position: 'relative', minHeight: '100%' }}>
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
              pointerEvents: 'none',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '54px 20px 10px', pointerEvents: 'none',
              }}>
                <span style={{
                  fontFamily: Z.font, fontWeight: 800, fontSize: 22, letterSpacing: 2,
                  background: Z.gradMixed, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  pointerEvents: 'auto',
                }}>
                  ZITEO
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, pointerEvents: 'auto' }}>
                  <button
                    onClick={() => setGlobalTab('notificaciones')}
                    style={{
                      position: 'relative', width: 38, height: 38, borderRadius: 12, border: 'none',
                      background: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    }}
                    aria-label="Notificaciones"
                  >
                    <ZIcon name="bell" size={20} color={Z.textSec} />
                  </button>
                  <div
                    onClick={handleProfile}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProfile()}
                    aria-label="Perfil"
                    style={{ cursor: 'pointer' }}
                  >
                    <ZAvatar name="CC" size={38} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ paddingTop: 54 }}>
              <RadarScreen />
            </div>
          </div>
        )}
        {activeTab === 'pedidos'   && <PedidosTab />}
        {activeTab === 'ganancias' && <GananciasScreen />}
        {activeTab === 'perfil'    && <PerfilTab />}
      </main>

      <RepartidorNav activeTab={activeTab} onTabChange={setActiveTab} />
      <RepartidorChatFab />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Z } from '../../shared/design/tokens'
import { SectionTitle } from '../../shared/design/shell'
import { KpiCard, BigActionButton } from '../../shared/design/components/accessible'
import { useAuthStore } from '../auth/store/authStore'
import { useEarnings } from '../maestro/hooks/useEarnings'
import { useTrabajos } from '../maestro/hooks/useTrabajos'
import { useMaestroContracts } from '../maestro/hooks/useContracts'
import { useContactStats } from '../maestro/hooks/useContactEvents'
import { supabase } from '../../lib/supabaseClient'

interface HomeTabTrabajadorProps {
  onNavigate: (tab: string) => void
}

function WNavIconHardhat({ color = '#94A3B8', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2a9 9 0 018.66 6.5H3.34A9 9 0 0112 2z" stroke={color} strokeWidth="1.8" fill="none"/>
      <path d="M2 12h20M2 15h20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M5 19h14a1 1 0 001-1v-3H4v3a1 1 0 001 1z" stroke={color} strokeWidth="1.8" fill="none"/>
    </svg>
  )
}

function DollarIcon({ color = Z.orange }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function BriefcaseIcon({ color = Z.blue }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth="2"/>
    </svg>
  )
}

function ListIcon({ color = '#8B5CF6' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function PhoneIcon({ color = '#1B8A5A' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function HomeTabTrabajador({ onNavigate }: HomeTabTrabajadorProps) {
  const [isActive, setIsActive] = useState(false)
  const [togglePending, setTogglePending] = useState(false)
  const user = useAuthStore((s) => s.user)
  const maestroId = user?.user_id ?? ''

  // ── Datos reales ──────────────────────────────────────────────────────────
  const { data: earnings } = useEarnings(maestroId)
  const { data: trabajos = [] } = useTrabajos()
  const { data: contracts = [] } = useMaestroContracts(maestroId)
  const { whatsappClicks30d } = useContactStats(maestroId)
  const requests = trabajos.slice(0, 2)

  const activeContracts = contracts.filter((c) => c.status === 'accepted')
  const currentContract = activeContracts[0] ?? null

  useEffect(() => {
    if (!user?.user_id) return
    let cancelled = false
    supabase
      .from('user_roles')
      .select('is_available')
      .eq('user_id', user.user_id)
      .eq('role', 'maestro')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setIsActive(Boolean(data.is_available))
      })
    return () => { cancelled = true }
  }, [user?.user_id])

  async function handleToggle() {
    if (!user?.user_id || togglePending) return
    const next = !isActive
    setIsActive(next)
    setTogglePending(true)
    const { error } = await supabase
      .from('user_roles')
      .update({ is_available: next })
      .eq('user_id', user.user_id)
      .eq('role', 'maestro')
    if (error) setIsActive(!next)
    setTogglePending(false)
  }
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')[0] ?? 'Maestro'

  const gananciasLabel = `Bs ${(earnings?.totalEarned ?? 0).toLocaleString('es-BO')}`

  return (
    <div style={{ padding: '0 0 20px', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '20px 20px 24px',
          margin: '0 0 20px',
          background: isActive
            ? `linear-gradient(160deg, ${Z.orangeLight} 0%, #fff9f5 100%)`
            : `linear-gradient(160deg, ${Z.divider} 0%, ${Z.bg} 100%)`,
          transition: 'background 0.5s',
          borderBottom: `1px solid ${Z.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 20, color: Z.text, margin: 0 }}>
              {greeting}, {firstName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={Z.textMuted} strokeWidth="1.8" fill="none"/>
                <circle cx="12" cy="9" r="2.5" stroke={Z.textMuted} strokeWidth="1.8" fill="none"/>
              </svg>
              <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>
                {user?.city ?? 'Santa Cruz'} · Maestro Albañil
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            aria-label="Cambiar disponibilidad"
            onClick={handleToggle}
            disabled={togglePending}
            style={{ border: 'none', background: 'transparent', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: togglePending ? 'wait' : 'pointer', opacity: togglePending ? 0.6 : 1 }}
          >
            <div
              style={{
                width: 72,
                height: 40,
                borderRadius: 20,
                padding: 4,
                background: isActive ? Z.orange : Z.border,
                transition: 'background 0.3s',
                display: 'flex',
                alignItems: 'center',
                boxShadow: isActive ? `0 2px 12px rgba(232,115,58,0.3)` : 'none',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'transform 0.3s',
                  transform: isActive ? 'translateX(32px)' : 'translateX(0)',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: Z.font,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.5,
                color: isActive ? Z.orangeDark : Z.textMuted,
              }}
            >
              {isActive ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </button>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: Z.r.md,
            background: isActive ? Z.orangeLight : Z.surface,
            border: `1px solid ${isActive ? Z.orange : Z.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isActive ? Z.orange : Z.textMuted,
              boxShadow: isActive ? `0 0 0 3px rgba(232,115,58,0.2)` : 'none',
            }}
          />
          <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: isActive ? Z.orangeDark : Z.textMuted }}>
            {isActive ? 'Recibiendo solicitudes de trabajo' : 'No estás recibiendo solicitudes'}
          </span>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <KpiCard
            icon={<DollarIcon color={Z.orange} />}
            label="Ganancias"
            value={gananciasLabel}
            color={Z.orange}
          />
          <KpiCard
            icon={<BriefcaseIcon color={Z.blue} />}
            label="Trabajos activos"
            value={activeContracts.length}
            color={Z.blue}
            onClick={() => onNavigate('proyectos')}
          />
          <KpiCard
            icon={<ListIcon />}
            label="Nuevas solicitudes"
            value={trabajos.length}
            color="#8B5CF6"
            onClick={() => onNavigate('licitaciones')}
          />
          <KpiCard
            icon={<PhoneIcon />}
            label="Te contactaron"
            value={whatsappClicks30d}
            color="#1B8A5A"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <BigActionButton
            label="Ver trabajos disponibles"
            variant="primary"
            onClick={() => onNavigate('licitaciones')}
          />
          <BigActionButton
            label="Mis proyectos"
            variant="secondary"
            onClick={() => onNavigate('proyectos')}
          />
          {currentContract && (
            <BigActionButton
              label={`Continuar: ${currentContract.description ?? 'proyecto en curso'}`}
              variant="success"
              icon={<WNavIconHardhat color="#fff" size={20} />}
              onClick={() => onNavigate('proyectos')}
            />
          )}
        </div>

        <div>
          <SectionTitle
            title="Nuevas Solicitudes"
            action={`${trabajos.length} disponibles`}
            onAction={() => onNavigate('licitaciones')}
          />
          <div style={{ marginTop: 8 }}>
            {requests.length === 0 ? (
              <div style={{
                fontFamily: Z.font, fontSize: 14, color: Z.textMuted,
                padding: '16px 0', textAlign: 'center',
              }}>
                No hay solicitudes disponibles por ahora
              </div>
            ) : (
              requests.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 0',
                    borderBottom: `1px solid ${Z.divider}`,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: Z.blue,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>
                      {r.name}
                    </div>
                    <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 500, color: Z.textMuted, marginTop: 2 }}>
                      {r.constructor?.name ?? 'Constructor'}{r.estimated_budget != null ? ` · Bs ${r.estimated_budget.toLocaleString()}` : ''}
                    </div>
                  </div>
                  {r.location_address && (
                    <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {r.location_address}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

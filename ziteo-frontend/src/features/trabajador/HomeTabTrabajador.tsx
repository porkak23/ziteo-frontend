import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Z } from '../../shared/design/tokens'
import { SummaryCard, SectionTitle } from '../../shared/design/shell'
import { IconStar } from '../../shared/design/shell'
import { useAuthStore } from '../auth/store/authStore'
import { useEarnings } from '../maestro/hooks/useEarnings'
import { useTrabajos } from '../maestro/hooks/useTrabajos'
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

function ChevronRight({ color = '#94A3B8' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function DollarIcon({ color = Z.orange }: { color?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

interface AcceptedContract {
  id: string
  description: string | null
  constructor: { name: string } | null
}

export function HomeTabTrabajador({ onNavigate }: HomeTabTrabajadorProps) {
  const [isActive, setIsActive] = useState(false)
  const [togglePending, setTogglePending] = useState(false)
  const user = useAuthStore((s) => s.user)
  const maestroId = user?.user_id ?? ''

  // ── Datos reales ──────────────────────────────────────────────────────────
  const { data: earnings } = useEarnings(maestroId)
  const { data: trabajos = [] } = useTrabajos()
  const requests = trabajos.slice(0, 5)

  // Proyecto activo: contrato aceptado más reciente del maestro.
  const { data: currentContract = null } = useQuery<AcceptedContract | null>({
    queryKey: ['maestro-current-contract', maestroId],
    enabled: !!maestroId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, description, constructor:profiles!contracts_constructor_id_fkey(name)')
        .eq('maestro_id', maestroId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) {
        if (error.code === '42P01') return null
        throw error
      }
      return (data as unknown as AcceptedContract | null) ?? null
    },
  })

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
                width: 60,
                height: 32,
                borderRadius: 16,
                padding: 3,
                background: isActive ? Z.orange : Z.border,
                transition: 'background 0.3s',
                display: 'flex',
                alignItems: 'center',
                boxShadow: isActive ? `0 2px 12px rgba(232,115,58,0.3)` : 'none',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'transform 0.3s',
                  transform: isActive ? 'translateX(28px)' : 'translateX(0)',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: Z.font,
                fontSize: 10,
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
        <div style={{ display: 'flex', gap: 10 }}>
          <SummaryCard
            icon={<IconStar color="#F59E0B" size={18} />}
            label="Calificación"
            value="Nuevo"
            color="#F59E0B"
          />
          <SummaryCard
            icon={<WNavIconHardhat color={Z.blue} size={17} />}
            label="Trabajos"
            value={String(earnings?.completedCount ?? 0)}
            color={Z.blue}
          />
          <SummaryCard
            icon={<DollarIcon color={Z.orange} />}
            label="Ganancias"
            value={`${((earnings?.totalEarned ?? 0) / 1000).toFixed(1)}k`}
            color={Z.orange}
          />
        </div>

        <div>
          <SectionTitle title="Agenda de Hoy" />
          <div style={{ marginTop: 10 }}>
            {currentContract ? (
              <button
                onClick={() => onNavigate('proyectos')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px',
                  borderRadius: Z.r.md,
                  border: `2px solid ${Z.orange}`,
                  background: Z.orangeLight,
                  width: '100%',
                  cursor: 'pointer',
                  outline: 'none',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: Z.gradOrange,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <WNavIconHardhat color="#fff" size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
                    {currentContract.description ?? 'Proyecto en curso'}
                  </div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 2 }}>
                    {currentContract.constructor?.name ?? 'Constructor'}
                  </div>
                </div>
                <ChevronRight color={Z.orangeDark} />
              </button>
            ) : (
              <div style={{
                fontFamily: Z.font, fontSize: 13, color: Z.textMuted,
                padding: '16px 0', textAlign: 'center',
              }}>
                No tienes proyectos activos
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionTitle
            title="Nuevas Solicitudes"
            action={`${requests.length} disponibles`}
            onAction={() => onNavigate('licitaciones')}
          />
          <div style={{ marginTop: 8 }}>
            {requests.length === 0 ? (
              <div style={{
                fontFamily: Z.font, fontSize: 13, color: Z.textMuted,
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
                    padding: '12px 0',
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
                    <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>
                      {r.name}
                    </div>
                    <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textMuted, marginTop: 2 }}>
                      {r.constructor?.name ?? 'Constructor'}{r.estimated_budget != null ? ` · Bs ${r.estimated_budget.toLocaleString()}` : ''}
                    </div>
                  </div>
                  {r.location_address && (
                    <span style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
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

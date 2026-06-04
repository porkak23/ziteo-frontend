import { useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { ZIcon } from '@/shared/design/components/ZIcon'
import { SummaryCard } from '@/shared/design/shell/SummaryCard'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { ActivityItem } from '@/shared/design/shell/ActivityItem'
import { useAuthStore } from '@/features/auth/store/authStore'
import GlobalSearchBar from '@/shared/components/GlobalSearchBar'
import { AdBanner } from '@/shared/components/AdBanner'

// ── Inline sub-icons ────────────────────────────────────────────────────────
function IconStore({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 7v13a1 1 0 001 1h16a1 1 0 001-1V7l-3-5H6z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <path d="M3 7h18" stroke={color} strokeWidth="1.8" />
      <path d="M16 11a4 4 0 01-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function IconTruck({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="5" width="14" height="12" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M15 9h4l3 4v4h-7V9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <circle cx="6" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="19" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  )
}

function IconBox({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 5v3.5l-5 2.88" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlus({ color = '#fff', size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function IconUsers({ color = Z.textMuted, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function IconCart({ color = Z.orange, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="21" r="1" fill={color} />
      <circle cx="20" cy="21" r="1" fill={color} />
      <path d="M1 1h4l2.7 13.4a1 1 0 001 .8h9.7a1 1 0 001-.8L21 7H6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function IconProjects({ color = Z.blue, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
interface ConstructorHomeTabProps {
  onNavigate: (dest: string) => void
}

export function ConstructorHomeTab({ onNavigate }: ConstructorHomeTabProps) {
  const user = useAuthStore((s) => s.user)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name ? user.name.split(' ')[0] : 'Constructor'
  const city = user?.city ?? 'Bolivia'
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Greeting */}
      <div>
        <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 22, color: Z.text, margin: 0 }}>
          {greeting}, {firstName}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <ZIcon name="map-pin" size={14} color={Z.textMuted} />
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec }}>
            {city} · Constructor
          </span>
        </div>
      </div>

      {/* Search */}
      <button
        type="button"
        onClick={() => setIsSearchOpen(true)}
        aria-label="Buscar materiales y trabajadores"
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px',
          borderRadius: Z.r.md, background: Z.surface, border: `1.5px solid ${Z.border}`,
          width: '100%', cursor: 'text', outline: 'none',
        }}
      >
        <ZIcon name="search" size={18} color={Z.textMuted} />
        <span style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, fontWeight: 400 }}>
          Buscar materiales, trabajadores...
        </span>
      </button>

      {/* Quick Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Big CTA — Tienda */}
        <button
          onClick={() => onNavigate('tienda')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
            borderRadius: Z.r.lg, border: 'none', cursor: 'pointer', width: '100%',
            background: `linear-gradient(135deg, ${Z.orangeDark} 0%, ${Z.orange} 100%)`,
            boxShadow: '0 4px 16px rgba(164,55,0,0.25)', textAlign: 'left', outline: 'none',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconStore color="#fff" size={24} />
          </div>
          <div>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: '#fff' }}>Ir a la Tienda</div>
            <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Materiales, herramientas y más
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>

        {/* Transport CTA */}
        <button
          onClick={() => onNavigate('transporte')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
            borderRadius: Z.r.lg, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
            width: '100%', background: Z.surface, textAlign: 'left', outline: 'none',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: Z.blueLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconTruck color={Z.blueDark} size={22} />
          </div>
          <div>
            <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>Solicitar Transporte</div>
            <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textMuted, marginTop: 1 }}>
              Camiones, volquetas y motos
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke={Z.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>

        {/* Vender / Alquilar CTA */}
        <button
          onClick={() => onNavigate('vender')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
            borderRadius: Z.r.lg, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
            width: '100%', background: Z.surface, textAlign: 'left', outline: 'none',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: Z.orangeLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconBox color={Z.orangeDark} size={22} />
          </div>
          <div>
            <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>Vender / Alquilar</div>
            <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textMuted, marginTop: 1 }}>
              Publica herramientas o materiales sobrantes
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke={Z.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>

        {/* Two-button row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onNavigate('nuevo-proyecto')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px',
              borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
              background: Z.surface, textAlign: 'left', outline: 'none',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: Z.orangeLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconPlus color={Z.orangeDark} size={16} />
            </div>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.text }}>Nuevo</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>Proyecto</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('contratar')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px',
              borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
              background: Z.surface, textAlign: 'left', outline: 'none',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: Z.blueLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconUsers color={Z.blueDark} size={16} />
            </div>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.text }}>Contratar</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>Maestros</div>
            </div>
          </button>
        </div>
      </div>

      <AdBanner variant="card" />

      {/* Resumen */}
      <div>
        <SectionTitle title="Resumen" />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <SummaryCard
            icon={<IconCart color={Z.orange} size={18} />}
            label="Pedidos pendientes" value="3" color={Z.orange}
          />
          <SummaryCard
            icon={<IconProjects color={Z.blue} size={18} />}
            label="Proyectos activos" value="2" color={Z.blue}
          />
          <SummaryCard
            icon={<IconUsers color={Z.blue} size={18} />}
            label="Contratados" value="5" color={Z.blue}
          />
        </div>
      </div>

      {/* Actividad Reciente */}
      <div>
        <SectionTitle title="Actividad Reciente" action="Ver todo" />
        <div style={{ marginTop: 8 }}>
          <ActivityItem
            title="50 bolsas de Cemento IP-30"
            subtitle="Pedido confirmado · Ferretería San José"
            time="Hace 2h" color={Z.orange}
          />
          <ActivityItem
            title="Licitación: Electricista para obra"
            subtitle="3 nuevas ofertas recibidas"
            time="Hace 5h" color={Z.blue}
          />
          <ActivityItem
            title="Proyecto 'Casa Norte' actualizado"
            subtitle="Nuevo pedido de materiales agregado"
            time="Ayer" color={Z.orange}
          />
          <ActivityItem
            title="Recojo de escombros completado"
            subtitle="Camión volqueta · Zona Norte"
            time="Hace 3d" color={Z.textMuted}
          />
        </div>
      </div>

      {isSearchOpen && <GlobalSearchBar onClose={() => setIsSearchOpen(false)} />}
    </div>
  )
}

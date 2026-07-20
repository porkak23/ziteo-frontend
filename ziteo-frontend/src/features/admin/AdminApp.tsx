import { useState, lazy, Suspense } from 'react'
import { Z } from '@/shared/design/tokens'
import { DashHeader } from '@/shared/design/shell/DashHeader'
import { RoleDashNav } from '@/shared/design/shell/RoleDashNav'
import type { Tab } from '@/shared/design/shell/RoleDashNav'
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin'
import { OverviewScreen } from '@/features/admin/components/OverviewScreen'

const LiveMapScreen = lazy(() => import('@/features/admin/map/LiveMapScreen').then((m) => ({ default: m.LiveMapScreen })))
const CommerceScreen = lazy(() => import('@/features/admin/commerce/CommerceScreen').then((m) => ({ default: m.CommerceScreen })))
const MarketScreen = lazy(() => import('@/features/admin/market/MarketScreen').then((m) => ({ default: m.MarketScreen })))
const HealthScreen = lazy(() => import('@/features/admin/health/HealthScreen').then((m) => ({ default: m.HealthScreen })))

// ─── Nav icons ────────────────────────────────────────────────────────────────

function NavIconGrid({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" />
    </svg>
  )
}

function NavIconMap({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="9" r="2.4" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  )
}

function NavIconCommerce({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7l1.5-3h15L21 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 7v12a1 1 0 001 1h14a1 1 0 001-1V7" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M9 11a3 3 0 006 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function NavIconTrend({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 17l6-6 4 4 8-8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M15 7h6v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function NavIconPulse({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12h4l2-7 4 14 2-7h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

// ─── Tab config ───────────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'map' | 'commerce' | 'market' | 'health'

const ADMIN_TABS: Tab[] = [
  { key: 'overview', label: 'Centro',   Icon: NavIconGrid },
  { key: 'map',      label: 'Mapa',     Icon: NavIconMap },
  { key: 'commerce', label: 'Comercio', Icon: NavIconCommerce },
  { key: 'market',   label: 'Mercado',  Icon: NavIconTrend },
  { key: 'health',   label: 'Salud',    Icon: NavIconPulse },
]

function ScreenSkeleton() {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: 60, borderRadius: 8, background: Z.border, opacity: 0.4 }} />
      ))}
    </div>
  )
}

// Guard server-side: active_role='admin' en el cliente solo decide el
// routing; el acceso real a los datos lo decide is_admin() en Postgres
// (ver 20260719000001_admin_role_foundation.sql). Si la sesión no tiene
// el rol admin en user_roles, no se muestra ningún dato.
export function AdminApp() {
  const { data: isAdmin, isLoading, isError } = useIsAdmin()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Z.bg }}>
        <span style={{ color: Z.textMuted, fontSize: 14 }}>Verificando acceso…</span>
      </div>
    )
  }

  if (isError || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: Z.bg, padding: 24, textAlign: 'center' }}>
        <span style={{ color: Z.textMuted, fontSize: 14 }}>
          No tienes acceso al panel de administración.
        </span>
      </div>
    )
  }

  // Mapa vivo tiene su propio layout full-screen (sin header estándar),
  // mismo patrón que TransportistaScreen en ChofersApp.tsx.
  if (activeTab === 'map') {
    return (
      <div style={{ minHeight: '100vh', background: Z.bg }}>
        <Suspense fallback={<ScreenSkeleton />}>
          <LiveMapScreen />
        </Suspense>
        <RoleDashNav tabs={ADMIN_TABS} activeTab={activeTab} onTabChange={(k) => setActiveTab(k as AdminTab)} testIdPrefix="admin-nav" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 102, background: Z.bg }}>
      <DashHeader onProfile={() => {}} onBell={() => {}} unreadCount={0} />

      <Suspense fallback={<ScreenSkeleton />}>
        {activeTab === 'overview' && <OverviewScreen />}
        {activeTab === 'commerce' && <CommerceScreen />}
        {activeTab === 'market' && <MarketScreen />}
        {activeTab === 'health' && <HealthScreen />}
      </Suspense>

      <RoleDashNav tabs={ADMIN_TABS} activeTab={activeTab} onTabChange={(k) => setActiveTab(k as AdminTab)} testIdPrefix="admin-nav" />
    </div>
  )
}

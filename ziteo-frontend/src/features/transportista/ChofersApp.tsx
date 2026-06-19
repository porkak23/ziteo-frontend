import { useState, useEffect } from 'react'
import { Z } from '@/shared/design/tokens'
import { DashHeader } from '@/shared/design/shell/DashHeader'
import { RoleDashNav } from '@/shared/design/shell/RoleDashNav'
import type { Tab } from '@/shared/design/shell/RoleDashNav'
import AvatarMenu from '@/shared/components/AvatarMenu'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useNavStore } from '@/shared/store/navStore'
import { TransportistaScreen } from '@/features/transportista/components/TransportistaScreen'
import { HistorialScreen } from '@/features/transportista/components/HistorialScreen'
import { BilleteraScreen } from '@/features/transportista/components/BilleteraScreen'
import { PerfilChoferScreen } from '@/features/transportista/components/PerfilChoferScreen'
import { NotificationsScreen } from '@/features/notifications/components/NotificationsScreen'
import { useNotifications } from '@/shared/hooks/useNotifications'

// ─── Nav icons ────────────────────────────────────────────────────────────────

function NavIconRadar({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M12 6a6 6 0 110 12A6 6 0 0112 6z" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M12 10a2 2 0 110 4 2 2 0 010-4z" stroke={color} strokeWidth="1.2" fill={color} opacity="0.6" />
    </svg>
  )
}

function NavIconClock({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M12 6v6l4 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NavIconWallet({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z"
        stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M16 12h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="12" r="1" fill={color} />
    </svg>
  )
}

function NavIconUser({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// ─── Tab config ───────────────────────────────────────────────────────────────

type ChoferTab = 'radar' | 'historial' | 'billetera' | 'perfil'

const CHOFER_TABS: Tab[] = [
  { key: 'radar',    label: 'Radar',    Icon: NavIconRadar  },
  { key: 'historial', label: 'Historial', Icon: NavIconClock },
  { key: 'billetera', label: 'Billetera', Icon: NavIconWallet },
  { key: 'perfil',   label: 'Perfil',   Icon: NavIconUser   },
]

// ─── ChofersApp ───────────────────────────────────────────────────────────────

export function ChofersApp() {
  const currentUser = useAuthStore((s) => s.user)
  const userId = currentUser?.user_id ?? ''

  const [activeTab, setActiveTab] = useState<ChoferTab>('radar')
  const [showAccount, setShowAccount] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const { notifications } = useNotifications(userId)
  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Listen for navStore changes from BilleteraScreen's "Ver historial" button.
  // Only react to tab keys that are valid local tabs and are not intercepted by
  // App.tsx ('settings', 'perfil', 'notificaciones' are handled globally).
  const globalTab = useNavStore((s) => s.activeTab)
  const setGlobalTab = useNavStore((s) => s.setTab)
  useEffect(() => {
    const LOCAL_TABS: ChoferTab[] = ['radar', 'historial', 'billetera']
    if (LOCAL_TABS.includes(globalTab as ChoferTab) && globalTab !== activeTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(globalTab as ChoferTab)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalTab])

  const handleTabChange = (key: string) => {
    setActiveTab(key as ChoferTab)
    // Do NOT publish 'perfil' to globalTab — App.tsx intercepts that and shows
    // the generic PerfilScreen. For all other tabs, keep navStore in sync so
    // BilleteraScreen's setTab('historial') works bidirectionally.
    if (key !== 'perfil') {
      setGlobalTab(key)
    } else {
      // Reset globalTab to 'home' so App.tsx doesn't intercept the 'perfil' key
      setGlobalTab('home')
    }
  }

  // Radar tab has its own full-screen dark background — skip the standard header
  if (activeTab === 'radar') {
    return (
      <div style={{ minHeight: '100vh', background: Z.bg }}>
        <TransportistaScreen />
        <RoleDashNav
          tabs={CHOFER_TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          testIdPrefix="repartidor-nav"
        />
      </div>
    )
  }

  if (showNotifications) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: Z.bg, zIndex: 40, overflowY: 'auto' }}>
        <NotificationsScreen onClose={() => setShowNotifications(false)} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 92, background: Z.bg }}>
      <DashHeader
        onProfile={() => setShowAccount(true)}
        onBell={() => setShowNotifications(true)}
        unreadCount={unreadCount}
      />

      <AvatarMenu isOpen={showAccount} onClose={() => setShowAccount(false)} />

      <div>
        {activeTab === 'historial'  && <HistorialScreen />}
        {activeTab === 'billetera'  && <BilleteraScreen />}
        {activeTab === 'perfil'     && <PerfilChoferScreen />}
      </div>

      <RoleDashNav
        tabs={CHOFER_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        testIdPrefix="repartidor-nav"
      />
    </div>
  )
}

import React, { lazy, Suspense, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Z } from '../../shared/design/tokens'
import {
  NavIconHome,
  NavIconBids,
  NavIconProjects,
  NavIconUsers,
  DashHeader,
} from '../../shared/design/shell'
import { RoleDashNav } from '../../shared/design/shell/RoleDashNav'
import { useNavStore } from '../../shared/store/navStore'
import { useAuthStore } from '../auth/store/authStore'
import AvatarMenu from '../../shared/components/AvatarMenu'
import { supabase } from '../../lib/supabaseClient'
import { MaestroOnboardingWizard } from '../maestro/components/MaestroOnboardingWizard'
import { NotificationsScreen } from '../notifications/components/NotificationsScreen'

const HomeTabTrabajador = lazy(() =>
  import('./HomeTabTrabajador').then((m) => ({ default: m.HomeTabTrabajador }))
)
const LicitacionFeed = lazy(() =>
  import('../licitaciones/components/LicitacionFeed').then((m) => ({ default: m.LicitacionFeed }))
)
const ProyectosTabTrabajador = lazy(() =>
  import('./ProyectosTabTrabajador').then((m) => ({ default: m.ProyectosTabTrabajador }))
)
const PerfilTabTrabajador = lazy(() =>
  import('./PerfilTabTrabajador').then((m) => ({ default: m.PerfilTabTrabajador }))
)

type TrabajadorTab = 'home' | 'licitaciones' | 'proyectos' | 'perfil'

const TABS: {
  key: TrabajadorTab
  label: string
  Icon: (props: { color?: string; size?: number }) => React.ReactElement
}[] = [
  { key: 'home', label: 'Home', Icon: NavIconHome },
  { key: 'licitaciones', label: 'Trabajos', Icon: NavIconBids },
  { key: 'proyectos', label: 'Proyectos', Icon: NavIconProjects },
  { key: 'perfil', label: 'Mi Perfil', Icon: NavIconUsers },
]

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
    </div>
  )
}


// ─── Onboarding check ─────────────────────────────────────────────────────────

function useMaestroOnboardingCheck() {
  const user = useAuthStore((s) => s.user)
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_roles')
      .select('onboarding_complete, onboarding_completed')
      .eq('user_id', user.user_id)
      .eq('role', 'maestro')
      .maybeSingle()
      .then(({ data }) => {
        const done = data?.onboarding_complete === true || data?.onboarding_completed === true
        setNeedsOnboarding(!done)
      })
  }, [user])

  return needsOnboarding
}

// ─── TrabajadorApp ────────────────────────────────────────────────────────────

export function TrabajadorApp() {
  const globalTab = useNavStore((s) => s.activeTab)
  const setGlobalTab = useNavStore((s) => s.setTab)
  const needsOnboarding = useMaestroOnboardingCheck()
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const userId = useAuthStore((s) => s.user?.user_id) ?? ''

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-unread', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      return count ?? 0
    },
    staleTime: 30_000,
  })

  const toTrabajadorTab = (tab: string): TrabajadorTab => {
    if (tab === 'licitaciones' || tab === 'proyectos' || tab === 'perfil') {
      return tab as TrabajadorTab
    }
    return 'home'
  }

  const [localTab, setLocalTab] = useState<TrabajadorTab>(toTrabajadorTab(globalTab))
  const [showAccount, setShowAccount] = useState(false)

  // 'perfil' is intentionally excluded from globalTab sync — App.tsx intercepts
  // that key and shows the generic PerfilScreen. Maestro profile lives inside
  // TrabajadorApp only, driven by localTab.
  const activeTab: TrabajadorTab =
    globalTab === 'licitaciones' || globalTab === 'proyectos'
      ? (globalTab as TrabajadorTab)
      : localTab

  const handleTabChange = (tab: TrabajadorTab) => {
    setLocalTab(tab)
    // Reset globalTab to 'home' when going to perfil so the activeTab
    // derivation (which prioritises globalTab for licitaciones/proyectos)
    // doesn't override localTab. 'perfil' itself is never published to
    // globalTab to avoid App.tsx intercepting it with PerfilScreen.
    setGlobalTab(tab === 'perfil' ? 'home' : tab)
  }

  const handleNavigate = (dest: string) => {
    const isTrabajadorTab = dest === 'home' || dest === 'licitaciones' || dest === 'proyectos' || dest === 'perfil'
    if (isTrabajadorTab) {
      handleTabChange(dest as TrabajadorTab)
    } else {
      setGlobalTab(dest)
    }
  }

  // Show onboarding wizard while check is pending or wizard not yet completed
  if (needsOnboarding === null) return null
  if (needsOnboarding && !onboardingDone) {
    return <MaestroOnboardingWizard onComplete={() => setOnboardingDone(true)} />
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 92, background: Z.bg }}>
      <DashHeader
        onProfile={() => setShowAccount(true)}
        onBell={() => setShowNotifs(true)}
        unreadCount={unreadCount}
      />

      <AvatarMenu isOpen={showAccount} onClose={() => setShowAccount(false)} />

      {showNotifs && (
        <div style={{ position: 'fixed', inset: 0, background: Z.bg, zIndex: 40, overflowY: 'auto' }}>
          <NotificationsScreen onClose={() => setShowNotifs(false)} />
        </div>
      )}

      <div>
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'home' && (
            <HomeTabTrabajador onNavigate={handleNavigate} />
          )}
          {activeTab === 'licitaciones' && (
            <div className="px-4 pt-4 pb-24">
              <LicitacionFeed />
            </div>
          )}
          {activeTab === 'proyectos' && <ProyectosTabTrabajador onNavigate={handleNavigate} />}
          {activeTab === 'perfil' && <PerfilTabTrabajador />}
        </Suspense>
      </div>

      <RoleDashNav tabs={TABS} activeTab={activeTab} onTabChange={(k) => handleTabChange(k as TrabajadorTab)} testIdPrefix="trabajador-nav" />
    </div>
  )
}

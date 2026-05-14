import React, { lazy, Suspense, useState } from 'react'
import { Z } from '../../shared/design/tokens'
import {
  NavIconHome,
  NavIconBids,
  NavIconProjects,
  NavIconUsers,
  ChatFab,
  DashHeader,
} from '../../shared/design/shell'
import { RoleDashNav } from '../../shared/design/shell/RoleDashNav'
import { useNavStore } from '../../shared/store/navStore'
import { useAuthStore } from '../auth/store/authStore'
import AvatarMenu from '../../shared/components/AvatarMenu'

const HomeTabTrabajador = lazy(() =>
  import('./HomeTabTrabajador').then((m) => ({ default: m.HomeTabTrabajador }))
)
const LicitacionesTabTrabajador = lazy(() =>
  import('./LicitacionesTabTrabajador').then((m) => ({ default: m.LicitacionesTabTrabajador }))
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


export function TrabajadorApp() {
  const globalTab = useNavStore((s) => s.activeTab)
  const setGlobalTab = useNavStore((s) => s.setTab)
  const currentUser = useAuthStore((s) => s.user)

  const toTrabajadorTab = (tab: string): TrabajadorTab => {
    if (tab === 'licitaciones' || tab === 'proyectos' || tab === 'perfil') {
      return tab as TrabajadorTab
    }
    return 'home'
  }

  const [localTab, setLocalTab] = useState<TrabajadorTab>(toTrabajadorTab(globalTab))
  const [showAccount, setShowAccount] = useState(false)

  const activeTab: TrabajadorTab =
    globalTab === 'licitaciones' || globalTab === 'proyectos' || globalTab === 'perfil'
      ? (globalTab as TrabajadorTab)
      : localTab

  const handleTabChange = (tab: TrabajadorTab) => {
    setLocalTab(tab)
    setGlobalTab(tab)
  }

  const handleNavigate = (dest: string) => {
    const isTrabajadorTab = dest === 'home' || dest === 'licitaciones' || dest === 'proyectos' || dest === 'perfil'
    if (isTrabajadorTab) {
      handleTabChange(dest as TrabajadorTab)
    } else {
      setGlobalTab(dest)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 92, background: Z.bg }}>
      <DashHeader onProfile={() => setShowAccount(true)} notifCount={currentUser ? 3 : 0} />

      <AvatarMenu isOpen={showAccount} onClose={() => setShowAccount(false)} />

      <div style={{ overflowY: 'auto' }}>
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'home' && (
            <HomeTabTrabajador onNavigate={handleNavigate} />
          )}
          {activeTab === 'licitaciones' && <LicitacionesTabTrabajador />}
          {activeTab === 'proyectos' && <ProyectosTabTrabajador />}
          {activeTab === 'perfil' && <PerfilTabTrabajador />}
        </Suspense>
      </div>

      <ChatFab onClick={() => setGlobalTab('chat')} />
      <RoleDashNav tabs={TABS} activeTab={activeTab} onTabChange={(k) => handleTabChange(k as TrabajadorTab)} />
    </div>
  )
}

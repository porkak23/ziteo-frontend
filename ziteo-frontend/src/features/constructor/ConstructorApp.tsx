import React, { lazy, Suspense, useState } from 'react'
import { Z } from '../../shared/design/tokens'
import {
  NavIconHome,
  NavIconStore,
  NavIconProjects,
  NavIconBids,
} from '../../shared/design/shell'
import { DashHeader } from '../../shared/design/shell'
import { RoleDashNav } from '../../shared/design/shell/RoleDashNav'
import { useNavStore } from '../../shared/store/navStore'
import AvatarMenu from '../../shared/components/AvatarMenu'

const ConstructorHomeTab = lazy(() =>
  import('./ConstructorHomeTab').then((m) => ({ default: m.ConstructorHomeTab }))
)
const ConstructorTiendaTab = lazy(() =>
  import('./ConstructorTiendaTab').then((m) => ({ default: m.ConstructorTiendaTab }))
)
const ConstructorProyectosTab = lazy(() =>
  import('./ConstructorProyectosTab').then((m) => ({ default: m.ConstructorProyectosTab }))
)
const ConstructorLicitacionesTab = lazy(() =>
  import('./ConstructorLicitacionesTab').then((m) => ({ default: m.ConstructorLicitacionesTab }))
)

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
    </div>
  )
}

type ConstructorTab = 'home' | 'tienda' | 'proyectos' | 'licitaciones'

const TABS: {
  key: ConstructorTab
  label: string
  Icon: (props: { color?: string; size?: number }) => React.ReactElement
}[] = [
  { key: 'home',         label: 'Home',      Icon: NavIconHome },
  { key: 'tienda',       label: 'Tienda',    Icon: NavIconStore },
  { key: 'proyectos',    label: 'Proyectos', Icon: NavIconProjects },
  { key: 'licitaciones', label: 'Licitar',   Icon: NavIconBids },
]

export function ConstructorApp() {
  const globalTab = useNavStore((s) => s.activeTab)
  const setGlobalTab = useNavStore((s) => s.setTab)
  const [showAccount, setShowAccount] = useState(false)

  const resolveTab = (): ConstructorTab => {
    if (globalTab === 'tienda' || globalTab === 'proyectos' || globalTab === 'licitaciones') {
      return globalTab as ConstructorTab
    }
    return 'home'
  }

  const [localTab, setLocalTab] = useState<ConstructorTab>(resolveTab())

  const activeTab: ConstructorTab =
    globalTab === 'tienda' || globalTab === 'proyectos' || globalTab === 'licitaciones'
      ? (globalTab as ConstructorTab)
      : localTab

  const handleTabChange = (tab: ConstructorTab) => {
    setLocalTab(tab)
    setGlobalTab(tab)
  }

  const handleNavigate = (dest: string) => {
    if (dest === 'home' || dest === 'tienda' || dest === 'proyectos' || dest === 'licitaciones') {
      handleTabChange(dest as ConstructorTab)
    } else {
      setGlobalTab(dest)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: Z.bg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <DashHeader onProfile={() => setShowAccount(true)} />
      <AvatarMenu isOpen={showAccount} onClose={() => setShowAccount(false)} />

      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === 'home'         && <ConstructorHomeTab onNavigate={handleNavigate} />}
          {activeTab === 'tienda'       && <ConstructorTiendaTab />}
          {activeTab === 'proyectos'    && <ConstructorProyectosTab />}
          {activeTab === 'licitaciones' && <ConstructorLicitacionesTab />}
        </Suspense>
      </main>

      <RoleDashNav tabs={TABS} activeTab={activeTab} onTabChange={(k) => handleTabChange(k as ConstructorTab)} />
    </div>
  )
}


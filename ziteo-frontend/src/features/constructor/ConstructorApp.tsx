import React, { useState } from 'react'
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
import { ConstructorHomeTab } from './ConstructorHomeTab'
import { ConstructorTiendaTab } from './ConstructorTiendaTab'
import { ConstructorProyectosTab } from './ConstructorProyectosTab'
import { ConstructorLicitacionesTab } from './ConstructorLicitacionesTab'

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
        {activeTab === 'home'         && <ConstructorHomeTab onNavigate={handleNavigate} />}
        {activeTab === 'tienda'       && <ConstructorTiendaTab />}
        {activeTab === 'proyectos'    && <ConstructorProyectosTab />}
        {activeTab === 'licitaciones' && <ConstructorLicitacionesTab />}
      </main>

      <RoleDashNav tabs={TABS} activeTab={activeTab} onTabChange={(k) => handleTabChange(k as ConstructorTab)} />
    </div>
  )
}


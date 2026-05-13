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
import { useNavStore } from '../../shared/store/navStore'
import { useAuthStore } from '../auth/store/authStore'

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
  { key: 'licitaciones', label: 'Licitar', Icon: NavIconBids },
  { key: 'proyectos', label: 'Proyectos', Icon: NavIconProjects },
  { key: 'perfil', label: 'Perfil', Icon: NavIconUsers },
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

function TrabajadorDashNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TrabajadorTab
  onTabChange: (tab: TrabajadorTab) => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 14,
        right: 14,
        height: 58,
        borderRadius: 29,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)',
        zIndex: 30,
        padding: '0 4px',
      }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const active = activeTab === key
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            aria-label={label}
            aria-pressed={active}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              background: active ? Z.orangeLight : 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              padding: '7px 14px',
              borderRadius: 16,
              transition: 'all 0.2s ease',
              minWidth: 0,
            }}
          >
            <Icon color={active ? Z.orangeDark : Z.textMuted} size={21} />
            <span
              style={{
                fontFamily: Z.font,
                fontSize: 9.5,
                fontWeight: active ? 700 : 500,
                color: active ? Z.orangeDark : Z.textMuted,
                letterSpacing: 0.2,
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
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

  const handleProfile = () => handleTabChange('perfil')

  return (
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 92, background: Z.bg }}>
      <DashHeader onProfile={handleProfile} notifCount={currentUser ? 3 : 0} />

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
      <TrabajadorDashNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}

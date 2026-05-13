import React, { lazy, Suspense, useState } from 'react'
import { Z } from '../../shared/design/tokens'
import {
  NavIconHome,
  NavIconStore,
  NavIconProjects,
  NavIconBids,
} from '../../shared/design/shell'
import { useNavStore } from '../../shared/store/navStore'

const HomeScreen = lazy(() => import('../app/HomeScreen'))
const TiendaScreen = lazy(
  () => import('../tienda').then((m) => ({ default: m.TiendaScreen })),
)
const ProyectosScreen = lazy(
  () => import('../proyectos').then((m) => ({ default: m.ProyectosScreen })),
)
const MisLicitacionesScreen = lazy(
  () =>
    import('../licitaciones/components/MisLicitacionesScreen').then((m) => ({
      default: m.MisLicitacionesScreen,
    })),
)

type ConstructorTab = 'home' | 'tienda' | 'proyectos' | 'licitaciones'

const TABS: {
  key: ConstructorTab
  label: string
  Icon: (props: { color?: string; size?: number }) => React.ReactElement
}[] = [
  { key: 'home', label: 'Home', Icon: NavIconHome },
  { key: 'tienda', label: 'Tienda', Icon: NavIconStore },
  { key: 'proyectos', label: 'Proyectos', Icon: NavIconProjects },
  { key: 'licitaciones', label: 'Licitar', Icon: NavIconBids },
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

export function ConstructorApp() {
  const globalTab = useNavStore((s) => s.activeTab)
  const setGlobalTab = useNavStore((s) => s.setTab)

  const activeConstructorTab: ConstructorTab =
    globalTab === 'tienda' || globalTab === 'proyectos' || globalTab === 'licitaciones'
      ? (globalTab as ConstructorTab)
      : 'home'

  const [localTab, setLocalTab] = useState<ConstructorTab>(activeConstructorTab)

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
    <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 92 }}>
      <Suspense fallback={<TabSkeleton />}>
        {activeTab === 'home' && (
          <HomeScreen onNavigate={handleNavigate} />
        )}
        {activeTab === 'tienda' && <TiendaScreen />}
        {activeTab === 'proyectos' && <ProyectosScreen />}
        {activeTab === 'licitaciones' && <MisLicitacionesScreen />}
      </Suspense>

      <ConstructorDashNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}

function ConstructorDashNav({
  activeTab,
  onTabChange,
}: {
  activeTab: ConstructorTab
  onTabChange: (tab: ConstructorTab) => void
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

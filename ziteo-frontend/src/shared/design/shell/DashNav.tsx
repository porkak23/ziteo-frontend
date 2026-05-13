import { Z } from '../tokens';
import { NavIconHome, NavIconStore, NavIconProjects, NavIconBids } from './NavIcons';

interface DashNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { key: 'home',         label: 'Home',      Icon: NavIconHome },
  { key: 'tienda',       label: 'Tienda',    Icon: NavIconStore },
  { key: 'proyectos',    label: 'Proyectos', Icon: NavIconProjects },
  { key: 'licitaciones', label: 'Licitar',   Icon: NavIconBids },
] as const;

export function DashNav({ activeTab, onTabChange }: DashNavProps) {
  return (
    <div
      style={{
        position: 'absolute',
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
        zIndex: 20,
        padding: '0 4px',
      }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const active = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
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
        );
      })}
    </div>
  );
}

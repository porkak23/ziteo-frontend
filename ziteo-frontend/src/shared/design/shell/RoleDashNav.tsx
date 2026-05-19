import { Z } from '../tokens';

interface Tab {
  key: string;
  label: string;
  Icon: (props: { color?: string; size?: number }) => React.ReactElement;
}

interface RoleDashNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function RoleDashNav({ tabs, activeTab, onTabChange }: RoleDashNavProps) {
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
        background: Z.surface,
        border: `1px solid ${Z.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        zIndex: 20,
        padding: '0 4px',
      }}
    >
      {tabs.map(({ key, label, Icon }) => {
        const active = activeTab === key;
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
        );
      })}
    </div>
  );
}

export type { Tab };

import { Z } from '../tokens';
import { ZIcon } from '../components/ZIcon';
import { ZAvatar } from '../components/ZAvatar';

interface DashHeaderProps {
  onProfile: () => void;
  notifCount?: number;
}

export function DashHeader({ onProfile, notifCount = 3 }: DashHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '54px 20px 10px',
        background: Z.bg,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontFamily: Z.font,
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: 2,
          background: Z.gradMixed,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        ZITEO
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: 12,
            border: 'none',
            background: Z.surface,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <ZIcon name="bell" size={20} color={Z.textSec} />
          {notifCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: Z.orange,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: Z.font,
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                border: `2px solid ${Z.bg}`,
              }}
            >
              {notifCount}
            </div>
          )}
        </button>

        <div onClick={onProfile} style={{ cursor: 'pointer' }}>
          <ZAvatar name="JC" size={38} />
        </div>
      </div>
    </div>
  );
}

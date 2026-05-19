import { Z } from '../tokens';
import { ZIcon } from './ZIcon';
import { ZRoleIcon } from './ZIcon';

type RoleName = 'constructor' | 'vendedor' | 'trabajador' | 'repartidor';

interface ZRoleCardProps {
  role: RoleName;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

export function ZRoleCard({ role, title, description, selected, onSelect }: ZRoleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: Z.r.md,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        border: `2px solid ${selected ? Z.orange : Z.border}`,
        background: selected ? Z.orangeLight : Z.surface,
        transition: 'all 0.2s',
        boxSizing: 'border-box',
        outline: 'none',
      }}
    >
      <ZRoleIcon role={role} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: Z.font,
            fontSize: 15,
            fontWeight: 700,
            color: Z.text,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: Z.font,
            fontSize: 12,
            fontWeight: 500,
            color: Z.textSec,
            marginTop: 2,
          }}
        >
          {description}
        </div>
      </div>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          flexShrink: 0,
          border: `2px solid ${selected ? Z.orange : Z.border}`,
          background: selected ? Z.orange : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {selected && <ZIcon name="check" size={14} color="#fff" />}
      </div>
    </button>
  );
}

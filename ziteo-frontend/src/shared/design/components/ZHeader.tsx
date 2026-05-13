import { Z } from '../tokens';
import { ZIcon } from './ZIcon';

interface ZHeaderProps {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  dark?: boolean;
}

export function ZHeader({ title, onBack, right, dark = false }: ZHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '58px 16px 12px',
        position: 'relative',
        zIndex: 5,
      }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)',
          }}
        >
          <ZIcon name="arrow-left" size={22} color={dark ? '#fff' : Z.text} />
        </button>
      ) : (
        <div style={{ width: 40 }} />
      )}

      {title && (
        <span
          style={{
            fontFamily: Z.font,
            fontSize: 16,
            fontWeight: 700,
            color: dark ? '#fff' : Z.text,
          }}
        >
          {title}
        </span>
      )}

      {right ?? <div style={{ width: 40 }} />}
    </div>
  );
}

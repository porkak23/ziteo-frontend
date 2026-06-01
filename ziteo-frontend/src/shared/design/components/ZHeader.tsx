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
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 12px 0 8px',
            height: 40,
            borderRadius: 20,
            border: dark ? '1.5px solid rgba(255,255,255,0.25)' : `1.5px solid ${Z.border}`,
            cursor: 'pointer',
            background: dark ? 'rgba(255,255,255,0.12)' : Z.surface,
            boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
            outline: 'none',
            flexShrink: 0,
          }}
        >
          <ZIcon name="arrow-left" size={20} color={dark ? '#fff' : Z.text} />
          <span style={{
            fontFamily: Z.font,
            fontSize: 13,
            fontWeight: 600,
            color: dark ? '#fff' : Z.text,
            whiteSpace: 'nowrap',
          }}>
            Volver
          </span>
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

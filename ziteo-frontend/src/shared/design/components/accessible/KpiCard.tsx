import { Z } from '../../tokens';

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  onClick?: () => void;
}

/** Convierte un color hex (#RGB o #RRGGBB) a rgba con la opacidad dada. Si no es hex, lo devuelve tal cual. */
function withOpacity(color: string, opacity: number): string {
  const hex = color.trim();
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return color;
  let r: number, g: number, b: number;
  if (match[1].length === 3) {
    r = parseInt(match[1][0] + match[1][0], 16);
    g = parseInt(match[1][1] + match[1][1], 16);
    b = parseInt(match[1][2] + match[1][2], 16);
  } else {
    r = parseInt(match[1].slice(0, 2), 16);
    g = parseInt(match[1].slice(2, 4), 16);
    b = parseInt(match[1].slice(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function KpiCard({ icon, label, value, color = Z.orangeDark, onClick }: KpiCardProps) {
  const content = (
    <>
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: Z.r.full,
          background: withOpacity(color, 0.15),
          color,
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>{label}</span>
        <span style={{ fontFamily: Z.font, fontSize: 24, fontWeight: 800, color: Z.text }}>{value}</span>
      </span>
    </>
  );

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    minHeight: 72,
    width: '100%',
    boxSizing: 'border-box',
    background: Z.surface,
    borderRadius: Z.r.md,
    padding: '14px 16px',
    border: `1px solid ${Z.border}`,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}: ${value}`}
        style={{
          ...baseStyle,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: Z.font,
          outline: 'none',
        }}
      >
        {content}
        <span
          aria-hidden="true"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: Z.textSec, fontSize: 20, flexShrink: 0 }}
        >
          <svg width="10" height="16" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1l6 6-6 6" stroke={Z.textSec} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    );
  }

  return <div style={baseStyle}>{content}</div>;
}

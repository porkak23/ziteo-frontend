import { Z } from '../tokens';

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

export function SummaryCard({ icon, label, value, color = Z.orange }: SummaryCardProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: '14px 12px',
        borderRadius: Z.r.md,
        background: Z.surface,
        border: `1px solid ${Z.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: color + '15',
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: Z.font,
          fontSize: 20,
          fontWeight: 800,
          color: Z.text,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: Z.font,
          fontSize: 10,
          fontWeight: 600,
          color: Z.textMuted,
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
    </div>
  );
}

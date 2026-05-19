import { Z } from '../tokens';

interface ActivityItemProps {
  title: string;
  subtitle: string;
  time: string;
  color?: string;
}

export function ActivityItem({ title, subtitle, time, color = Z.orange }: ActivityItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: `1px solid ${Z.divider}`,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          marginTop: 2,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: Z.font,
            fontSize: 13,
            fontWeight: 600,
            color: Z.text,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: Z.font,
            fontSize: 11,
            fontWeight: 500,
            color: Z.textMuted,
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>
      </div>
      <span
        style={{
          fontFamily: Z.font,
          fontSize: 10,
          fontWeight: 500,
          color: Z.textMuted,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {time}
      </span>
    </div>
  );
}

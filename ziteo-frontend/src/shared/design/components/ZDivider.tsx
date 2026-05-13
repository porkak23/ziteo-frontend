import { Z } from '../tokens';

interface ZDividerProps {
  text?: string;
}

export function ZDivider({ text }: ZDividerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '4px 0',
      }}
    >
      <div style={{ flex: 1, height: 1, background: Z.border }} />
      {text && (
        <span
          style={{
            fontFamily: Z.font,
            fontSize: 12,
            fontWeight: 600,
            color: Z.textMuted,
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: Z.border }} />
    </div>
  );
}

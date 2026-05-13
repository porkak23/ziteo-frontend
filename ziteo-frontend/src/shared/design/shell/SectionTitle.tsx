import { Z } from '../tokens';

interface SectionTitleProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionTitle({ title, action, onAction }: SectionTitleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontFamily: Z.font,
          fontSize: 16,
          fontWeight: 800,
          color: Z.text,
        }}
      >
        {title}
      </span>
      {action && (
        <span
          onClick={onAction}
          style={{
            fontFamily: Z.font,
            fontSize: 12,
            fontWeight: 600,
            color: Z.orange,
            cursor: 'pointer',
          }}
        >
          {action}
        </span>
      )}
    </div>
  );
}

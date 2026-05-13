import { Z } from '../tokens';

interface ZScreenProps {
  children: React.ReactNode;
  bg?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ZScreen({ children, bg = Z.bg, className, style = {} }: ZScreenProps) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        animation: 'zFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

import { Z } from '../tokens';

interface ZAvatarProps {
  name?: string;
  size?: number;
  gradient?: boolean;
}

export function ZAvatar({ name = '', size = 96, gradient = true }: ZAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradient ? Z.gradOrange : Z.orangeLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(232,115,58,0.25)',
        border: gradient ? 'none' : `3px solid ${Z.orange}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: Z.font,
          fontSize: size * 0.35,
          fontWeight: 800,
          color: gradient ? '#FFFFFF' : Z.orangeDark,
          letterSpacing: 1,
        }}
      >
        {initials || 'U'}
      </span>
    </div>
  );
}

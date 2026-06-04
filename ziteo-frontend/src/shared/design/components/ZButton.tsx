import { useState } from 'react';
import { Z } from '../tokens';

type ButtonVariant = 'primary' | 'secondary' | 'blue' | 'ghost' | 'social' | 'danger';

interface ZButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: Z.orangeDark, color: '#FFFFFF', border: 'none' },
  secondary: { background: 'transparent', color: Z.orangeDark, border: `2px solid ${Z.orangeDark}` },
  blue:      { background: Z.blueDark, color: '#FFFFFF', border: 'none' },
  ghost:     { background: 'transparent', color: Z.textSec, border: 'none' },
  social:    { background: Z.surface, color: Z.text, border: `1.5px solid ${Z.border}` },
  danger:    { background: Z.errorBg, color: Z.error, border: `1.5px solid var(--color-error-container)` },
};

export function ZButton({
  children,
  variant = 'primary',
  fullWidth = true,
  disabled = false,
  onClick,
  style = {},
  icon,
  type = 'button',
}: ZButtonProps) {
  const [pressed, setPressed] = useState(false);
  const v = variantStyles[variant];

  return (
    <button
      type={type}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
      onClick={onClick}
      style={{
        fontFamily: Z.font,
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        padding: '15px 24px',
        borderRadius: Z.r.md,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.45 : 1,
        transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        boxSizing: 'border-box',
        outline: 'none',
        ...v,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

import { useState } from 'react';
import { Z } from '../../tokens';

type BigActionVariant = 'primary' | 'secondary' | 'success' | 'danger';

interface BigActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  variant?: BigActionVariant;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  testId?: string;
  /** Set false to render at intrinsic width instead of 100%. */
  fullWidth?: boolean;
}

// No hay token verde en Z; se define localmente para el variant "success".
const SUCCESS_GREEN = '#1B8A5A';
const DANGER_RED = '#C0392B';

const variantStyles: Record<BigActionVariant, React.CSSProperties> = {
  primary:   { background: Z.orangeDark, color: '#FFFFFF', border: 'none' },
  secondary: { background: Z.surface, color: Z.text, border: `1.5px solid ${Z.border}` },
  success:   { background: SUCCESS_GREEN, color: '#FFFFFF', border: 'none' },
  danger:    { background: DANGER_RED, color: '#FFFFFF', border: 'none' },
};

export function BigActionButton({
  label,
  icon,
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  testId,
  fullWidth = true,
}: BigActionButtonProps) {
  const [pressed, setPressed] = useState(false);
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      data-testid={testId}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={isDisabled}
      onClick={onClick}
      style={{
        fontFamily: Z.font,
        fontWeight: 800,
        fontSize: 17,
        minHeight: 56,
        borderRadius: Z.r.md,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: fullWidth ? '100%' : 'auto',
        padding: '14px 20px',
        boxSizing: 'border-box',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transform: pressed && !isDisabled ? 'scale(0.97)' : 'scale(1)',
        transition: 'all 0.15s ease',
        outline: 'none',
        ...v,
      }}
    >
      {!loading && icon && (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, fontSize: 22 }}>
          {icon}
        </span>
      )}
      <span>{loading ? 'Espere...' : label}</span>
    </button>
  );
}

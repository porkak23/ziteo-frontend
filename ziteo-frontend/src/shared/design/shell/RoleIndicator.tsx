type RoleKey = 'constructor' | 'vendedor' | 'trabajador' | 'repartidor';

interface RoleIndicatorProps {
  role: RoleKey;
  onChangeRole: () => void;
}

const ROLE_CFG: Record<RoleKey, { label: string; color: string }> = {
  constructor: { label: 'Constructor', color: '#E8733A' },
  vendedor:    { label: 'Vendedor',    color: '#3A7BD5' },
  trabajador:  { label: 'Trabajador',  color: '#16A34A' },
  repartidor:  { label: 'Repartidor',  color: '#9333EA' },
};

export function RoleIndicator({ role, onChangeRole }: RoleIndicatorProps) {
  const cfg = ROLE_CFG[role];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 22,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(12,15,30,0.9)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 28,
        padding: '9px 18px 9px 12px',
        zIndex: 300,
        boxShadow: '0 4px 28px rgba(0,0,0,0.55)',
        animation: 'zFadeIn 0.3s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: cfg.color,
          boxShadow: `0 0 8px ${cfg.color}99`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.8)',
          letterSpacing: 0.8,
        }}
      >
        {cfg.label}
      </span>
      <div
        style={{
          width: 1,
          height: 13,
          background: 'rgba(255,255,255,0.14)',
          margin: '0 2px',
        }}
      />
      <span
        onClick={onChangeRole}
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.42)',
          cursor: 'pointer',
          letterSpacing: 0.3,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.42)')}
      >
        ← Cambiar rol
      </span>
    </div>
  );
}

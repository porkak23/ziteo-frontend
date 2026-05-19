import { Z } from '../tokens';

interface ProductCardProps {
  name: string;
  brand?: string;
  price: string | number;
  unit?: string;
  image?: string;
  onTap?: () => void;
}

export function ProductCard({ name, brand, price, unit, image, onTap }: ProductCardProps) {
  return (
    <button
      onClick={onTap}
      style={{
        width: '100%',
        background: Z.surface,
        borderRadius: Z.r.md,
        border: `1px solid ${Z.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        outline: 'none',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div
        style={{
          height: 110,
          background: `linear-gradient(135deg, ${Z.divider} 0%, ${Z.blueLight} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          fontSize: 10,
          color: Z.textMuted,
          textAlign: 'center',
          padding: 8,
        }}
      >
        {image || 'foto producto'}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div
          style={{
            fontFamily: Z.font,
            fontSize: 12,
            fontWeight: 700,
            color: Z.text,
            lineHeight: 1.3,
          }}
        >
          {name}
        </div>
        {brand && (
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 10,
              fontWeight: 500,
              color: Z.textMuted,
              marginTop: 2,
            }}
          >
            {brand}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
            marginTop: 6,
          }}
        >
          <span
            style={{
              fontFamily: Z.font,
              fontSize: 16,
              fontWeight: 800,
              color: Z.orangeDark,
            }}
          >
            Bs {price}
          </span>
          {unit && (
            <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>
              /{unit}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

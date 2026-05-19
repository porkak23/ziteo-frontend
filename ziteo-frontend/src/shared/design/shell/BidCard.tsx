import { Z } from '../tokens';

interface BidCardProps {
  title: string;
  specialty: string;
  budget: string | number;
  city: string;
  offers: number;
  status: string;
  onTap?: () => void;
}

export function BidCard({ title, specialty, budget, city, offers, status, onTap }: BidCardProps) {
  const isActive = status === 'Activa';

  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '16px',
        borderRadius: Z.r.md,
        background: Z.surface,
        border: `1px solid ${Z.border}`,
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left',
        outline: 'none',
      }}
    >
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
            fontSize: 15,
            fontWeight: 700,
            color: Z.text,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: Z.font,
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 20,
            background: isActive ? Z.orangeLight : Z.divider,
            color: isActive ? Z.orangeDark : Z.textMuted,
          }}
        >
          {status}
        </span>
      </div>
      <div
        style={{
          fontFamily: Z.font,
          fontSize: 12,
          fontWeight: 500,
          color: Z.textSec,
        }}
      >
        {specialty}
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <span
          style={{
            fontFamily: Z.font,
            fontSize: 12,
            fontWeight: 600,
            color: Z.text,
          }}
        >
          Bs {budget}
        </span>
        <span
          style={{
            fontFamily: Z.font,
            fontSize: 11,
            color: Z.textMuted,
          }}
        >
          {city}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: Z.font,
            fontSize: 12,
            fontWeight: 700,
            color: isActive ? Z.orange : Z.textMuted,
          }}
        >
          {offers} ofertas
        </span>
      </div>
    </button>
  );
}

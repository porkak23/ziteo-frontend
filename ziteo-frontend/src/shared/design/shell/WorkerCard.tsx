import { Z } from '../tokens';
import { IconStar, IconVerified } from './NavIcons';

interface WorkerCardProps {
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  verified?: boolean;
  onTap?: () => void;
}

export function WorkerCard({ name, specialty, experience, rating, verified, onTap }: WorkerCardProps) {
  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px',
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
        aria-hidden="true"
        style={{
          width: 50,
          height: 50,
          borderRadius: 14,
          flexShrink: 0,
          background: Z.orangeLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: Z.font,
          fontSize: 16,
          fontWeight: 700,
          color: Z.orangeDark,
        }}
      >
        {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: Z.font,
              fontSize: 14,
              fontWeight: 700,
              color: Z.text,
            }}
          >
            {name}
          </span>
          {verified && <IconVerified size={14} />}
        </div>
        <div
          style={{
            fontFamily: Z.font,
            fontSize: 11,
            fontWeight: 500,
            color: Z.textSec,
            marginTop: 2,
          }}
        >
          {specialty} · {experience}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <IconStar size={13} />
        <span
          style={{
            fontFamily: Z.font,
            fontSize: 13,
            fontWeight: 700,
            color: Z.text,
          }}
        >
          {rating}
        </span>
      </div>
    </button>
  );
}

import { Z } from '../tokens';

interface FilterBarProps {
  options: string[];
  active: string;
  onChange: (opt: string) => void;
}

export function FilterBar({ options, active, onChange }: FilterBarProps) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            fontFamily: Z.font,
            fontSize: 12,
            fontWeight: active === opt ? 700 : 500,
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            background: active === opt ? Z.orangeDark : Z.surface,
            color: active === opt ? '#fff' : Z.textSec,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            outline: 'none',
            boxShadow: active === opt ? 'none' : `0 0 0 1px ${Z.border}`,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

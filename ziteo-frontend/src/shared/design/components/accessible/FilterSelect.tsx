import { Z } from '../../tokens';

interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  allLabel?: string;
}

export function FilterSelect({ label, value, onChange, options, allLabel = 'Todos' }: FilterSelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <label
        style={{
          fontFamily: Z.font,
          fontSize: 14,
          fontWeight: 600,
          color: Z.text,
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative', width: '100%' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            fontFamily: Z.font,
            fontSize: 16,
            fontWeight: 500,
            color: Z.text,
            minHeight: 52,
            width: '100%',
            boxSizing: 'border-box',
            border: `1.5px solid ${Z.border}`,
            borderRadius: Z.r.sm,
            background: Z.surface,
            padding: '12px 40px 12px 14px',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">{allLabel}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            display: 'flex',
          }}
        >
          <svg width="16" height="9" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1l5 5 5-5" stroke={Z.textSec} strokeWidth={2} fill="none" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

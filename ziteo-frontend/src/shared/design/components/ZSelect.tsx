import { Z } from '../tokens';

interface SelectOption {
  value: string;
  label: string;
}

interface ZSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
}

export function ZSelect({ label, value, onChange, options, placeholder }: ZSelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          style={{
            fontFamily: Z.font,
            fontSize: 13,
            fontWeight: 600,
            color: Z.textSec,
          }}
        >
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontFamily: Z.font,
          fontSize: 15,
          fontWeight: 500,
          color: value ? Z.text : Z.textMuted,
          padding: '14px',
          borderRadius: Z.r.sm,
          border: `1.5px solid ${Z.border}`,
          background: Z.surface,
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          width: '100%',
          boxSizing: 'border-box' as const,
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(o => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}

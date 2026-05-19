import { Z } from '../tokens'

interface FilterBarProps {
  options: string[]
  active: string
  onChange: (value: string) => void
  label?: string
}

export function FilterBar({ options, active, onChange, label }: FilterBarProps) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', minWidth: 160 }}>
      <select
        value={active}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          background: Z.surface,
          border: `1.5px solid ${Z.border}`,
          borderRadius: 10,
          padding: '8px 36px 8px 14px',
          fontFamily: Z.font,
          fontSize: 13,
          fontWeight: 600,
          color: Z.text,
          cursor: 'pointer',
          width: '100%',
          outline: 'none',
        }}
        aria-label={label ?? 'Filtro'}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <svg
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        width="16" height="16" viewBox="0 0 24 24" fill="none"
      >
        <path d="M6 9l6 6 6-6" stroke={Z.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

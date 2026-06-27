interface IconProps { color?: string; size?: number }

export function IconMoto({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 40 30" fill="none" aria-hidden="true">
      <circle cx="8"  cy="24" r="5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="32" cy="24" r="5" stroke={color} strokeWidth="2" fill="none" />
      <path d="M8 24L12 14L18 12H24L28 16L32 24M24 12L27 8H30M18 12V16H25"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function IconCamioneta({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 0.65)} viewBox="0 0 42 28" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="38" height="15" rx="2.5" stroke={color} strokeWidth="2" fill="none" />
      <path d="M4 7h13v9H4V7z" stroke={color} strokeWidth="1.6" fill="none" />
      <circle cx="9"  cy="22" r="4" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="33" cy="22" r="4" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  )
}

export function IconPickup({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 0.6)} viewBox="0 0 44 26" fill="none" aria-hidden="true">
      <path d="M2 20V10a2 2 0 012-2h14v12H2z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M4 11h10v5H4v-5z" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M18 13h22v7H18v-7z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
      <circle cx="9"  cy="21.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="34" cy="21.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  )
}

export function IconCamion({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={Math.round(size * 0.55)} viewBox="0 0 54 30" fill="none" aria-hidden="true">
      <path d="M2 22V9a2 2 0 012-2h12v15H2z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M4 10h8v8H4v-8z" stroke={color} strokeWidth="1.5" fill="none" />
      <rect x="16" y="4" width="35" height="18" rx="2" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="9"  cy="23.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="36" cy="23.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="44" cy="23.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  )
}

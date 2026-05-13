import { Z } from '../tokens';

type IconName =
  | 'arrow-left'
  | 'eye'
  | 'eye-off'
  | 'check'
  | 'phone'
  | 'search'
  | 'settings'
  | 'logout'
  | 'sun'
  | 'moon'
  | 'fingerprint'
  | 'close'
  | 'bell'
  | 'map-pin';

type RoleName = 'constructor' | 'vendedor' | 'trabajador' | 'repartidor';

interface ZIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

interface ZRoleIconProps {
  role: RoleName;
  size?: number;
}

export function ZIcon({ name, size = 24, color = Z.text, style = {} }: ZIconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    'arrow-left': <path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    'eye': <><ellipse cx="12" cy="12" rx="9" ry="6" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" fill="none"/></>,
    'eye-off': <><path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 003.3 3.1M6.7 6.7C4.3 8.3 3 12 3 12s4 7 9 7c1.8 0 3.4-.7 4.8-1.7" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M14 5.5C13.4 5.2 12.7 5 12 5c-5 0-9 7-9 7s1.3 3.7 3.7 5.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/></>,
    'check': <path d="M5 12l5 5L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    'phone': <><rect x="6" y="2" width="12" height="20" rx="2.5" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="12" cy="18" r="1" fill={color}/></>,
    'search': <><circle cx="10.5" cy="10.5" r="6" stroke={color} strokeWidth="1.8" fill="none"/><path d="M15 15l5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    'settings': <><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" fill="none"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    'logout': <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    'sun': <><circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" fill="none"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
    'moon': <path d="M21 12.8A9 9 0 0111.2 3a7 7 0 109.8 9.8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>,
    'fingerprint': <><path d="M12 2a10 10 0 00-7.4 16.6M12 2a10 10 0 017.4 16.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/><path d="M12 8a4 4 0 00-4 4c0 2.2.8 4.2 2 5.6M12 8a4 4 0 014 4c0 2.2-.8 4.2-2 5.6M12 11v4" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/></>,
    'close': <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>,
    'bell': <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    'map-pin': <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" fill="none"/></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
      {paths[name] ?? null}
    </svg>
  );
}

export function ZRoleIcon({ role, size = 44 }: ZRoleIconProps) {
  const icons: Record<RoleName, React.ReactNode> = {
    constructor: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="8" y="28" width="32" height="14" rx="2" fill={Z.orangeDark} opacity="0.15"/>
        <rect x="12" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
        <rect x="21" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
        <rect x="30" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
        <path d="M6 28h36" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M14 28V18l10-8 10 8v10" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
        <rect x="20" y="20" width="8" height="8" rx="1.5" stroke={Z.orange} strokeWidth="2" fill="none"/>
      </svg>
    ),
    vendedor: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="8" y="20" width="32" height="22" rx="3" fill={Z.blue} opacity="0.12"/>
        <path d="M8 20h32" stroke={Z.blueDark} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M6 20c0 0 4-10 18-10s18 10 18 10" stroke={Z.blue} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <rect x="18" y="28" width="12" height="14" rx="2" stroke={Z.blueDark} strokeWidth="2" fill={Z.blue} opacity="0.2"/>
        <circle cx="24" cy="34" r="1.5" fill={Z.blueDark}/>
      </svg>
    ),
    trabajador: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M18 10l-8 8 3 3 8-8M30 38l8-8-3-3-8 8" stroke={Z.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 34l20-20" stroke={Z.orangeDark} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="14" cy="34" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
        <circle cx="34" cy="14" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
      </svg>
    ),
    repartidor: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="4" y="16" width="24" height="18" rx="3" stroke={Z.blueDark} strokeWidth="2.5" fill={Z.blue} opacity="0.1"/>
        <path d="M28 22h10l6 8v4h-16v-12z" stroke={Z.blueDark} strokeWidth="2.5" strokeLinejoin="round" fill={Z.blue} opacity="0.1"/>
        <circle cx="14" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white"/>
        <circle cx="38" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white"/>
        <circle cx="14" cy="36" r="1.5" fill={Z.blueDark}/>
        <circle cx="38" cy="36" r="1.5" fill={Z.blueDark}/>
      </svg>
    ),
  };

  return <>{icons[role] ?? null}</>;
}

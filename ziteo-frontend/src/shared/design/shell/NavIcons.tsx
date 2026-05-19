import { Z } from '../tokens';

interface NavIconProps {
  color?: string;
  size?: number;
}

export function NavIconHome({ color = Z.textMuted, size = 22 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4v-6h-8v6H4a1 1 0 01-1-1V10.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function NavIconStore({ color = Z.textMuted, size = 22 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 7v13a1 1 0 001 1h16a1 1 0 001-1V7l-3-5H6z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
      <path d="M3 7h18" stroke={color} strokeWidth="1.8"/>
      <path d="M16 11a4 4 0 01-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export function NavIconProjects({ color = Z.textMuted, size = 22 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function NavIconBids({ color = Z.textMuted, size = 22 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M16 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
      <path d="M16 3v5h5M8 13h8M8 17h5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function NavIconCart({ color = Z.textMuted, size = 22 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="21" r="1" fill={color}/>
      <circle cx="20" cy="21" r="1" fill={color}/>
      <path d="M1 1h4l2.7 13.4a1 1 0 001 .8h9.7a1 1 0 001-.8L21 7H6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function NavIconTruck({ color = Z.textMuted, size = 22 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="5" width="14" height="12" rx="1.5" stroke={color} strokeWidth="1.8" fill="none"/>
      <path d="M15 9h4l3 4v4h-7V9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
      <circle cx="6" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none"/>
      <circle cx="19" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none"/>
    </svg>
  );
}

export function NavIconUsers({ color = Z.textMuted, size = 22 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" fill="none"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export function NavIconPlus({ color = '#fff', size = 20 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export function NavIconMsg({ color = '#fff', size = 22 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

/** Amber star — #F59E0B is a standard Tailwind amber-400, not a Z brand hex. */
export function IconStar({ color = '#F59E0B', size = 14 }: NavIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2l-5-4.9 6.9-1L12 2z" fill={color}/>
    </svg>
  );
}

export function IconVerified({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill={Z.blue}/>
      <path d="M8 12l3 3 5-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

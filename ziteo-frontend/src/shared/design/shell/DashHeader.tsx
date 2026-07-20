import { Z } from '../tokens'
import { ZAvatar } from '../components/ZAvatar'
import { useAuthStore } from '../../../features/auth/store/authStore'

interface DashHeaderProps {
  onProfile: () => void
  onTrack?: () => void
  onBell?: () => void
  unreadCount?: number
  /** @deprecated use unreadCount */
  notifCount?: number
  /** @deprecated use onTrack */
  onChat?: () => void
  chatBadge?: number
}

const ROLE_LABELS: Record<string, string> = {
  constructor: 'Constructor',
  proveedor:   'Vendedor',
  maestro:     'Maestro',
  chofer:      'Chofer',
  admin:       'Admin',
}

export function DashHeader({
  onProfile,
  onTrack,
  onChat,
  onBell,
  unreadCount,
  notifCount = 0,
  chatBadge = 0,
}: DashHeaderProps) {
  const user = useAuthStore((s) => s.user)
  const initials = user?.name ? user.name.trim().charAt(0).toUpperCase() : '?'
  const activeRole = useAuthStore((s) => s.user?.active_role)

  // Support legacy notifCount prop
  const bellCount = unreadCount !== undefined ? unreadCount : notifCount

  // Support legacy onChat prop
  const trackHandler = onTrack ?? onChat

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 'max(env(safe-area-inset-top), 10px)',
      paddingBottom: 10,
      paddingLeft: 20,
      paddingRight: 20,
      background: Z.bg,
      borderBottom: `1px solid ${Z.border}`,
      flexShrink: 0,
    }}>
      {/* Logo + Role pill */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{
          fontFamily: Z.font,
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: 2,
          color: Z.orange,
        }}>
          ZITEO
        </span>
        {activeRole && ROLE_LABELS[activeRole] && (
          <span style={{
            fontFamily: Z.font,
            fontSize: 10,
            fontWeight: 700,
            background: Z.orangeLight,
            color: Z.orangeDark,
            padding: '3px 8px',
            borderRadius: 20,
            marginLeft: 8,
            letterSpacing: 0.3,
          }}>
            {ROLE_LABELS[activeRole]}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Track / transport button */}
        {trackHandler && (
          <button
            onClick={trackHandler}
            style={{
              position: 'relative',
              width: 38, height: 38,
              borderRadius: 12,
              border: 'none',
              background: Z.surface,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 0 1px ${Z.border}`,
            }}
            aria-label="Seguimiento de transporte"
          >
            {/* Truck / tracking SVG icon */}
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <path d="M1 3h15v13H1V3z" stroke={Z.textSec} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
              <path d="M16 8h4l3 3v5h-7V8z" stroke={Z.textSec} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
              <circle cx="5.5" cy="18.5" r="2.5" stroke={Z.textSec} strokeWidth="1.8" fill="none" />
              <circle cx="18.5" cy="18.5" r="2.5" stroke={Z.textSec} strokeWidth="1.8" fill="none" />
            </svg>
            {chatBadge > 0 && (
              <div style={{
                position: 'absolute', top: -2, right: -2,
                width: 18, height: 18, borderRadius: '50%',
                background: Z.orange,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: Z.font, fontSize: 10, fontWeight: 700, color: '#fff',
                border: `2px solid ${Z.bg}`,
              }}>
                {chatBadge > 9 ? '9+' : chatBadge}
              </div>
            )}
          </button>
        )}

        {/* Bell button */}
        <button
          onClick={onBell}
          style={{
            position: 'relative',
            width: 38, height: 38,
            borderRadius: 12,
            border: 'none',
            background: Z.surface,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          aria-label="Notificaciones"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
              stroke={Z.textSec} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {bellCount > 0 && (
            <div style={{
              position: 'absolute', top: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: Z.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: Z.font, fontSize: 10, fontWeight: 700, color: '#fff',
              border: `2px solid ${Z.bg}`,
            }}>
              {bellCount > 9 ? '9+' : bellCount}
            </div>
          )}
        </button>

        {/* Avatar → opens profile/role menu */}
        <button
          onClick={onProfile}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Menú de perfil"
        >
          <ZAvatar name={initials} size={38} />
        </button>
      </div>
    </div>
  )
}

import { Z } from '@/shared/design/tokens'
import { ZAvatar } from '@/shared/design/components/ZAvatar'
import { useAuthStore } from '@/features/auth/store/authStore'

interface RepartidorHeaderNavProps {
  onProfile?: () => void
}

/**
 * Transparent overlay header for the Radar tab.
 * Position: absolute, top:0, z-index:10.
 * pointer-events:none on the wrapper so the map underneath is still interactive.
 * Interactive children (logo tap, avatar) get pointer-events:auto.
 */
export function RepartidorHeaderNav({ onProfile }: RepartidorHeaderNavProps) {
  const user = useAuthStore((s) => s.user)
  const displayName = user?.name ?? 'C'

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '54px 20px 10px',
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontFamily: Z.font,
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: 2,
          background: Z.gradMixed,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          pointerEvents: 'auto',
          textShadow: 'none',
          // subtle shadow so logo is legible over the map
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))',
        }}
      >
        ZITEO
      </span>

      {/* Avatar */}
      <div
        onClick={onProfile}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onProfile?.() }}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        aria-label="Perfil"
      >
        <ZAvatar name={displayName} size={38} />
      </div>
    </div>
  )
}

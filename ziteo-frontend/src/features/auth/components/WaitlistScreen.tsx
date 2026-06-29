import { Z } from '@/shared/design/tokens'
import { LAUNCH_CONFIG } from '@/shared/utils/launchConfig'

interface WaitlistScreenProps {
  name: string
  city: string
  onLogout: () => void
}

export default function WaitlistScreen({ name, city, onLogout }: WaitlistScreenProps) {
  const openDate = new Date(LAUNCH_CONFIG.fullOpenDate)
  const openDateStr = openDate.toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: Z.bg }}
    >
      {/* Top spacer */}
      <div style={{ flexShrink: 0, paddingTop: 'env(safe-area-inset-top, 48px)' }} />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col justify-center"
        style={{ padding: '0 28px', gap: 0, animation: 'zFadeSlideIn 0.4s ease' }}
      >
        {/* Brand label */}
        <div
          style={{
            fontFamily: Z.font,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: Z.orange,
            marginBottom: 20,
          }}
        >
          Ziteoo
        </div>

        {/* Greeting */}
        <h1
          style={{
            fontFamily: Z.font,
            fontSize: 26,
            fontWeight: 800,
            color: Z.text,
            margin: '0 0 12px',
            lineHeight: 1.2,
          }}
        >
          Hola, {name.split(' ')[0]}
        </h1>

        {/* Main message */}
        <p
          style={{
            fontFamily: Z.font,
            fontSize: 15,
            fontWeight: 500,
            color: Z.textSec,
            lineHeight: 1.65,
            margin: '0 0 8px',
          }}
        >
          Estás en nuestra lista de espera para{' '}
          <span style={{ color: Z.text, fontWeight: 700 }}>{city}</span>.
        </p>
        <p
          style={{
            fontFamily: Z.font,
            fontSize: 15,
            fontWeight: 400,
            color: Z.textSec,
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Te notificaremos cuando Ziteoo esté disponible en tu ciudad. La apertura está programada
          para el <span style={{ color: Z.text, fontWeight: 600 }}>{openDateStr}</span>.
        </p>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: Z.divider,
            margin: '28px 0',
          }}
        />

        {/* City info */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: Z.r.md,
            background: Z.surface,
            border: `1px solid ${Z.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 11,
              fontWeight: 600,
              color: Z.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            Tu cuenta
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 14, color: Z.text, fontWeight: 600 }}>
            {name}
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec }}>
            {city}
          </div>
        </div>

        {/* Currently open cities info */}
        <p
          style={{
            fontFamily: Z.font,
            fontSize: 13,
            color: Z.textMuted,
            lineHeight: 1.6,
            margin: '20px 0 0',
          }}
        >
          Actualmente Ziteoo opera en{' '}
          {LAUNCH_CONFIG.open.join(' y ')}.
        </p>
      </div>

      {/* Footer with logout */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 28px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          borderTop: `1px solid ${Z.divider}`,
        }}
      >
        <button
          type="button"
          onClick={onLogout}
          style={{
            fontFamily: Z.font,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            padding: '15px 24px',
            borderRadius: Z.r.md,
            background: 'transparent',
            color: Z.textSec,
            border: `1.5px solid ${Z.border}`,
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s ease',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

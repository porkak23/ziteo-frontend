import { useState } from 'react'
import { Z } from '@/shared/design/tokens'
import LegalModal, { type LegalDocType } from '@/shared/components/LegalModal'

interface WelcomeScreenProps {
  onNavigate: (dest: string) => void
}

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  const [legalModal, setLegalModal] = useState<LegalDocType | null>(null)

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: Z.navy }}
    >
      {/* Hero image area */}
      <div
        className="relative overflow-hidden"
        style={{ height: '55%', background: Z.navy }}
      >
        <img
          src="/welcome-hero.jpg"
          alt="Obrero boliviano en obra con casco Ziteoo"
          loading="eager"
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
          }}
        />
        {/* Dark gradient overlay for text legibility on the content below */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(13,16,32,0) 0%, rgba(13,16,32,0.35) 60%, ${Z.navy} 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col justify-center"
        style={{
          padding: '0 28px',
          gap: 12,
          animation: 'zFadeSlideIn 0.5s ease 0.2s both',
        }}
      >
        <h2
          style={{
            fontFamily: Z.font,
            fontWeight: 800,
            fontSize: 30,
            color: '#FFFFFF',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          Bienvenido a<br />
          <span
            style={{
              color: Z.orange,
            }}
          >
            ZITEO
          </span>
        </h2>

        <p
          style={{
            fontFamily: Z.font,
            fontSize: 14,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Conecta con proveedores, maestros de obra y transportistas. Todo lo que necesitas para construir, en un solo lugar.
        </p>

        <div className="flex flex-col" style={{ gap: 12, marginTop: 12 }}>
          <button
            data-testid="welcome-register-btn"
            onClick={() => onNavigate('register')}
            style={{
              fontFamily: Z.font, fontWeight: 700, fontSize: 14,
              letterSpacing: '0.3px', textTransform: 'uppercase',
              padding: '15px 24px', borderRadius: Z.r.md,
              background: Z.orangeDark, color: '#FFFFFF',
              border: 'none', cursor: 'pointer', width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            Registrarme
          </button>
          <button
            data-testid="welcome-login-btn"
            onClick={() => onNavigate('already-registered')}
            style={{
              fontFamily: Z.font, fontWeight: 700, fontSize: 14,
              letterSpacing: '0.3px', textTransform: 'uppercase',
              padding: '15px 24px', borderRadius: Z.r.md,
              background: 'transparent',
              color: '#FFFFFF',
              border: '2px solid rgba(255,255,255,0.25)',
              cursor: 'pointer', width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            Ya estoy registrado
          </button>
        </div>

        {/* Legal footer */}
        <p
          style={{
            fontFamily: Z.font,
            fontSize: 11,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6,
            margin: '8px 0 0',
            textAlign: 'center',
          }}
        >
          Al usar Ziteoo aceptas nuestros{' '}
          <button
            type="button"
            onClick={() => setLegalModal('terminos')}
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: Z.font,
              fontSize: 'inherit',
              display: 'inline',
            }}
          >
            Términos de Uso
          </button>
          {' '}y nuestra{' '}
          <button
            type="button"
            onClick={() => setLegalModal('privacidad')}
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: Z.font,
              fontSize: 'inherit',
              display: 'inline',
            }}
          >
            Política de Privacidad
          </button>
        </p>
      </div>

      {/* Legal modals */}
      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </div>
  )
}

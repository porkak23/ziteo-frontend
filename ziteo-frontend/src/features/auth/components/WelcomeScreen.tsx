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
        style={{
          height: '55%',
          background: `
            linear-gradient(180deg, rgba(13,16,32,0.2) 0%, rgba(13,16,32,0.7) 80%, ${Z.navy} 100%),
            linear-gradient(135deg, #2D1B0E 0%, #1A1520 50%, #0D1530 100%)
          `,
        }}
      >
        {/* Construction image placeholder */}
        <div className="absolute inset-0 flex items-center justify-center flex-col" style={{ gap: 8 }}>
          <div
            style={{
              padding: '12px 20px',
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 12,
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'rgba(255,255,255,0.2)',
              textAlign: 'center',
              lineHeight: 1.6,
              letterSpacing: 0.5,
            }}
          >
            foto de obrero boliviano<br />trabajando en obra
          </div>
        </div>

        {/* Geometric accents */}
        <div
          className="absolute"
          style={{
            top: '30%', left: -20, width: 60, height: 60,
            border: '1.5px solid rgba(232,115,58,0.2)',
            borderRadius: 12,
            transform: 'rotate(45deg)',
          }}
        />
        <div
          className="absolute"
          style={{
            top: '20%', right: -10, width: 40, height: 40,
            border: '1.5px solid rgba(58,123,213,0.2)',
            borderRadius: 8,
            transform: 'rotate(30deg)',
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
              background: Z.gradMixed,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
            onClick={() => onNavigate('login')}
            style={{
              fontFamily: Z.font, fontWeight: 700, fontSize: 14,
              letterSpacing: '0.3px', textTransform: 'uppercase',
              padding: '15px 24px', borderRadius: Z.r.md,
              background: Z.orangeDark, color: '#FFFFFF',
              border: 'none', cursor: 'pointer', width: '100%',
              transition: 'all 0.15s ease',
            }}
          >
            Inicia Sesión
          </button>
          <button
            onClick={() => onNavigate('register')}
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
            Crear Cuenta
          </button>
        </div>

        {/* Legal footer */}
        <p
          style={{
            fontFamily: Z.font,
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            lineHeight: 1.6,
            margin: '8px 0 0',
            textAlign: 'center',
          }}
        >
          Al usar Ziteo aceptas nuestros{' '}
          <span
            onClick={() => setLegalModal('terminos')}
            style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Términos de Uso
          </span>
          {' '}y nuestra{' '}
          <span
            onClick={() => setLegalModal('privacidad')}
            style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Política de Privacidad
          </span>
        </p>
      </div>

      {/* Legal modals */}
      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </div>
  )
}

import { useEffect } from 'react'
import { Z } from '@/shared/design/tokens'
import TerminosDeUso from '@/features/legal/TerminosDeUso'
import PoliticaDePrivacidad from '@/features/legal/PoliticaDePrivacidad'
import PoliticaDeDevoluciones from '@/features/legal/PoliticaDeDevoluciones'

export type LegalDocType = 'terminos' | 'privacidad' | 'devoluciones'

interface LegalModalProps {
  type: LegalDocType
  onClose: () => void
}

const DOC_TITLES: Record<LegalDocType, string> = {
  terminos: 'Términos de Uso',
  privacidad: 'Política de Privacidad',
  devoluciones: 'Política de Devoluciones',
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  // Prevent background scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={DOC_TITLES[type]}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: Z.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'zFadeSlideIn 0.25s ease',
      }}
    >
      {/* Top bar with close button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '48px 16px 0',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            fontFamily: Z.font,
            fontSize: 13,
            fontWeight: 700,
            color: Z.orange,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 4px',
            letterSpacing: '0.2px',
          }}
        >
          Cerrar
        </button>
      </div>

      {/* Document content — fills remaining space, scrolls internally */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {type === 'terminos' && <TerminosDeUso />}
        {type === 'privacidad' && <PoliticaDePrivacidad />}
        {type === 'devoluciones' && <PoliticaDeDevoluciones />}
      </div>
    </div>
  )
}

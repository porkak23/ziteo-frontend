import { useEffect, useRef, useState } from 'react'
import { Z } from '@/shared/design/tokens'

interface InstallGuideProps {
  onClose: () => void
  onInstalled: () => void
}

type Status = 'guide' | 'success'

function ShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v12M12 3l-4 4M12 3l4 4" stroke={Z.blueDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" stroke={Z.blueDark} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function PlusSquareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke={Z.blueDark} strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke={Z.blueDark} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CheckCircleIcon({ color = Z.orangeDark }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M8 12l3 3 5-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M6 18L18 6" stroke={Z.text} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function StepRow({ n, icon, title, description }: { n: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0' }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: Z.orangeDark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: Z.font, fontSize: 13, fontWeight: 800 }}>
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{title}</span>
          <span style={{ display: 'inline-flex', padding: 4, borderRadius: 8, background: Z.surface, border: `1px solid ${Z.border}` }}>
            {icon}
          </span>
        </div>
        <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0', lineHeight: 1.5 }}>{description}</p>
      </div>
    </div>
  )
}

// iOS-only guided install. Android uses the native `beforeinstallprompt` dialog
// fired directly from InstallSuggestion / InstallPrompt with a single tap.
export default function InstallGuide({ onClose, onInstalled }: InstallGuideProps) {
  const [status, setStatus] = useState<Status>('guide')
  const primaryBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onAppInstalled() {
      setStatus('success')
      setTimeout(onInstalled, 1800)
    }
    window.addEventListener('appinstalled', onAppInstalled)
    return () => window.removeEventListener('appinstalled', onAppInstalled)
  }, [onInstalled])

  useEffect(() => {
    primaryBtnRef.current?.focus()
  }, [])

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(13,16,32,0.7)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999,
    animation: 'fadeIn 0.2s ease',
  }

  const sheetStyle: React.CSSProperties = {
    width: '100%', maxWidth: 480, background: Z.bg, borderRadius: '24px 24px 0 0',
    padding: '20px 22px calc(28px + env(safe-area-inset-bottom))',
    display: 'flex', flexDirection: 'column', gap: 16,
    animation: 'slideUp 0.3s ease',
    boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
  }

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()} aria-labelledby="install-guide-title">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: Z.divider, margin: '0 auto' }} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{ position: 'absolute', right: 16, top: 14, width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CloseIcon />
          </button>
        </div>

        {status === 'success' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0 12px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: Z.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon />
            </div>
            <h3 id="install-guide-title" style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>¡Listo!</h3>
            <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: 0, lineHeight: 1.5 }}>
              Busca el ícono de Ziteoo en la pantalla de inicio de tu teléfono y ábrelo desde ahí.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 id="install-guide-title" style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>Instalar Ziteoo en iPhone</h3>
            <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: 0, lineHeight: 1.5 }}>
              Sigue estos 3 pasos en Safari. Toma unos segundos.
            </p>
            <div style={{ padding: '6px 16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`, marginTop: 4 }}>
              <StepRow
                n={1}
                icon={<ShareIcon />}
                title="Toca Compartir"
                description="Está en la barra inferior de Safari, el botón con la flecha hacia arriba."
              />
              <div style={{ height: 1, background: Z.divider }} />
              <StepRow
                n={2}
                icon={<PlusSquareIcon />}
                title='Elige "Añadir a pantalla de inicio"'
                description='Desliza hacia abajo en el menú que aparece hasta encontrar esta opción.'
              />
              <div style={{ height: 1, background: Z.divider }} />
              <StepRow
                n={3}
                icon={<CheckCircleIcon color={Z.blueDark} />}
                title="Confirma Añadir"
                description="Arriba a la derecha. Ziteoo aparecerá en tu pantalla de inicio."
              />
            </div>
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={onClose}
              style={{ fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase', padding: '15px 24px', borderRadius: Z.r.md, background: Z.orangeDark, color: '#FFFFFF', border: 'none', cursor: 'pointer', width: '100%', marginTop: 6 }}
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

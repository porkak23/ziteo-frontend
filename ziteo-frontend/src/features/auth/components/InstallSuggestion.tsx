import { useEffect, useState } from 'react'
import { Z } from '@/shared/design/tokens'
import InstallGuide from './InstallGuide'
import {
  buildOpenInChromeIntent,
  detectInAppBrowser,
  getDeferredInstallPrompt,
  isDesktopDevice,
  isIOSDevice,
  isStandaloneDisplay,
  subscribeInstallPrompt,
  triggerNativeInstall,
  type BeforeInstallPromptEvent,
  type InAppBrowser,
} from '@/shared/lib/pwaInstall'

interface InstallSuggestionProps {
  onContinue: () => void
}

type InstallState = 'idle' | 'preparing' | 'installing' | 'unsupported'

export default function InstallSuggestion({ onContinue }: InstallSuggestionProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    getDeferredInstallPrompt(),
  )
  const [iosGuideOpen, setIosGuideOpen] = useState(false)
  const [state, setState] = useState<InstallState>('idle')

  const ios = isIOSDevice()
  const desktop = isDesktopDevice()
  const inApp: InAppBrowser | null = detectInAppBrowser()

  useEffect(() => {
    if (isStandaloneDisplay()) {
      onContinue()
      return
    }
    const installed = () => onContinue()
    window.addEventListener('appinstalled', installed)
    const unsub = subscribeInstallPrompt((e) => setDeferredPrompt(e))
    return () => {
      window.removeEventListener('appinstalled', installed)
      unsub()
    }
  }, [onContinue])

  useEffect(() => {
    if (deferredPrompt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((s) => (s === 'preparing' ? 'idle' : s))
    }
  }, [deferredPrompt])

  // On Android, if the event hasn't arrived yet, wait up to 3s before
  // marking the browser as unsupported. This avoids the user tapping
  // "Instalar" into a dead button on a slow race.
  useEffect(() => {
    if (ios || desktop) return
    if (deferredPrompt) return
    if (state !== 'preparing') return

    const t = setTimeout(() => {
      if (!getDeferredInstallPrompt()) setState('unsupported')
    }, 3000)
    return () => clearTimeout(t)
  }, [deferredPrompt, state, ios, desktop])

  async function handleInstall() {
    if (inApp && !ios) {
      // Android in-app WebView — bounce out to Chrome via intent URL.
      window.location.href = buildOpenInChromeIntent()
      return
    }
    if (ios) {
      setIosGuideOpen(true)
      return
    }
    if (!deferredPrompt) {
      setState('preparing')
      return
    }
    setState('installing')
    const outcome = await triggerNativeInstall()
    if (outcome === 'accepted') {
      // `appinstalled` listener will call onContinue.
      return
    }
    setState('idle')
  }

  const BENEFITS = [
    { title: 'Acceso desde tu pantalla de inicio', description: 'Abre Ziteo con un toque, como cualquier app nativa.' },
    { title: 'Funciona sin conexión', description: 'Consulta tu información incluso sin internet en obra.' },
    { title: 'Notificaciones de pedidos', description: 'Entérate al instante cuando algo necesita tu atención.' },
  ]

  let primaryLabel = 'Instalar app'
  let primaryDisabled = false
  if (inApp && !ios) primaryLabel = 'Abrir en Chrome para instalar'
  else if (inApp && ios) {
    primaryLabel = 'No se puede instalar aquí'
    primaryDisabled = true
  }
  else if (ios) primaryLabel = 'Ver cómo instalar'
  else if (state === 'installing') {
    primaryLabel = 'Instalando…'
    primaryDisabled = true
  } else if (state === 'preparing') {
    primaryLabel = 'Preparando instalación…'
    primaryDisabled = true
  } else if (state === 'unsupported') {
    primaryLabel = 'Instalación no disponible'
    primaryDisabled = true
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: Z.navy }}>
      <div
        style={{
          padding: '60px 28px 24px',
          background: `linear-gradient(180deg, rgba(232,115,58,0.12) 0%, ${Z.navy} 100%)`,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.04)',
            fontFamily: Z.font,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          Recomendado
        </div>
        <h2
          style={{
            fontFamily: Z.font,
            fontWeight: 800,
            fontSize: 28,
            lineHeight: 1.2,
            color: '#FFFFFF',
            margin: '14px 0 8px',
          }}
        >
          Instala Ziteo en tu teléfono
        </h2>
        <p
          style={{
            fontFamily: Z.font,
            fontSize: 14,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Tendrás una experiencia más rápida y completa, pero también puedes seguir en el navegador si prefieres probar primero.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 28px 0' }}>
        {inApp && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: Z.r.md,
              background: 'rgba(232,115,58,0.10)',
              border: '1px solid rgba(232,115,58,0.35)',
              marginBottom: 14,
            }}
          >
            <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
              {ios ? 'Abre este link en Safari' : 'Abre este link en Chrome'}
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              {ios
                ? 'Estás viendo Ziteo dentro de otra app. Toca los tres puntos (•••) arriba a la derecha y elige "Abrir en Safari" para poder instalar.'
                : 'Estás viendo Ziteo dentro de otra app. Toca el botón de abajo y se abrirá en Chrome para que puedas instalar.'}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              style={{
                padding: '14px 16px',
                borderRadius: Z.r.md,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{b.title}</div>
              <div style={{ fontFamily: Z.font, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.5 }}>{b.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '20px 28px calc(28px + env(safe-area-inset-bottom))',
          background: Z.navy,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {!desktop && (
          <button
            type="button"
            onClick={handleInstall}
            disabled={primaryDisabled}
            style={{
              fontFamily: Z.font,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              padding: '15px 24px',
              borderRadius: Z.r.md,
              background: Z.orangeDark,
              color: '#FFFFFF',
              border: 'none',
              cursor: primaryDisabled ? 'default' : 'pointer',
              opacity: primaryDisabled ? 0.6 : 1,
              width: '100%',
            }}
          >
            {primaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          style={{
            fontFamily: Z.font,
            fontWeight: 600,
            fontSize: 13,
            padding: '12px 24px',
            borderRadius: Z.r.md,
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Continuar en el navegador
        </button>
      </div>

      {iosGuideOpen && (
        <InstallGuide
          onClose={() => setIosGuideOpen(false)}
          onInstalled={() => { setIosGuideOpen(false); onContinue() }}
        />
      )}
    </div>
  )
}

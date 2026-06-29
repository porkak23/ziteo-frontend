import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

export function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('pwa_install_dismissed') === 'true'
  )

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-surface rounded-2xl shadow-lg border border-outline-variant p-4 flex items-center gap-3">
      <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
        install_mobile
      </span>
      <div className="flex-1">
        <p className="font-semibold text-on-surface text-sm">Instalar Ziteoo</p>
        <p className="text-on-surface-variant text-xs">Agrega la app a tu pantalla de inicio</p>
      </div>
      <button
        onClick={async () => { await (prompt as BeforeInstallPromptEvent).prompt(); setPrompt(null) }}
        className="bg-primary text-on-primary rounded-xl px-3 py-2 text-sm font-semibold"
      >
        Instalar
      </button>
      <button
        onClick={() => { setDismissed(true); localStorage.setItem('pwa_install_dismissed', 'true') }}
        className="text-on-surface-variant"
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>
  )
}

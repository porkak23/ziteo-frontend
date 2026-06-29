import { useState, useCallback } from 'react'

// ─── InstallInstructionsPage ──────────────────────────────────────────────────
// Accesible sin autenticacion via ?install en la URL.
// Muestra instrucciones de instalacion PWA para Android e iOS.

export function InstallInstructionsPage() {
  const [copied, setCopied] = useState(false)

  const shareUrl = 'https://app.ziteo.bo?install'

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback para navegadores sin clipboard API
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-8">

        {/* Cabecera */}
        <div className="flex flex-col gap-1">
          <p className="font-label text-xs text-primary uppercase tracking-widest font-semibold">
            Instalacion
          </p>
          <h1 className="font-headline font-bold text-2xl text-on-surface leading-snug">
            Como instalar Ziteoo en tu celular
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Ziteoo funciona como una app normal instalada en tu pantalla de inicio,
            sin necesidad de una tienda de aplicaciones.
          </p>
        </div>

        {/* ── Seccion Android ── */}
        <div className="flex flex-col gap-4">
          <h2 className="font-headline font-semibold text-lg text-on-surface">
            Android
          </h2>

          {/* Opcion 1: Play Store */}
          <div className="bg-surface border border-outline-variant rounded-2xl px-4 py-4 flex flex-col gap-2">
            <p className="font-label text-xs text-primary uppercase tracking-wide font-semibold">
              Opcion 1
            </p>
            <p className="font-body font-semibold text-sm text-on-surface">
              Instalar desde Google Play
            </p>
            <p className="font-body text-sm text-on-surface-variant">
              La forma mas rapida. Busca &quot;Ziteoo&quot; en Google Play o usa el enlace directo.
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=bo.ziteo.app"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 w-full bg-primary text-on-primary rounded-xl py-2.5 font-label font-semibold text-sm text-center transition-opacity active:opacity-70 no-underline"
            >
              Ir a Google Play
            </a>
          </div>

          {/* Opcion 2: Chrome */}
          <div className="bg-surface border border-outline-variant rounded-2xl px-4 py-4 flex flex-col gap-3">
            <p className="font-label text-xs text-primary uppercase tracking-wide font-semibold">
              Opcion 2
            </p>
            <p className="font-body font-semibold text-sm text-on-surface">
              Instalar desde el navegador Chrome
            </p>
            <ol className="flex flex-col gap-2 pl-4">
              {[
                'Abre esta pagina en Chrome para Android.',
                'Toca el menu de tres puntos en la esquina superior derecha.',
                'Selecciona "Anadir a pantalla de inicio".',
                'Confirma tocando "Anadir" en el dialogo que aparece.',
              ].map((step, i) => (
                <li key={i} className="font-body text-sm text-on-surface-variant list-decimal">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Seccion iPhone/iPad ── */}
        <div className="flex flex-col gap-4">
          <h2 className="font-headline font-semibold text-lg text-on-surface">
            iPhone / iPad
          </h2>

          <div className="bg-surface border border-outline-variant rounded-2xl px-4 py-4 flex flex-col gap-3">
            <p className="font-body font-semibold text-sm text-on-surface">
              Para instalar en iPhone o iPad
            </p>
            <div className="bg-error-container rounded-xl px-3 py-2">
              <p className="font-body text-xs text-on-error-container font-semibold">
                Importante: debe abrirse en Safari, no en Chrome ni en otro navegador.
              </p>
            </div>
            <ol className="flex flex-col gap-2 pl-4">
              {[
                'Abre esta pagina en Safari (el navegador predeterminado de Apple).',
                'Toca el boton de compartir — el cuadrado con una flecha hacia arriba — en la barra inferior de Safari.',
                'Desplazate hacia abajo en el menu y toca "Anadir a pantalla de inicio".',
                'Toca "Anadir" en la esquina superior derecha para confirmar.',
              ].map((step, i) => (
                <li key={i} className="font-body text-sm text-on-surface-variant list-decimal">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="bg-primary-container rounded-2xl px-4 py-4">
          <p className="font-body text-sm text-on-primary-container leading-relaxed">
            Una vez instalada, Ziteoo funciona como una app normal desde tu
            pantalla de inicio. Puedes abrirla sin conexion a internet para
            consultar tu historial y pedidos recientes.
          </p>
        </div>

        {/* ── Link compartible ── */}
        <div className="flex flex-col gap-3">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-wide">
            Compartir estas instrucciones
          </p>
          <div className="bg-surface border border-outline-variant rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="font-body text-sm text-on-surface-variant truncate select-all">
              {shareUrl}
            </span>
          </div>
          <button
            onClick={() => void handleCopy()}
            className="w-full bg-surface border border-outline-variant text-on-surface rounded-2xl py-3 font-label font-semibold text-sm transition-all active:opacity-70"
          >
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>
        </div>

        {/* ── Link volver ── */}
        <p className="font-body text-xs text-on-surface-variant text-center">
          <a
            href="/"
            className="text-primary underline"
            onClick={(e) => {
              e.preventDefault()
              // Navegar a la app quitando el parametro install
              window.location.href = window.location.origin
            }}
          >
            Volver a la app
          </a>
        </p>

      </div>
    </div>
  )
}

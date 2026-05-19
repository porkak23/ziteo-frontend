// InstallPrompt.tsx — PWA install prompt UI
// No manual configuration required.
// Shows a text-only install banner after the user has completed onboarding
// and has opened the app at least 3 times. Respects a 7-day cooldown after dismissal.
// On iOS shows manual "Add to Home Screen" instructions instead of a native dialog.

import { usePWAInstall } from '../hooks/usePWAInstall'
import { useAuthStore } from '../../features/auth/store/authStore'

export function InstallPrompt() {
  const user = useAuthStore((s) => s.user)
  const hasOnboarded = Boolean(user?.active_role)

  const { shouldShowPrompt, isIOSDevice, isInstalled, triggerInstall, dismiss } =
    usePWAInstall(hasOnboarded)

  // Already installed — nothing to show
  if (isInstalled) return null
  if (!shouldShowPrompt) return null

  if (isIOSDevice) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 bg-surface rounded-2xl shadow-lg border border-outline-variant p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-on-surface text-sm mb-1">
              Instala Ziteo en tu celular
            </p>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              En Safari: toca el boton de compartir, luego "Anadir a pantalla de inicio".
            </p>
          </div>
          <button
            onClick={dismiss}
            className="text-on-surface-variant text-xs font-medium shrink-0 mt-0.5"
            aria-label="Cerrar aviso de instalacion"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-surface rounded-2xl shadow-lg border border-outline-variant p-4">
      <p className="font-semibold text-on-surface text-sm mb-1">Instala Ziteo en tu celular</p>
      <p className="text-on-surface-variant text-xs mb-3 leading-relaxed">
        Acceso rapido sin abrir el navegador.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={dismiss}
          className="px-3 py-1.5 text-sm font-medium text-on-surface-variant rounded-xl border border-outline-variant"
        >
          Ahora no
        </button>
        <button
          onClick={triggerInstall}
          className="px-3 py-1.5 text-sm font-semibold bg-primary text-on-primary rounded-xl"
        >
          Instalar
        </button>
      </div>
    </div>
  )
}

import { useNetworkStatus } from '../hooks/useNetworkStatus'

export function NetworkStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus()

  if (isOnline && !wasOffline) return null

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-2 text-xs font-semibold text-center"
        style={{ background: '#374151', color: '#F9FAFB' }}
      >
        Sin conexion. Mostrando datos guardados.
      </div>
    )
  }

  // wasOffline && isOnline — brief "connection restored" banner
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-2 text-xs font-semibold text-center"
      style={{ background: '#065F46', color: '#D1FAE5' }}
    >
      Conexion restaurada
    </div>
  )
}

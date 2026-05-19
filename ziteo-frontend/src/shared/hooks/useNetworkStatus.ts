import { useState, useEffect } from 'react'

interface NetworkStatus {
  isOnline: boolean
  /** true during the brief window after recovering from an offline state */
  wasOffline: boolean
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    let restoreTimer: ReturnType<typeof setTimeout> | null = null

    function handleOnline() {
      setIsOnline(true)
      setWasOffline(true)
      restoreTimer = setTimeout(() => {
        setWasOffline(false)
      }, 2000)
    }

    function handleOffline() {
      setIsOnline(false)
      setWasOffline(false)
      if (restoreTimer) clearTimeout(restoreTimer)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (restoreTimer) clearTimeout(restoreTimer)
    }
  }, [])

  return { isOnline, wasOffline }
}

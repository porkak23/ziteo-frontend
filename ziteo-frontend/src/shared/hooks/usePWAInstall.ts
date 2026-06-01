// usePWAInstall.ts — Intelligent PWA install prompt management
// No manual configuration required.
// Logic: only show the prompt when:
//   1. App is not already running as standalone (not yet installed)
//   2. User has completed onboarding (has an active_role)
//   3. At least 3 sessions have been recorded OR user dismissed fewer than 3 times
//   4. At least 7 days have passed since the last dismissal

import { useState, useEffect } from 'react'
import {
  getDeferredInstallPrompt,
  isIOSDevice,
  isStandaloneDisplay,
  subscribeInstallPrompt,
  triggerNativeInstall,
  type BeforeInstallPromptEvent,
} from '../lib/pwaInstall'

const STORAGE_KEY_SESSIONS   = 'pwa_session_count'
const STORAGE_KEY_DISMISSED  = 'pwa_install_dismissed_at'
const MIN_SESSIONS_REQUIRED  = 3
const COOLDOWN_MS            = 7 * 24 * 60 * 60 * 1000 // 7 days

function incrementSessionCount(): number {
  const current = parseInt(localStorage.getItem(STORAGE_KEY_SESSIONS) ?? '0', 10)
  const next = current + 1
  localStorage.setItem(STORAGE_KEY_SESSIONS, String(next))
  return next
}

function getSessionCount(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY_SESSIONS) ?? '0', 10)
}

function getLastDismissedAt(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY_DISMISSED) ?? '0', 10)
}

function recordDismissal(): void {
  localStorage.setItem(STORAGE_KEY_DISMISSED, String(Date.now()))
}

function isCoolingDown(): boolean {
  const last = getLastDismissedAt()
  if (!last) return false
  return Date.now() - last < COOLDOWN_MS
}

export interface PWAInstallState {
  /** True when we should show the install prompt UI */
  shouldShowPrompt: boolean
  /** True on iOS, where we can only show manual instructions */
  isIOSDevice: boolean
  /** True if the app is already installed (standalone mode) */
  isInstalled: boolean
  /** Call this to trigger the native install dialog (Chrome/Android) */
  triggerInstall: () => Promise<void>
  /** Call this when the user dismisses the prompt */
  dismiss: () => void
}

export function usePWAInstall(hasCompletedOnboarding: boolean): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    getDeferredInstallPrompt(),
  )
  const [dismissed, setDismissed] = useState(false)

  // Increment session counter once per hook mount (i.e., once per app load)
  useEffect(() => {
    incrementSessionCount()
  }, [])

  useEffect(() => {
    const unsub = subscribeInstallPrompt((e) => setDeferredPrompt(e))
    return () => unsub()
  }, [])

  const ios = isIOSDevice()
  const installed = isStandaloneDisplay()
  const enoughSessions = getSessionCount() >= MIN_SESSIONS_REQUIRED
  const coolingDown = isCoolingDown()

  const shouldShowPrompt =
    !installed &&
    hasCompletedOnboarding &&
    !dismissed &&
    !coolingDown &&
    enoughSessions &&
    (ios ? true : deferredPrompt !== null)

  const triggerInstall = async (): Promise<void> => {
    const outcome = await triggerNativeInstall()
    if (outcome === 'dismissed' || outcome === 'unavailable') {
      recordDismissal()
    }
    setDismissed(true)
  }

  const dismiss = (): void => {
    recordDismissal()
    setDismissed(true)
  }

  return {
    shouldShowPrompt,
    isIOSDevice: ios,
    isInstalled: installed,
    triggerInstall,
    dismiss,
  }
}

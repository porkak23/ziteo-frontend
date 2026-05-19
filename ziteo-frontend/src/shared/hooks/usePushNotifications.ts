// usePushNotifications.ts — Web Push subscription management
// MANUAL SETUP REQUIRED before this hook works:
//   1. Run: node scripts/generate-vapid-keys.mjs
//   2. Set VITE_VAPID_PUBLIC_KEY in .env.local and production env vars
//   3. Set VAPID_PRIVATE_KEY and VAPID_SUBJECT in Supabase secrets
//   4. Deploy the supabase/functions/notifications/send-push Edge Function
//   5. Apply migration: supabase/migrations/20260519_push_subscriptions.sql
//
// Usage: call subscribe() only after a meaningful user action (e.g., first order placed,
// onboarding completed). Never call it during login or app load.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../features/auth/store/authStore'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/** Convert a base64url VAPID public key to a Uint8Array for the browser API */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export interface PushNotificationState {
  isSubscribed: boolean
  isSupported: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): PushNotificationState {
  const user = useAuthStore((s) => s.user)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  const isSupported =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    Boolean(VAPID_PUBLIC_KEY)

  // On mount, check if a subscription already exists
  useEffect(() => {
    if (!isSupported) return
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg)
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(sub !== null)
      })
    })
  }, [isSupported])

  const subscribe = useCallback(async (): Promise<void> => {
    if (!isSupported || !user || !VAPID_PUBLIC_KEY) return

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const reg = registration ?? (await navigator.serviceWorker.ready)

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast needed: TypeScript's ArrayBufferView constraint doesn't accept SharedArrayBuffer,
      // but Uint8Array from atob is always backed by a plain ArrayBuffer at runtime.
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
    })

    const subJson = subscription.toJSON()
    const keys = subJson.keys as { p256dh: string; auth: string } | undefined

    if (!subJson.endpoint || !keys?.p256dh || !keys?.auth) {
      console.error('[Push] Subscription missing expected fields')
      return
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.user_id,
        endpoint: subJson.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      console.error('[Push] Failed to save subscription:', error.message)
      return
    }

    setIsSubscribed(true)
  }, [isSupported, user, registration])

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isSupported || !user) return

    const reg = registration ?? (await navigator.serviceWorker.ready)
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return

    const endpoint = sub.endpoint
    await sub.unsubscribe()

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.user_id)
      .eq('endpoint', endpoint)

    setIsSubscribed(false)
  }, [isSupported, user, registration])

  return { isSubscribed, isSupported, subscribe, unsubscribe }
}

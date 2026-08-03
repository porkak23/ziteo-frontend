/**
 * PostHog analytics — deferred loading.
 * The posthog-js chunk (~182KB) loads after first paint via requestIdleCallback
 * so it never blocks rendering.
 *
 * The public API (initAnalytics, identifyUser, resetUser, track.*) is identical
 * to before — no call sites need to change.
 *
 * Calls made before PostHog loads are queued and flushed once the SDK is ready.
 */
import type { PostHog } from 'posthog-js'
import { supabase } from './supabaseClient'

type PendingCall =
  | { kind: 'identify'; userId: string; role: string }
  | { kind: 'reset' }
  | { kind: 'capture'; event: string; props?: Record<string, string> }

let posthog: PostHog | null = null
const queue: PendingCall[] = []

function flush(sdk: PostHog) {
  for (const call of queue) {
    if (call.kind === 'identify') sdk.identify(call.userId, { role: call.role })
    else if (call.kind === 'reset') sdk.reset()
    else sdk.capture(call.event, call.props)
  }
  queue.length = 0
}

export function initAnalytics(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  if (!key) return

  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com'

  const load = async () => {
    const { default: sdk } = await import('posthog-js')
    sdk.init(key, {
      api_host: host,
      capture_pageview: false,
      autocapture: false,
      disable_session_recording: true,
      persistence: 'localStorage',
    })
    posthog = sdk
    flush(sdk)
  }

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => { load().catch(console.error) })
  } else {
    setTimeout(() => { load().catch(console.error) }, 1)
  }
}

export function identifyUser(userId: string, role: string): void {
  if (posthog) posthog.identify(userId, { role })
  else queue.push({ kind: 'identify', userId, role })
}

export function resetUser(): void {
  if (posthog) posthog.reset()
  else queue.push({ kind: 'reset' })
}

function capture(event: string, props?: Record<string, string>): void {
  if (posthog) posthog.capture(event, props)
  else queue.push({ kind: 'capture', event, props })
  logEventToSupabase(event, props)
}

// Dual-write al feed de actividad del Command Center admin (tabla `events`,
// ver 20260719000002_admin_events_and_activity.sql). Fire-and-forget: nunca
// debe bloquear ni afectar la UX si falla.
//
// log_event() tiene GRANT sólo a `authenticated`, así que llamarlo sin sesión
// (p. ej. durante el registro, antes de loginWithPin) devuelve 401 y ensucia la
// consola justo en el flujo donde más molesta al diagnosticar. Su guard interno
// `auth.uid() IS NULL` nunca llega a evaluarse. Filtramos aquí en su lugar.
function logEventToSupabase(event: string, props?: Record<string, string>): void {
  supabase.auth.getSession().then(
    ({ data }) => {
      if (!data.session) return
      supabase.rpc('log_event', { p_event_name: event, p_properties: props ?? {} }).then(
        () => {},
        () => {}
      )
    },
    () => {}
  )
}

export const track = {
  pageView: (page: string) => capture('page_view', { page }),

  registrationStarted: () => capture('registration_started'),
  otpVerified: () => capture('otp_verified'),
  onboardingComplete: (role: string) => capture('onboarding_complete', { role }),

  productViewed: (productId: string) => capture('product_viewed', { product_id: productId }),
  addedToCart: (productId: string) => capture('added_to_cart', { product_id: productId }),
  orderPlaced: (orderId: string) => capture('order_placed', { order_id: orderId }),
  paymentEvidenceUploaded: (orderId: string) => capture('payment_evidence_uploaded', { order_id: orderId }),
  paymentConfirmed: (orderId: string) => capture('payment_confirmed', { order_id: orderId }),

  licitacionPublished: () => capture('licitacion_published'),
  ofertaSubmitted: () => capture('oferta_submitted'),
  maestroContacted: () => capture('maestro_contacted'),

  radarActivated: () => capture('radar_activated'),
  deliveryCompleted: () => capture('delivery_completed'),
}

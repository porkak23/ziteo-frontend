import posthog from 'posthog-js'

/**
 * Initialize PostHog analytics.
 * Safe to call even if VITE_POSTHOG_KEY is not set (no-ops in that case).
 */
export function initAnalytics(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com'
  if (!key) return

  posthog.init(key, {
    api_host: host,
    capture_pageview: false,         // Manual page views for SPA routing
    autocapture: false,              // Only explicit events
    disable_session_recording: true, // Sentry Replay already covers this
    persistence: 'localStorage',
  })
}

/**
 * Identify the authenticated user.
 * Only sends user_id and role — no PII (no phone, no name, no email).
 */
export function identifyUser(userId: string, role: string): void {
  posthog.identify(userId, { role })
}

/** Reset the PostHog identity (call on logout). */
export function resetUser(): void {
  posthog.reset()
}

/** Explicitly tracked funnel events. */
export const track = {
  pageView: (page: string) =>
    posthog.capture('page_view', { page }),

  // Auth funnel
  registrationStarted: () =>
    posthog.capture('registration_started'),
  otpVerified: () =>
    posthog.capture('otp_verified'),
  onboardingComplete: (role: string) =>
    posthog.capture('onboarding_complete', { role }),

  // Shopping funnel
  productViewed: (productId: string) =>
    posthog.capture('product_viewed', { product_id: productId }),
  addedToCart: (productId: string) =>
    posthog.capture('added_to_cart', { product_id: productId }),
  orderPlaced: (orderId: string) =>
    posthog.capture('order_placed', { order_id: orderId }),
  paymentEvidenceUploaded: (orderId: string) =>
    posthog.capture('payment_evidence_uploaded', { order_id: orderId }),
  paymentConfirmed: (orderId: string) =>
    posthog.capture('payment_confirmed', { order_id: orderId }),

  // Construction marketplace
  licitacionPublished: () =>
    posthog.capture('licitacion_published'),
  ofertaSubmitted: () =>
    posthog.capture('oferta_submitted'),
  maestroContacted: () =>
    posthog.capture('maestro_contacted'),

  // Delivery
  radarActivated: () =>
    posthog.capture('radar_activated'),
  deliveryCompleted: () =>
    posthog.capture('delivery_completed'),
}

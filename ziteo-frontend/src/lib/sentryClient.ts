/**
 * Lazy Sentry wrapper. The real @sentry/react chunk (~110KB) loads after first
 * paint via requestIdleCallback so it never blocks rendering.
 *
 * Boot-time errors are buffered via temporary window.error / unhandledrejection
 * handlers and replayed into Sentry once the SDK loads — no crashes are lost.
 *
 * Call sites use captureException / setUser from this module instead of
 * importing @sentry/react directly, so the chunk stays out of the boot graph.
 */

type SentryModule = typeof import('@sentry/react')

interface BufferedCall {
  kind: 'captureException'
  args: [unknown, Record<string, unknown>?]
}

let sentry: SentryModule | null = null
const callBuffer: BufferedCall[] = []

// --- Boot-time error capture -----------------------------------------------

interface BootError {
  kind: 'error' | 'unhandledrejection'
  error: unknown
}

const bootErrors: BootError[] = []

function onWindowError(event: ErrorEvent) {
  bootErrors.push({ kind: 'error', error: event.error ?? event.message })
}

function onUnhandledRejection(event: PromiseRejectionEvent) {
  bootErrors.push({ kind: 'unhandledrejection', error: event.reason })
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', onWindowError)
  window.addEventListener('unhandledrejection', onUnhandledRejection)
}

// ---------------------------------------------------------------------------

function flushBuffer(sdk: SentryModule) {
  // Replay any calls made before Sentry loaded
  for (const call of callBuffer) {
    if (call.kind === 'captureException') {
      sdk.captureException(call.args[0], call.args[1] ? { extra: call.args[1] } : undefined)
    }
  }
  callBuffer.length = 0

  // Replay boot-time global errors
  for (const e of bootErrors) {
    sdk.captureException(e.error)
  }
  bootErrors.length = 0

  // Sentry installs its own global handlers — remove the temporary ones
  window.removeEventListener('error', onWindowError)
  window.removeEventListener('unhandledrejection', onUnhandledRejection)
}

// ---------------------------------------------------------------------------

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  if (sentry) {
    sentry.captureException(error, extra ? { extra } : undefined)
  } else {
    callBuffer.push({ kind: 'captureException', args: [error, extra] })
  }
}

export function setUser(user: { id: string; username?: string } | null): void {
  if (sentry) {
    sentry.setUser(user)
  }
  // If Sentry isn't loaded yet, setUser is non-critical — skip buffering.
  // Sentry.setUser is called again after login in authStore once the SDK loads.
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return

  const load = async () => {
    const sdk = await import('@sentry/react')

    sdk.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        sdk.browserTracingIntegration(),
        sdk.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    })

    sentry = sdk
    flushBuffer(sdk)
  }

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => { load().catch(console.error) })
  } else {
    setTimeout(() => { load().catch(console.error) }, 1)
  }
}

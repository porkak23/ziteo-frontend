import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import * as Sentry from '@sentry/react'
import { initAnalytics } from './lib/analytics'
import { initPWAInstallCapture } from './shared/lib/pwaInstall'

// Initialize PostHog before render (no-ops if VITE_POSTHOG_KEY is empty)
initAnalytics()

// Capture `beforeinstallprompt` as early as possible so the install flow can
// fire the native dialog with a single tap, even if the event arrives before
// any component mounts.
initPWAInstallCapture()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5,        // 5 minutes
      gcTime: 1000 * 60 * 60,          // 1 hour in memory cache
      refetchOnWindowFocus: false,      // Don't reload on tab focus
      refetchOnReconnect: true,         // Reload when connection recovers
    },
    mutations: {
      retry: 1, // 1 retry for mutations (orders, payments)
    },
  },
})

const idbPersister: Persister = {
  persistClient: (client: PersistedClient) => set('__rq_cache', client),
  restoreClient: () => get<PersistedClient>('__rq_cache'),
  removeClient: () => del('__rq_cache'),
}

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Performance tracing: full sampling in dev, 10% in production
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session Replay: record 10% of sessions in prod, 100% in dev;
    // always capture the session on error for diagnosis
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text and block all media by default — privacy-first
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: idbPersister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </PersistQueryClientProvider>
  </StrictMode>,
)

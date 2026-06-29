import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { initAnalytics } from './lib/analytics'
import { initSentry } from './lib/sentryClient'
import { initPWAInstallCapture } from './shared/lib/pwaInstall'

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

// Defer analytics and error monitoring until after first paint.
// PostHog (~182KB) and Sentry (~110KB) load via requestIdleCallback so they
// never block rendering. Boot-time errors are still captured — sentryClient
// installs temporary window.error/unhandledrejection handlers until the SDK loads.
initAnalytics()
initSentry()

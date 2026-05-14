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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24, // 24h — kept in IDB cache
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
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    integrations: [Sentry.browserTracingIntegration()],
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

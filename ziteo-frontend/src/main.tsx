import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { initAnalytics } from './lib/analytics'
import { initSentry } from './lib/sentryClient'
import { initPWAInstallCapture } from './shared/lib/pwaInstall'
import { queryClient, idbPersister } from './lib/queryClient'
import { SIMULATION } from './shared/config/simulation'

// Capture `beforeinstallprompt` as early as possible so the install flow can
// fire the native dialog with a single tap, even if the event arrives before
// any component mounts.
initPWAInstallCapture()

// Sandbox de simulación: solo se importa (y por tanto solo entra al bundle)
// cuando SIMULATION es true en build time — ver src/shared/config/simulation.ts.
if (SIMULATION) {
  import('./sandbox').then((m) => m.installSandbox())
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

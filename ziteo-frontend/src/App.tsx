import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from './features/auth/store/authStore'
import { useNavStore } from './shared/store/navStore'
import { useAuthSession } from './shared/hooks/useAuthSession'
import { signOut } from './features/auth/services/authService'
import { InstallPrompt } from './shared/components/InstallPrompt'
import SplashScreen from './features/auth/components/SplashScreen'
import WelcomeScreen from './features/auth/components/WelcomeScreen'
import RegisterForm from './features/auth/components/RegisterForm'
import InstallSuggestion from './features/auth/components/InstallSuggestion'
import AlreadyRegisteredNotice from './features/auth/components/AlreadyRegisteredNotice'
import AppLayout from './shared/components/AppLayout'
import { ThemeInitializer } from './shared/components/ThemeInitializer'
import { FeedbackButton } from './shared/components/FeedbackButton'
import { BetaAcknowledgment } from './features/auth/components/BetaAcknowledgment'
import { NetworkStatusBanner } from './shared/components/NetworkStatusBanner'

import { StatusPage } from './features/app/components/StatusPage'
import { InstallInstructionsPage } from './features/app/components/InstallInstructionsPage'
import PrivacidadPage from './features/legal/PrivacidadPage'
import BetaSignupForm from './features/auth/components/BetaSignupForm'

const BETA_MODE = import.meta.env.VITE_BETA_MODE === 'true'

function isStatusRoute(): boolean {
  return window.location.search.includes('status') || window.location.hash === '#status'
}

function isInstallRoute(): boolean {
  return window.location.search.includes('install') || window.location.hash === '#install'
}

function isPrivacidadRoute(): boolean {
  return window.location.pathname === '/privacidad'
}

const TrabajadorApp       = lazy(() => import('./features/trabajador/TrabajadorApp').then(m => ({ default: m.TrabajadorApp })))
const RepartidorApp       = lazy(() => import('./features/repartidor/RepartidorApp').then(m => ({ default: m.RepartidorApp })))
const ConstructorApp      = lazy(() => import('./features/constructor/ConstructorApp').then(m => ({ default: m.ConstructorApp })))
const ProveedorApp        = lazy(() => import('./features/proveedor/ProveedorApp').then(m => ({ default: m.ProveedorApp })))
const SettingsScreen      = lazy(() => import('./features/settings/components/SettingsScreen').then(m => ({ default: m.SettingsScreen })))
const NotificationsScreen = lazy(() => import('./features/notifications/components/NotificationsScreen').then(m => ({ default: m.NotificationsScreen })))
const PerfilScreen        = lazy(() => import('./features/perfil/components/PerfilScreen').then(m => ({ default: m.PerfilScreen })))

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
    </div>
  )
}

type AppScreen = 'splash' | 'install-suggestion' | 'welcome' | 'already-registered' | 'register' | 'app'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash')
  const activeTab = useNavStore((s) => s.activeTab)
  const setActiveTab = useNavStore((s) => s.setTab)
  const { isAuthenticated } = useAuthStore()
  const isAuth = useAuthStore((s) => s.user !== null)
  const currentUser = useAuthStore((s) => s.user)

  useAuthSession()

  useEffect(() => {
    if (!isAuth && screen === 'app') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScreen('welcome')
      setActiveTab('home')
    }
  }, [isAuth, screen, setActiveTab])

  async function handleLogout() {
    await signOut().catch(() => undefined)
    setScreen('welcome')
    setActiveTab('home')
  }

  if (BETA_MODE && (screen === 'welcome' || screen === 'register' || screen === 'already-registered' || screen === 'install-suggestion')) {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <BetaSignupForm onSuccess={() => setScreen('app')} />
      </div>
    )
  }

  if (isPrivacidadRoute()) {
    return <PrivacidadPage />
  }

  if (isStatusRoute()) {
    return (
      <>
        <ThemeInitializer />
        <StatusPage />
      </>
    )
  }

  if (isInstallRoute()) {
    return (
      <>
        <ThemeInitializer />
        <InstallInstructionsPage />
      </>
    )
  }

  if (screen === 'splash') {
    return (
      <>
        <ThemeInitializer />
        <SplashScreen onComplete={() => setScreen(isAuthenticated() ? 'app' : 'install-suggestion')} />
      </>
    )
  }

  if (screen === 'install-suggestion') {
    return (
      <>
        <ThemeInitializer />
        <InstallSuggestion onContinue={() => setScreen('welcome')} />
      </>
    )
  }

  if (screen === 'welcome') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <WelcomeScreen onNavigate={(dest) => setScreen(dest as AppScreen)} />
      </div>
    )
  }

  if (screen === 'already-registered') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <AlreadyRegisteredNotice
          onBack={() => setScreen('welcome')}
          onRegisterAnyway={() => setScreen('register')}
          onSuccess={() => setScreen('app')}
        />
      </div>
    )
  }

  if (screen === 'register') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <RegisterForm
          onSuccess={() => setScreen('app')}
          onNavigate={(dest) => setScreen(dest as AppScreen)}
        />
      </div>
    )
  }

  if (activeTab === 'settings' || activeTab === 'perfil' || activeTab === 'notificaciones') {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
          <Suspense fallback={<TabSkeleton />}>
            {activeTab === 'settings' && <SettingsScreen onLogout={handleLogout} />}
            {activeTab === 'perfil' && <PerfilScreen />}
            {activeTab === 'notificaciones' && <NotificationsScreen />}
          </Suspense>
        </AppLayout>
        <InstallPrompt />
        <BetaAcknowledgment />
        <FeedbackButton />
      </>
    )
  }

  if (currentUser?.active_role === 'constructor') {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <Suspense fallback={<TabSkeleton />}>
          <ConstructorApp />
        </Suspense>
        <InstallPrompt />
        <BetaAcknowledgment />
        <FeedbackButton />
      </>
    )
  }

  if (currentUser?.active_role === 'proveedor') {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <Suspense fallback={<TabSkeleton />}>
          <ProveedorApp />
        </Suspense>
        <InstallPrompt />
        <BetaAcknowledgment />
        <FeedbackButton />
      </>
    )
  }

  if (currentUser?.active_role === 'maestro') {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <Suspense fallback={<TabSkeleton />}>
          <TrabajadorApp />
        </Suspense>
        <InstallPrompt />
        <BetaAcknowledgment />
        <FeedbackButton />
      </>
    )
  }

  if (currentUser?.active_role === 'chofer') {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <Suspense fallback={<TabSkeleton />}>
          <RepartidorApp />
        </Suspense>
        <InstallPrompt />
        <BetaAcknowledgment />
        <FeedbackButton />
      </>
    )
  }

  return (
    <>
      <ThemeInitializer />
      <NetworkStatusBanner />
      <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <Suspense fallback={<TabSkeleton />}>
          <div className="flex items-center justify-center h-full p-4 text-center">
            <p className="text-on-surface-variant font-body">Cargando...</p>
          </div>
        </Suspense>
      </AppLayout>
    </>
  )
}

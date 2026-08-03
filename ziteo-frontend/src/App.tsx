import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from './features/auth/store/authStore'
import { useNavStore } from './shared/store/navStore'
import { useAuthSession } from './shared/hooks/useAuthSession'
import { performLogout } from './features/auth/services/authService'
import { InstallPrompt } from './shared/components/InstallPrompt'
import SplashScreen from './features/auth/components/SplashScreen'
import WelcomeScreen from './features/auth/components/WelcomeScreen'
import RegisterForm from './features/auth/components/RegisterForm'
import AlreadyRegisteredNotice from './features/auth/components/AlreadyRegisteredNotice'
import OnboardingScreen from './features/auth/components/OnboardingScreen'
import AppLayout from './shared/components/AppLayout'
import { ThemeInitializer } from './shared/components/ThemeInitializer'
import { FeedbackButton } from './shared/components/FeedbackButton'
import { BetaAcknowledgment } from './features/auth/components/BetaAcknowledgment'
import { NetworkStatusBanner } from './shared/components/NetworkStatusBanner'

import { StatusPage } from './features/app/components/StatusPage'
import { InstallInstructionsPage } from './features/app/components/InstallInstructionsPage'
import PrivacidadPage from './features/legal/PrivacidadPage'

// Detecta si la URL contiene ?status o #status para mostrar la página de estado
function isStatusRoute(): boolean {
  return (
    window.location.search.includes('status') ||
    window.location.hash === '#status'
  )
}

// Detecta si la URL contiene ?install para mostrar la página de instrucciones
function isInstallRoute(): boolean {
  return (
    window.location.search.includes('install') ||
    window.location.hash === '#install'
  )
}

// Página pública de política de privacidad — accesible sin autenticación en /privacidad
function isPrivacidadRoute(): boolean {
  return window.location.pathname === '/privacidad'
}

// Detecta si la URL contiene ?godmode o #godmode para mostrar el panel admin.
// IMPORTANTE: esto NO es un control de seguridad — es solo una reducción de
// exposición accidental (un admin no aterriza siempre en el panel; un
// dispositivo compartido/comprometido no lo expone por defecto). El acceso
// real lo decide is_admin() en Postgres vía RLS y el guard de AdminApp — ver
// 20260719000001_admin_role_foundation.sql y 20260801000002_admin_role_hardening.sql.
function isGodModeRoute(): boolean {
  return (
    window.location.search.includes('godmode') ||
    window.location.hash === '#godmode'
  )
}

// All role apps and heavy screens are lazy-loaded so they are not included
// in the initial bundle. Each role's chunk is only fetched after login.
const TrabajadorApp       = lazy(() => import('./features/trabajador/TrabajadorApp').then(m => ({ default: m.TrabajadorApp })))
const ChofersApp          = lazy(() => import('./features/transportista/ChofersApp').then(m => ({ default: m.ChofersApp })))
const AdminApp            = lazy(() => import('./features/admin/AdminApp').then(m => ({ default: m.AdminApp })))
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

type AppScreen = 'splash' | 'welcome' | 'register' | 'already-registered' | 'onboarding' | 'app'

export default function App() {
  return <AppScreens />
}

function AppScreens() {
  const [screen, setScreen] = useState<AppScreen>('splash')
  const activeTab = useNavStore((s) => s.activeTab)
  const setActiveTab = useNavStore((s) => s.setTab)
  const { isAuthenticated } = useAuthStore()
  const isAuth = useAuthStore((s) => s.user !== null)
  const currentUser = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  useAuthSession()

  useEffect(() => {
    if (!isAuth && screen === 'app') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScreen('welcome')
      setActiveTab('home')
    }
  }, [isAuth, screen, setScreen, setActiveTab])

  // Política de privacidad pública — accesible sin autenticación en /privacidad
  if (isPrivacidadRoute()) {
    return <PrivacidadPage />
  }

  // Página de estado del servicio — accesible sin autenticación via ?status o #status
  if (isStatusRoute()) {
    return (
      <>
        <ThemeInitializer />
        <StatusPage />
      </>
    )
  }

  // Página de instrucciones de instalación — accesible sin autenticación via ?install o #install
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
        <SplashScreen onComplete={() => setScreen(isAuthenticated() ? 'app' : 'welcome')} />
      </>
    )
  }

  if (screen === 'welcome') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <WelcomeScreen onNavigate={(dest: string) => setScreen(dest as AppScreen)} />
      </div>
    )
  }

  if (screen === 'register') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <RegisterForm
          onSuccess={() => {
            setScreen('onboarding')
          }}
          onNavigate={(dest: string) => setScreen(dest as AppScreen)}
        />
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

  if (screen === 'onboarding') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <OnboardingScreen onComplete={() => setScreen('app')} />
      </div>
    )
  }

  // ── Global screens (Settings, Perfil, Notifications) ──────────
  if (activeTab === 'settings' || activeTab === 'perfil' || activeTab === 'notificaciones') {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
          <Suspense fallback={<TabSkeleton />}>
            {activeTab === 'settings' && <SettingsScreen onLogout={() => { setScreen('welcome'); setActiveTab('home') }} />}
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

  // ── Role short-circuits: each role has its own standalone dashboard ──────────
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

  if (currentUser?.active_role === 'admin' && isGodModeRoute()) {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <Suspense fallback={<TabSkeleton />}>
          <AdminApp />
        </Suspense>
      </>
    )
  }

  if (currentUser?.active_role === 'chofer') {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <Suspense fallback={<TabSkeleton />}>
          <ChofersApp />
        </Suspense>
        <InstallPrompt />
        <BetaAcknowledgment />
        <FeedbackButton />
      </>
    )
  }

  // Admin sin el gate ?godmode: el rol 'admin' no tiene otro dashboard propio
  // (nunca es asignable junto a los 4 roles normales), así que sin el
  // parámetro no hay ninguna pantalla que mostrarle. Mensaje específico en
  // vez de caer en el genérico de "rol inválido" de abajo.
  if (currentUser?.active_role === 'admin') {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-6 text-center">
          <p className="text-on-surface font-heading text-lg">Panel de administración</p>
          <p className="text-on-surface-variant font-body text-sm">
            Agrega <code>?godmode</code> a la URL para entrar.
          </p>
          <button
            type="button"
            onClick={() => { void performLogout().finally(logout) }}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-body font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </>
    )
  }

  // Authenticated but with a corrupted/unrecognized role — show an actionable
  // error instead of leaving the user stuck on an indefinite loading state.
  if (currentUser) {
    return (
      <>
        <ThemeInitializer />
        <NetworkStatusBanner />
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-6 text-center">
          <p className="text-on-surface font-heading text-lg">No pudimos cargar tu cuenta</p>
          <p className="text-on-surface-variant font-body text-sm">
            Tu rol de usuario no es válido. Intenta cerrar sesión y volver a entrar.
          </p>
          <button
            type="button"
            onClick={() => { void performLogout().finally(logout) }}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-body font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </>
    )
  }

  // Fallback: unauthenticated
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

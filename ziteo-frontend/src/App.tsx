import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from './features/auth/store/authStore'
import type { UserRole } from './features/auth/store/authStore'
import { useNavStore } from './shared/store/navStore'
import { supabase } from './lib/supabaseClient'
import { useAuthSession } from './shared/hooks/useAuthSession'
import { InstallPrompt } from './shared/components/InstallPrompt'
import SplashScreen from './features/auth/components/SplashScreen'
import WelcomeScreen from './features/auth/components/WelcomeScreen'
import RegisterForm from './features/auth/components/RegisterForm'
import AlreadyRegisteredNotice from './features/auth/components/AlreadyRegisteredNotice'
import OnboardingScreen from './features/auth/components/OnboardingScreen'
import type { OAuthUserData } from './features/auth/types/authTypes'
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

// All role apps and heavy screens are lazy-loaded so they are not included
// in the initial bundle. Each role's chunk is only fetched after login.
const TrabajadorApp       = lazy(() => import('./features/trabajador/TrabajadorApp').then(m => ({ default: m.TrabajadorApp })))
const ChofersApp          = lazy(() => import('./features/transportista/ChofersApp').then(m => ({ default: m.ChofersApp })))
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

type AppScreen = 'splash' | 'welcome' | 'register' | 'already-registered' | 'onboarding' | 'oauth-setup' | 'app'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash')
  const [pendingOAuthUser, setPendingOAuthUser] = useState<OAuthUserData | null>(null)
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
  }, [isAuth, screen, setScreen, setActiveTab])

  // Handle Google / Apple OAuth redirects
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session) return
      const provider = session.user.app_metadata?.provider
      if (provider !== 'google' && provider !== 'apple') return
      if (useAuthStore.getState().user) return

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, name, phone, city, active_role, avatar_url')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (profile) {
          const { data: rolesData } = await supabase
            .from('user_roles').select('role').eq('user_id', session.user.id)
          useAuthStore.getState().setUser({
            user_id: session.user.id,
            name: profile.name,
            phone: profile.phone ?? '',
            email: session.user.email,
            active_role: profile.active_role as UserRole,
            roles: (rolesData ?? []).map((r: { role: string }) => r.role as UserRole),
            access_token: session.access_token,
            refresh_token: session.refresh_token ?? '',
            avatar_url: profile.avatar_url ?? undefined,
            city: profile.city,
          })
          setScreen('app')
        } else {
          setPendingOAuthUser({
            userId: session.user.id,
            email: session.user.email ?? '',
            name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? '',
            avatarUrl: session.user.user_metadata?.avatar_url ?? null,
            accessToken: session.access_token,
            refreshToken: session.refresh_token ?? '',
          })
          setScreen('oauth-setup')
        }
      } catch (err) {
        console.error('OAuth callback error:', err)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

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

  if (screen === 'oauth-setup' && pendingOAuthUser) {
    // OAuth profile setup — redirect to onboarding if user has no profile
    setScreen('onboarding')
    return null
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

  // Fallback: unauthenticated or unknown role
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

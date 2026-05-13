import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from './features/auth/store/authStore'
import type { UserRole } from './features/auth/store/authStore'
import { useNavStore } from './shared/store/navStore'
import { supabase } from './lib/supabaseClient'
import { InstallPWA } from './shared/components/InstallPWA'
import SplashScreen from './features/auth/components/SplashScreen'
import WelcomeScreen from './features/auth/components/WelcomeScreen'
import RegisterForm from './features/auth/components/RegisterForm'
import LoginForm from './features/auth/components/LoginForm'
import OtpVerification from './features/auth/components/OtpVerification'
import OnboardingScreen from './features/auth/components/OnboardingScreen'
import OAuthProfileSetup from './features/auth/components/OAuthProfileSetup'
import ForgotPinScreen from './features/auth/components/ForgotPinScreen'
import type { OAuthUserData } from './features/auth/types/authTypes'
import AppLayout from './shared/components/AppLayout'
import { ThemeInitializer } from './shared/components/ThemeInitializer'
import { ChatScreen } from './shared/components/ChatScreen'

const ConstructorApp    = lazy(() => import('./features/constructor/ConstructorApp').then(m => ({ default: m.ConstructorApp })))
const VendedorApp       = lazy(() => import('./features/vendedor/VendedorApp').then(m => ({ default: m.VendedorApp })))
const TrabajadorApp     = lazy(() => import('./features/trabajador/TrabajadorApp').then(m => ({ default: m.TrabajadorApp })))
const RepartidorApp     = lazy(() => import('./features/repartidor/RepartidorApp').then(m => ({ default: m.RepartidorApp })))
const HomeScreen        = lazy(() => import('./features/app/HomeScreen'))
const TiendaScreen      = lazy(() => import('./features/tienda').then(m => ({ default: m.TiendaScreen })))
const ProyectosScreen   = lazy(() => import('./features/proyectos').then(m => ({ default: m.ProyectosScreen })))
const PerfilScreen      = lazy(() => import('./features/perfil/components/PerfilScreen').then(m => ({ default: m.PerfilScreen })))
const PedidosProveedorScreen = lazy(() => import('./features/proveedor/components/PedidosProveedorScreen').then(m => ({ default: m.PedidosProveedorScreen })))
const MisPedidosScreen  = lazy(() => import('./features/tienda/components/MisPedidosScreen').then(m => ({ default: m.MisPedidosScreen })))
const TrabajosScreen    = lazy(() => import('./features/maestro/components/TrabajosScreen').then(m => ({ default: m.TrabajosScreen })))
const InventarioScreen  = lazy(() => import('./features/proveedor/components/InventarioScreen').then(m => ({ default: m.InventarioScreen })))
const IntelScreen       = lazy(() => import('./features/proveedor/components/IntelScreen').then(m => ({ default: m.IntelScreen })))
const LogisticaScreen   = lazy(() => import('./features/proveedor/components/LogisticaScreen').then(m => ({ default: m.LogisticaScreen })))
const CotizacionesScreen = lazy(() => import('./features/proveedor/components/CotizacionesScreen').then(m => ({ default: m.CotizacionesScreen })))
const ContratarScreen   = lazy(() => import('./features/contratar/components/ContratarScreen').then(m => ({ default: m.ContratarScreen })))
const SettingsScreen        = lazy(() => import('./features/settings/components/SettingsScreen').then(m => ({ default: m.SettingsScreen })))
const HabilidadesScreen     = lazy(() => import('./features/maestro/components/HabilidadesScreen').then(m => ({ default: m.HabilidadesScreen })))
const NotificationsScreen   = lazy(() => import('./features/notifications/components/NotificationsScreen').then(m => ({ default: m.NotificationsScreen })))
const MisLicitacionesScreen = lazy(() => import('./features/licitaciones/components/MisLicitacionesScreen').then(m => ({ default: m.MisLicitacionesScreen })))
const LicitacionFeed        = lazy(() => import('./features/licitaciones/components/LicitacionFeed').then(m => ({ default: m.LicitacionFeed })))
const MaestroProfileScreen  = lazy(() => import('./features/maestro/components/MaestroProfileScreen').then(m => ({ default: m.MaestroProfileScreen })))
const TransportistaScreen   = lazy(() => import('./features/transportista/components/TransportistaScreen').then(m => ({ default: m.TransportistaScreen })))
const SolicitarTransporteScreen = lazy(() => import('./features/transporte/components/SolicitarTransporteScreen').then(m => ({ default: m.SolicitarTransporteScreen })))
const HistorialTransportistaScreen = lazy(() => import('./features/transportista/components/HistorialScreen').then(m => ({ default: m.HistorialScreen })))
const BilleteraTransportistaScreen = lazy(() => import('./features/transportista/components/BilleteraScreen').then(m => ({ default: m.BilleteraScreen })))

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
      <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
    </div>
  )
}

type AppScreen = 'splash' | 'welcome' | 'register' | 'login' | 'otp' | 'onboarding' | 'oauth-setup' | 'forgot-pin' | 'app'


export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash')
  const [pendingPhone, setPendingPhone] = useState('')
  const [pendingPin, setPendingPin] = useState('')
  const [pendingDebugOtp, setPendingDebugOtp] = useState<string | undefined>()
  const [pendingOAuthUser, setPendingOAuthUser] = useState<OAuthUserData | null>(null)
  const [viewingMaestroId, setViewingMaestroId] = useState<string | null>(null)
  const [chatWith, setChatWith] = useState<{ userId: string; name: string } | null>(null)
  const [hireTargetId, setHireTargetId] = useState<string | null>(null)
  const activeTab = useNavStore((s) => s.activeTab)
  const setActiveTab = useNavStore((s) => s.setTab)
  const { isAuthenticated } = useAuthStore()
  const isAuth = useAuthStore((s) => s.user !== null)
  const accessToken = useAuthStore((s) => s.user?.access_token)
  const refreshToken = useAuthStore((s) => s.user?.refresh_token)
  const currentUser = useAuthStore((s) => s.user)
  const isMaestro = currentUser?.roles?.includes('maestro') ?? false

  // Restore Supabase session from persisted token so RLS-protected queries work
  useEffect(() => {
    if (accessToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' }).catch(() => {})
    }
  }, [accessToken, refreshToken])

  useEffect(() => {
    if (!isAuth && screen === 'app') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScreen('welcome')
      setActiveTab('home')
    }
  }, [isAuth, screen])

  // Chofer has no 'home' tab — land them on 'viajes' instead.
  useEffect(() => {
    if (currentUser?.active_role === 'chofer' && activeTab === 'home') {
      setActiveTab('viajes')
    }
  }, [currentUser?.active_role, activeTab, setActiveTab])

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
            active_role: profile.active_role,
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
        <WelcomeScreen onNavigate={(dest) => setScreen(dest as AppScreen)} />
      </div>
    )
  }

  if (screen === 'register') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <RegisterForm
          onSuccess={(phone, pin, debugOtp) => {
            setPendingPhone(phone)
            setPendingPin(pin)
            setPendingDebugOtp(debugOtp)
            setScreen('otp')
          }}
          onNavigate={(dest) => setScreen(dest as AppScreen)}
        />
      </div>
    )
  }

  if (screen === 'login') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <LoginForm
          onSuccess={() => setScreen('app')}
          onNavigate={(dest) => setScreen(dest as AppScreen)}
        />
      </div>
    )
  }

  if (screen === 'otp') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <OtpVerification
          phone={pendingPhone}
          pin={pendingPin}
          debugOtp={pendingDebugOtp}
          onSuccess={() => {
            // After OTP the store is already populated by OtpVerification.
            // Show onboarding if the user has no name or no city yet.
            // We re-read the store synchronously after setUser was called inside OtpVerification.
            const freshUser = useAuthStore.getState().user
            const needsOnboarding = !freshUser?.name || freshUser.name.trim().length === 0
            setScreen(needsOnboarding ? 'onboarding' : 'app')
          }}
          onNavigate={(dest) => setScreen(dest as AppScreen)}
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

  if (screen === 'forgot-pin') {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <ForgotPinScreen onNavigate={(dest) => setScreen(dest as AppScreen)} />
      </div>
    )
  }

  if (screen === 'oauth-setup' && pendingOAuthUser) {
    return (
      <div className="animate-[fadeSlideUp_0.3s_ease-out]">
        <OAuthProfileSetup
          oauthUser={pendingOAuthUser}
          onComplete={() => { setPendingOAuthUser(null); setScreen('app') }}
        />
      </div>
    )
  }

  const VENDEDOR_TABS = ['home', 'inventario', 'pedidos', 'cotizaciones']
  const isVendedorTab = currentUser?.active_role === 'proveedor' && VENDEDOR_TABS.includes(activeTab)

  if (isVendedorTab) {
    return (
      <>
        <ThemeInitializer />
        <Suspense fallback={<TabSkeleton />}>
          <VendedorApp />
        </Suspense>
        <InstallPWA />
      </>
    )
  }

  if (currentUser?.active_role === 'chofer') {
    return (
      <>
        <ThemeInitializer />
        <Suspense fallback={<TabSkeleton />}>
          <RepartidorApp />
        </Suspense>
        <InstallPWA />
      </>
    )
  }

  const TRABAJADOR_TABS = ['home', 'licitaciones', 'proyectos', 'perfil']
  const isTrabajadorTab = currentUser?.active_role === 'maestro' && TRABAJADOR_TABS.includes(activeTab)

  if (isTrabajadorTab) {
    return (
      <>
        <ThemeInitializer />
        <Suspense fallback={<TabSkeleton />}>
          <TrabajadorApp />
        </Suspense>
        <InstallPWA />
      </>
    )
  }

  return (
    <>
      <ThemeInitializer />
      <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <Suspense fallback={<TabSkeleton />}>
          {/* ── Constructor role: 4-tab dashboard ──────────────────────────── */}
          {currentUser?.active_role === 'constructor' && (
            activeTab === 'home' || activeTab === 'tienda' || activeTab === 'proyectos' || activeTab === 'licitaciones'
          ) && <ConstructorApp />}

          {/* ── Constructor sub-screens (non-tab) ──────────────────────────── */}
          {currentUser?.active_role === 'constructor' && activeTab === 'contratar' && (
            <>
              {chatWith && (
                <ChatScreen
                  otherUserId={chatWith.userId}
                  otherUserName={chatWith.name}
                  onClose={() => setChatWith(null)}
                />
              )}
              {viewingMaestroId
                ? <MaestroProfileScreen
                    maestroId={viewingMaestroId}
                    isOwn={false}
                    onBack={() => setViewingMaestroId(null)}
                    onChat={(id, name) => { setViewingMaestroId(null); setChatWith({ userId: id, name }) }}
                    onHire={(id) => { setHireTargetId(id); setViewingMaestroId(null) }}
                  />
                : <ContratarScreen
                    onViewProfile={(id) => setViewingMaestroId(id)}
                    initialHireMaestroId={hireTargetId}
                  />
              }
            </>
          )}
          {activeTab === 'transporte-pesado' && <SolicitarTransporteScreen type="pesado" onBack={() => setActiveTab('home')} />}
          {activeTab === 'transporte-ligero' && <SolicitarTransporteScreen type="ligero" onBack={() => setActiveTab('home')} />}

          {/* ── Non-constructor roles ──────────────────────────────────────── */}
          {currentUser?.active_role !== 'constructor' && activeTab === 'home' && (
            <HomeScreen onNavigate={setActiveTab} />
          )}
          {currentUser?.active_role !== 'constructor' && activeTab === 'proyectos' && <ProyectosScreen />}
          {currentUser?.active_role !== 'constructor' && activeTab === 'contratar' && (
            <>
              {chatWith && (
                <ChatScreen
                  otherUserId={chatWith.userId}
                  otherUserName={chatWith.name}
                  onClose={() => setChatWith(null)}
                />
              )}
              {viewingMaestroId
                ? <MaestroProfileScreen
                    maestroId={viewingMaestroId}
                    isOwn={false}
                    onBack={() => setViewingMaestroId(null)}
                    onChat={(id, name) => { setViewingMaestroId(null); setChatWith({ userId: id, name }) }}
                    onHire={(id) => { setHireTargetId(id); setViewingMaestroId(null) }}
                  />
                : <ContratarScreen
                    onViewProfile={(id) => setViewingMaestroId(id)}
                    initialHireMaestroId={hireTargetId}
                  />
              }
            </>
          )}
          {currentUser?.active_role !== 'constructor' && activeTab === 'tienda' && <TiendaScreen />}
          {currentUser?.active_role !== 'constructor' && activeTab === 'licitaciones' && (
            currentUser?.active_role === 'maestro' ? <LicitacionFeed /> : <MisLicitacionesScreen />
          )}

          {/* ── Shared screens (all roles) ─────────────────────────────────── */}
          {activeTab === 'pedidos'     && <PedidosProveedorScreen />}
          {activeTab === 'mis-pedidos' && <MisPedidosScreen />}
          {activeTab === 'intel'        && <IntelScreen />}
          {activeTab === 'logistica'    && <LogisticaScreen />}
          {activeTab === 'cotizaciones' && <CotizacionesScreen />}
          {activeTab === 'trabajos'   && <TrabajosScreen />}
          {activeTab === 'inventario' && <InventarioScreen />}
          {activeTab === 'viajes'     && <TransportistaScreen />}
          {activeTab === 'historial'  && <HistorialTransportistaScreen />}
          {activeTab === 'billetera'  && <BilleteraTransportistaScreen />}
          {activeTab === 'mi-perfil'  && (isMaestro && currentUser
            ? <MaestroProfileScreen maestroId={currentUser.user_id} isOwn={true} />
            : <PerfilScreen />
          )}
          {activeTab === 'perfil'     && <PerfilScreen />}
          {activeTab === 'habilidades'     && <HabilidadesScreen />}
          {activeTab === 'settings'        && <SettingsScreen onLogout={() => { setScreen('welcome'); setActiveTab('home') }} />}
          {activeTab === 'notificaciones'  && <NotificationsScreen />}
        </Suspense>
        <InstallPWA />
      </AppLayout>
    </>
  )
}

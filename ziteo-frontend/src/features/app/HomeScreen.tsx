import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../auth/store/authStore'
import type { UserRole } from '../auth/store/authStore'
import { supabase } from '../../lib/supabaseClient'
import GlobalSearchBar from '../../shared/components/GlobalSearchBar'
import { useDashboardStats } from './hooks/useDashboardStats'
import { AdBanner } from '../../shared/components/AdBanner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickAction {
  label: string
  icon: string
  tab: string
}

interface StatCardDef {
  key: string
  label: string
  icon: string
}

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

// ─── Role config ──────────────────────────────────────────────────────────────

const ACTIONS_BY_ROLE: Record<UserRole, QuickAction[]> = {
  constructor: [
    { label: 'Ir a la Tienda', icon: 'storefront', tab: 'tienda' },
    { label: 'Nuevo proyecto', icon: 'add_circle', tab: 'proyectos' },
    { label: 'Contratar maestro', icon: 'handshake', tab: 'contratar' },
    { label: 'Mis proyectos', icon: 'folder', tab: 'proyectos' },
  ],
  maestro: [
    { label: 'Buscar trabajo', icon: 'work_outline', tab: 'trabajos' },
    { label: 'Mis contratos', icon: 'assignment', tab: 'trabajos' },
    { label: 'Mis ganancias', icon: 'payments', tab: 'trabajos' },
    { label: 'Mi perfil', icon: 'person', tab: 'perfil' },
  ],
  proveedor: [
    { label: 'Mi inventario', icon: 'inventory_2', tab: 'inventario' },
    { label: 'Pedidos', icon: 'inbox', tab: 'pedidos' },
    { label: 'Agregar producto', icon: 'add_box', tab: 'inventario' },
    { label: 'Estadísticas', icon: 'bar_chart', tab: 'intel' },
  ],
  chofer: [
    { label: 'Mis entregas', icon: 'local_shipping', tab: 'home' },
    { label: 'Mi perfil', icon: 'person', tab: 'perfil' },
    { label: 'Historial', icon: 'history', tab: 'perfil' },
    { label: 'Ganancias', icon: 'payments', tab: 'perfil' },
  ],
}

const STATS_BY_ROLE: Record<UserRole, StatCardDef[]> = {
  constructor: [
    { key: 'activeProjects', label: 'Proyectos activos', icon: 'construction' },
    { key: 'pendingContracts', label: 'Contratos pendientes', icon: 'pending_actions' },
    { key: 'totalInvested', label: 'Total invertido (Bs.)', icon: 'payments' },
  ],
  maestro: [
    { key: 'activeContracts', label: 'Contratos activos', icon: 'assignment' },
    { key: 'pendingOffers', label: 'Ofertas pendientes', icon: 'schedule' },
    { key: 'totalEarned', label: 'Total ganado (Bs.)', icon: 'savings' },
  ],
  proveedor: [
    { key: 'activeProducts', label: 'Productos activos', icon: 'inventory_2' },
    { key: 'pendingOrders', label: 'Pedidos pendientes', icon: 'inbox' },
    { key: 'totalSales', label: 'Total ventas (Bs.)', icon: 'point_of_sale' },
  ],
  chofer: [
    { key: 'activeProjects', label: 'Entregas activas', icon: 'local_shipping' },
    { key: 'pendingContracts', label: 'Pendientes', icon: 'pending' },
    { key: 'totalInvested', label: 'Total (Bs.)', icon: 'payments' },
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  constructor: 'Constructor',
  proveedor: 'Vendedor',
  maestro: 'Trabajador',
  chofer: 'Delivery',
}

const NOTIFICATION_ICONS: Record<string, string> = {
  contract: 'assignment',
  project: 'construction',
  order: 'inbox',
  payment: 'payments',
  message: 'chat',
  default: 'notifications',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatRowSkeleton({ last }: { last?: boolean }) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 animate-pulse ${
        !last ? 'border-b border-outline-variant/50' : ''
      }`}
    >
      <div className="h-3 w-3 rounded bg-on-surface/10 shrink-0" />
      <div className="h-3 w-32 rounded bg-on-surface/10 flex-1" />
      <div className="h-4 w-10 rounded bg-on-surface/10" />
    </div>
  )
}

interface StatRowProps {
  icon: string
  value: number
  label: string
  last?: boolean
}

function StatRow({ icon, value, label, last }: StatRowProps) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 ${
        !last ? 'border-b border-outline-variant/50' : ''
      }`}
    >
      <span
        className="material-symbols-outlined text-[15px] text-on-surface-variant/60 shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <span className="font-body text-sm text-on-surface-variant flex-1 leading-none">{label}</span>
      <span className="font-headline font-black text-base text-on-surface tracking-[-0.03em] tabular-nums">
        {formatNumber(value)}
      </span>
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
}

function NotificationItem({ notification }: NotificationItemProps) {
  const icon = NOTIFICATION_ICONS[notification.type] ?? NOTIFICATION_ICONS.default
  return (
    <div
      className={`flex items-start gap-3.5 px-4 py-3.5 transition-colors ${
        !notification.is_read ? 'bg-primary/[0.03]' : ''
      }`}
    >
      {/* Bare icon — no container box */}
      <span
        className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
          !notification.is_read ? 'text-primary' : 'text-on-surface-variant/50'
        }`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label text-sm text-on-surface font-semibold leading-snug truncate">
          {notification.title}
        </p>
        {notification.body && (
          <p className="font-body text-xs text-on-surface-variant truncate mt-0.5">{notification.body}</p>
        )}
      </div>
      <span className="font-body text-[11px] text-on-surface-variant/60 shrink-0 mt-0.5 tabular-nums">
        {timeAgo(notification.created_at)}
      </span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface HomeScreenProps {
  onNavigate?: (tab: string) => void
}

export default function HomeScreen({ onNavigate }: HomeScreenProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const role: UserRole = user?.active_role ?? 'constructor'
  const firstName = user?.name ? user.name.split(' ')[0] : ''
  const location = user?.city ?? 'Bolivia'

  const actions = ACTIONS_BY_ROLE[role] ?? ACTIONS_BY_ROLE.constructor
  const statDefs = STATS_BY_ROLE[role] ?? STATS_BY_ROLE.constructor

  const { data: statsData, isLoading: statsLoading } = useDashboardStats()

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['recentNotifications', user?.user_id],
    enabled: !!user?.user_id,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, type, title, message, is_read, created_at')
          .eq('user_id', user!.user_id)
          .order('created_at', { ascending: false })
          .limit(5)
        if (error) return []
        return (data ?? []).map((row) => ({ ...row, body: row.message })) as Notification[]
      } catch {
        return []
      }
    },
  })

  return (
    <>
      <div className="pb-10">

        {/* ── Hero greeting ──────────────────────────────────────────────────── */}
        <div className="px-5 pt-7 pb-6">
          {/* Eyebrow — very quiet */}
          <p className="font-body text-[11px] uppercase tracking-[0.14em] text-on-surface-variant/50 font-semibold mb-2">
            {getGreeting()}
          </p>
          {/* Name — the hero moment */}
          <h1 className="font-headline font-black text-[3rem] text-on-surface leading-[1.0] tracking-[-0.04em]">
            {firstName || 'Bienvenido'}
          </h1>
          {/* Location + role pill */}
          <div className="flex items-center gap-2 mt-3">
            <span className="flex items-center gap-1 font-body text-xs text-on-surface-variant/70">
              <span className="material-symbols-outlined text-[13px]">location_on</span>
              {location}
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="font-label text-[11px] font-bold bg-primary text-on-primary rounded-full px-2.5 py-0.5 leading-none uppercase tracking-wide">
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>

        {/* ── Search bar ─────────────────────────────────────────────────────── */}
        <div className="px-5 mb-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full rounded-2xl bg-surface border border-outline-variant px-4 py-3.5 flex items-center gap-3 text-on-surface-variant text-left active:opacity-80 transition-opacity cursor-pointer"
            aria-label="Abrir búsqueda"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
            <span className="font-body text-sm flex-1 truncate">
              Buscar proyectos, personas, productos...
            </span>
          </button>
        </div>

        {/* ── Constructor hero CTAs ───────────────────────────────────────────── */}
        {role === 'constructor' && (
          <section className="px-5 mb-8">
            {/* Tienda — primary hero button */}
            <button
              onClick={() => onNavigate?.('tienda')}
              className="w-full rounded-2xl bg-primary text-on-primary px-5 py-5 flex items-center gap-4 active:opacity-90 transition-opacity cursor-pointer text-left mb-3 shadow-md shadow-primary/20"
            >
              <div className="w-12 h-12 rounded-xl bg-on-primary/15 flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-on-primary text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  storefront
                </span>
              </div>
              <div className="flex-1">
                <p className="font-headline font-black text-on-primary text-lg leading-tight">
                  Pedir materiales
                </p>
                <p className="font-body text-on-primary/70 text-xs mt-0.5">
                  Cemento, acero, herramientas y más
                </p>
              </div>
              <span className="material-symbols-outlined text-on-primary/60 text-2xl shrink-0">
                arrow_forward
              </span>
            </button>

            {/* Pedir Camión — secondary button (feature en desarrollo) */}
            <div className="w-full rounded-2xl bg-surface-container border border-outline-variant px-5 py-4 flex items-center gap-4 opacity-60">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-amber-600 text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_shipping
                </span>
              </div>
              <div className="flex-1">
                <p className="font-label font-bold text-on-surface text-sm leading-tight">
                  Solicitar transporte / camión
                </p>
                <p className="font-body text-on-surface-variant text-xs mt-0.5">
                  Retira escombros, traslada materiales
                </p>
              </div>
              <span className="font-label font-bold text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                Pronto
              </span>
            </div>
          </section>
        )}

        {/* ── Stats ──────────────────────────────────────────────────────────── */}
        {/* Visual treatment: open rows separated only by hairline dividers — no card box */}
        <section className="mb-8">
          <p className="font-body text-[11px] uppercase tracking-[0.14em] text-on-surface-variant/50 font-semibold px-5 mb-3">
            Resumen
          </p>
          <div className="border-t border-outline-variant/50">
            {statsLoading ? (
              <>
                <StatRowSkeleton />
                <StatRowSkeleton />
                <StatRowSkeleton last />
              </>
            ) : (
              statDefs.map((s, i) => (
                <StatRow
                  key={s.key}
                  icon={s.icon}
                  label={s.label}
                  value={statsData ? (((statsData as unknown) as Record<string, number>)[s.key] ?? 0) : 0}
                  last={i === statDefs.length - 1}
                />
              ))
            )}
          </div>
          <div className="border-b border-outline-variant/50" />
        </section>

        {/* ── Quick actions ──────────────────────────────────────────────────── */}
        {/* Visual treatment: featured action is a solid full-width row; secondary actions are bare label+icon columns */}
        <section className="px-5 mb-8">
          <p className="font-body text-[11px] uppercase tracking-[0.14em] text-on-surface-variant/50 font-semibold mb-4">
            Acciones rápidas
          </p>

          <div className="flex flex-col gap-3">
            {/* Featured primary action — full-width, no icon box */}
            {actions[0] && (
              <button
                onClick={() => onNavigate?.(actions[0].tab)}
                className="w-full bg-on-surface/[0.04] rounded-2xl px-5 py-4 flex items-center gap-4 active:bg-on-surface/[0.07] transition-colors cursor-pointer text-left"
                aria-label={actions[0].label}
              >
                {/* Bare icon — no container box */}
                <span
                  className="material-symbols-outlined text-[24px] text-primary shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {actions[0].icon}
                </span>
                <span className="font-label font-bold text-[15px] text-on-surface leading-tight flex-1">
                  {actions[0].label}
                </span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50 shrink-0">
                  chevron_right
                </span>
              </button>
            )}

            {/* Secondary actions — bare grid, no card wrappers */}
            <div className="grid grid-cols-3 gap-0 border border-outline-variant/60 rounded-2xl overflow-hidden">
              {actions.slice(1).map((action, idx) => (
                <button
                  key={action.label}
                  onClick={() => onNavigate?.(action.tab)}
                  className={`flex flex-col items-center gap-2 px-3 py-4 active:bg-on-surface/[0.06] transition-colors cursor-pointer text-center ${
                    idx < actions.slice(1).length - 1 ? 'border-r border-outline-variant/60' : ''
                  }`}
                  aria-label={action.label}
                >
                  {/* Bare icon — no container box */}
                  <span
                    className="material-symbols-outlined text-[22px] text-on-surface-variant"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                  >
                    {action.icon}
                  </span>
                  <span className="font-label font-semibold text-[11px] text-on-surface leading-tight">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Recent activity ────────────────────────────────────────────────── */}
        {/* Visual treatment: tinted surface container — distinct from stats (open) and actions (tinted neutral) */}
        <section className="px-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-[11px] uppercase tracking-[0.14em] text-on-surface-variant/50 font-semibold">
              Actividad reciente
            </p>
            <button
              onClick={() => onNavigate?.('notificaciones')}
              className="font-label text-xs text-primary font-semibold active:opacity-70 transition-opacity cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-8">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">notifications_off</span>
              <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">Sin actividad reciente</p>
              <p className="font-body text-sm text-on-surface-variant/50 text-center">Aquí verás tus últimas interacciones y actualizaciones</p>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-2xl overflow-hidden divide-y divide-outline-variant/40">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          )}
        </section>

        {/* ── Ad banner ──────────────────────────────────────────────────────── */}
        {/* Placed at the bottom — low-disruption position after all content */}
        <div className="px-5">
          <AdBanner variant="banner" />
        </div>

      </div>

      {isSearchOpen && (
        <GlobalSearchBar onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  )
}

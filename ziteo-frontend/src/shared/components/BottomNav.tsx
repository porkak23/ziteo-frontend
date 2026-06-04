import { useAuthStore } from '../../features/auth/store/authStore'
import type { UserRole } from '../../features/auth/store/authStore'

interface Tab {
  id: string
  label: string
  icon: string
}

const TAB_CONFIG: Record<UserRole, Tab[]> = {
  constructor: [
    { id: 'home',         label: 'Inicio',       icon: 'home' },
    { id: 'tienda',       label: 'Tienda',       icon: 'storefront' },
    { id: 'proyectos',    label: 'Proyectos',    icon: 'engineering' },
    { id: 'licitaciones', label: 'Licitar',      icon: 'gavel' },
  ],
  proveedor: [
    { id: 'home',         label: 'Inicio',       icon: 'home' },
    { id: 'inventario',   label: 'Inventario',   icon: 'inventory_2' },
    { id: 'pedidos',      label: 'Pedidos',      icon: 'receipt_long' },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: 'request_quote' },
  ],
  maestro: [
    { id: 'home',         label: 'Inicio',       icon: 'home' },
    { id: 'licitaciones', label: 'Trabajos',     icon: 'work' },
    { id: 'proyectos',    label: 'Proyectos',    icon: 'engineering' },
    { id: 'perfil',       label: 'Mi Perfil',    icon: 'person' },
  ],
  chofer: [
    { id: 'radar',        label: 'Radar',        icon: 'explore' },
    { id: 'pedidos',      label: 'Pedidos',      icon: 'receipt_long' },
    { id: 'ganancias',    label: 'Ganancias',    icon: 'account_balance_wallet' },
    { id: 'perfil',       label: 'Perfil',       icon: 'person' },
  ],
}

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const user = useAuthStore((s) => s.user)
  const role = user?.active_role ?? 'constructor'
  const tabs = TAB_CONFIG[role]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant flex h-16 px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center flex-1 gap-0.5 cursor-pointer transition-[color,opacity] duration-200 relative"
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-b-full" />
            )}
            <div className={`flex items-center justify-center w-10 h-7 rounded-xl transition-[background-color,transform] duration-200 ${
              isActive ? 'bg-primary/10' : ''
            }`}>
              <span
                className={`material-symbols-outlined text-[22px] transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
            </div>
            <span className={`font-label text-[11px] font-semibold transition-colors duration-200 leading-none ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

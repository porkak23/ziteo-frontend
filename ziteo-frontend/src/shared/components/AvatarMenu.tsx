import { useState } from 'react'
import { UserAvatar } from './UserAvatar'
import { useAuthStore } from '../../features/auth/store/authStore'
import type { UserRole } from '../../features/auth/store/authStore'
import { useNavStore } from '../store/navStore'
import { useThemeStore } from '../hooks/useTheme'
import { supabase } from '../../lib/supabaseClient'

const ROLE_ICONS: Record<UserRole, string> = {
  constructor: 'engineering',
  proveedor: 'storefront',
  maestro: 'construction',
  chofer: 'local_shipping',
}

const ROLE_LABELS: Record<UserRole, string> = {
  constructor: 'Constructor',
  proveedor: 'Vendedor',
  maestro: 'Trabajador',
  chofer: 'Transportista',
}

const ALL_ROLES: UserRole[] = ['constructor', 'proveedor', 'maestro', 'chofer']

interface AvatarMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function AvatarMenu({ isOpen, onClose }: AvatarMenuProps) {
  const user = useAuthStore((s) => s.user)
  const setActiveRole = useAuthStore((s) => s.setActiveRole)
  const addRole = useAuthStore((s) => s.addRole)
  const logout = useAuthStore((s) => s.logout)
  const setTab = useNavStore((s) => s.setTab)
  const { mode, setMode } = useThemeStore()
  const [showAddRole, setShowAddRole] = useState(false)
  const [addedToast, setAddedToast] = useState<string | null>(null)
  const [addingRole, setAddingRole] = useState<UserRole | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)

  if (!isOpen || !user) return null

  const handleRoleSelect = async (role: UserRole) => {
    if (role !== user.active_role) {
      setActiveRole(role)
      setTab('home')
      supabase.from('profiles').update({ active_role: role }).eq('user_id', user.user_id).then(({ error }) => {
        if (error) console.error('Error updating active_role:', error.message)
      })
    }
    onClose()
  }

  const handleAddRole = async (role: UserRole) => {
    if (!user || addingRole) return
    setAddingRole(role)
    setRoleError(null)
    try {
      const { error } = await supabase.from('user_roles').insert({ user_id: user.user_id, role })
      if (error) throw error
      addRole(role)
      setAddedToast(`Rol "${ROLE_LABELS[role]}" agregado`)
      setTimeout(() => setAddedToast(null), 2500)
      setShowAddRole(false)
    } catch {
      setRoleError('No se pudo agregar el rol. Intenta de nuevo.')
    } finally {
      setAddingRole(null)
    }
  }

  const handleLogout = () => { logout(); onClose() }
  const handleSettings = () => { setTab('settings'); onClose() }
  const handlePerfil = () => { setTab('perfil'); onClose() }

  const displayPhone = user.phone.startsWith('+591') ? user.phone.slice(4) : user.phone
  const availableRoles = ALL_ROLES.filter((r) => !user.roles.includes(r))

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-[1px]" onClick={onClose}>
      <div
        className="absolute top-14 right-3 w-72 bg-surface-container rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="bg-surface-container-high px-4 pt-4 pb-3 flex items-center gap-3">
          <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="md" showRing />
          <div className="min-w-0 flex-1">
            <p className="font-headline font-bold text-[15px] text-on-surface truncate leading-tight">
              {user.name}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              +591 {displayPhone}{user.city ? ` · ${user.city}` : ''}
            </p>
            <span className="inline-flex items-center gap-1 mt-1.5 bg-primary/10 text-primary rounded-full px-2 py-0.5">
              <span
                className="material-symbols-outlined text-[11px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {ROLE_ICONS[user.active_role]}
              </span>
              <span className="font-label text-[10px] font-semibold">{ROLE_LABELS[user.active_role]}</span>
            </span>
          </div>
          <button
            onClick={handlePerfil}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-outline-variant/20 transition-colors"
            title="Editar perfil"
          >
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">edit</span>
          </button>
        </div>

        {/* ── Toasts ─────────────────────────────────────────── */}
        {addedToast && (
          <div className="mx-3 mt-2 px-3 py-1.5 bg-primary/10 text-primary text-[11px] rounded-lg font-label text-center">
            {addedToast}
          </div>
        )}
        {roleError && (
          <div className="mx-3 mt-2 px-3 py-1.5 bg-error/10 text-error text-[11px] rounded-lg font-label text-center">
            {roleError}
          </div>
        )}

        {/* ── Roles ──────────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] font-label font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-2">
            Mis roles
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {user.roles.map((role) => {
              const isActive = role === user.active_role
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-on-surface hover:bg-outline-variant/20'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[15px] shrink-0 ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {ROLE_ICONS[role]}
                  </span>
                  <span className="font-label text-[12px] font-semibold truncate">
                    {ROLE_LABELS[role]}
                  </span>
                </button>
              )
            })}

            {/* Agregar rol — aparece como celda del grid si hay roles disponibles */}
            {!showAddRole && availableRoles.length > 0 && (
              <button
                onClick={() => setShowAddRole(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-outline-variant/60 text-primary hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px] shrink-0">add</span>
                <span className="font-label text-[12px] font-semibold">Agregar</span>
              </button>
            )}
          </div>

          {/* Panel de agregar rol */}
          {showAddRole && (
            <div className="mt-2">
              <p className="text-[10px] font-label text-on-surface-variant/50 mb-2">
                Selecciona un rol para agregar:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {availableRoles.map((role) => {
                  const isLoading = addingRole === role
                  return (
                    <button
                      key={role}
                      onClick={() => !addingRole && handleAddRole(role)}
                      disabled={!!addingRole}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-outline-variant/20 transition-colors disabled:opacity-50"
                    >
                      <span
                        className="material-symbols-outlined text-[15px] text-on-surface-variant shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {ROLE_ICONS[role]}
                      </span>
                      <span className="font-label text-[12px] font-semibold truncate">
                        {isLoading ? '...' : ROLE_LABELS[role]}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setShowAddRole(false)}
                className="w-full text-[11px] text-on-surface-variant/60 text-center py-2 mt-1 hover:text-on-surface-variant transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="h-px bg-outline-variant/20 mx-3" />

        {/* ── Apariencia ─────────────────────────────────────── */}
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-label font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-2">
            Apariencia
          </p>
          <div className="flex gap-1.5">
            {([
              { value: 'light', label: 'Claro', icon: 'light_mode' },
              { value: 'dark',  label: 'Oscuro', icon: 'dark_mode' },
              { value: 'system', label: 'Sistema', icon: 'monitor' },
            ] as const).map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-colors ${
                  mode === value
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[17px]"
                  style={{ fontVariationSettings: mode === value ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {icon}
                </span>
                <span className="font-label text-[10px] font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-outline-variant/20 mx-3" />

        {/* ── Acciones ───────────────────────────────────────── */}
        <div className="py-1.5">
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">settings</span>
            <span className="text-[13px] font-label text-on-surface">Configuración</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-error/5 transition-colors rounded-b-2xl"
          >
            <span className="material-symbols-outlined text-[17px] text-error">logout</span>
            <span className="text-[13px] font-label text-error">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}

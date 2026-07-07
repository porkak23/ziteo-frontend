import { useState } from 'react'
import { Z } from '../../shared/design/tokens'
import { ZAvatar, ZIcon } from '../../shared/design/components'
import { useAuthStore } from '../auth/store/authStore'
import type { UserRole } from '../auth/store/authStore'
import { supabase } from '../../lib/supabaseClient'
import { addRole as addRoleService } from '../auth/services/authService'

export interface AccountScreenProps {
  onClose: () => void
  onLogout: () => void
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 46,
        height: 26,
        borderRadius: 13,
        background: value ? Z.orange : Z.divider,
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: Z.surface,
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          transform: value ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s',
        }}
      />
    </button>
  )
}

const ROLE_LABELS: Record<UserRole, string> = {
  constructor: 'Constructor',
  proveedor: 'Proveedor',
  maestro: 'Maestro / Trabajador',
  chofer: 'Chofer / Repartidor',
}

export function AccountScreen({ onClose, onLogout }: AccountScreenProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const setActiveRole = useAuthStore((s) => s.setActiveRole)
  const [notifOn, setNotifOn] = useState(true)
  const [darkOn, setDarkOn] = useState(false)

  const displayName = user?.name ?? 'Usuario'
  const phone = user?.phone ?? '—'
  const city = user?.city ?? '—'
  const role = user?.active_role ?? 'maestro'
  const availableRoles = user?.roles ?? [role]

  const handleSwitchRole = (newRole: UserRole) => {
    if (newRole === role) return
    setActiveRole(newRole)
    supabase.from('profiles').update({ active_role: newRole }).eq('user_id', user!.user_id).then(({ error }) => {
      if (error) console.error('Error updating active_role:', error.message)
    })
    onClose()
  }

  const [addingRole, setAddingRole] = useState<UserRole | null>(null)

  const handleAddRole = async (newRole: UserRole) => {
    if (!user || addingRole) return
    setAddingRole(newRole)
    try {
      await addRoleService(user.access_token, newRole)
      useAuthStore.getState().addRole(newRole)
    } catch (err) {
      console.error('Error adding role:', err)
    } finally {
      setAddingRole(null)
    }
  }

  const handleLogout = () => {
    logout()
    onLogout()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: Z.bg,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '54px 20px 16px',
          background: Z.bg,
        }}
      >
        <h2
          style={{
            fontFamily: Z.font,
            fontSize: 20,
            fontWeight: 800,
            color: Z.text,
            margin: 0,
          }}
        >
          Mi Cuenta
        </h2>
        <button
          onClick={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            border: 'none',
            background: Z.surface,
            cursor: 'pointer',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <ZIcon name="close" size={18} color={Z.textSec} />
        </button>
      </div>

      {/* Avatar + Name */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '20px 20px 28px',
          background: `linear-gradient(180deg, ${Z.orangeLight} 0%, ${Z.bg} 100%)`,
        }}
      >
        <ZAvatar name={displayName} size={80} />
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 20,
              fontWeight: 800,
              color: Z.text,
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              color: Z.textSec,
              marginTop: 4,
            }}
          >
            {ROLE_LABELS[role as UserRole] ?? role}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        {/* Mi cuenta */}
        <div>
          <p
            style={{
              fontFamily: Z.font,
              fontSize: 12,
              fontWeight: 700,
              color: Z.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 1,
              margin: '0 0 10px',
            }}
          >
            Mi cuenta
          </p>
          <div
            style={{
              borderRadius: Z.r.md,
              background: Z.surface,
              border: `1px solid ${Z.border}`,
              overflow: 'hidden',
            }}
          >
            {[
              { label: 'Teléfono', value: phone },
              { label: 'Ciudad', value: city },
              { label: 'Rol activo', value: ROLE_LABELS[role as UserRole] ?? role },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: i < arr.length - 1 ? `1px solid ${Z.divider}` : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: Z.font,
                    fontSize: 14,
                    fontWeight: 600,
                    color: Z.text,
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: Z.font,
                    fontSize: 13,
                    color: Z.textSec,
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <button
            style={{
              width: '100%',
              marginTop: 10,
              padding: '14px',
              borderRadius: Z.r.md,
              border: `1.5px solid ${Z.orange}`,
              background: Z.orangeLight,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: Z.font,
              fontSize: 14,
              fontWeight: 700,
              color: Z.orangeDark,
              textAlign: 'center',
            }}
          >
            Editar perfil
          </button>
        </div>

        {/* Ajustes */}
        <div>
          <p
            style={{
              fontFamily: Z.font,
              fontSize: 12,
              fontWeight: 700,
              color: Z.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 1,
              margin: '0 0 10px',
            }}
          >
            Ajustes
          </p>
          <div
            style={{
              borderRadius: Z.r.md,
              background: Z.surface,
              border: `1px solid ${Z.border}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: `1px solid ${Z.divider}`,
              }}
            >
              <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 600, color: Z.text }}>
                Notificaciones
              </span>
              <Toggle value={notifOn} onChange={setNotifOn} />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
              }}
            >
              <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 600, color: Z.text }}>
                Modo oscuro
              </span>
              <Toggle value={darkOn} onChange={setDarkOn} />
            </div>
          </div>
        </div>

        {/* Cambiar/Agregar rol */}
        <div>
          <p
            style={{
              fontFamily: Z.font,
              fontSize: 12,
              fontWeight: 700,
              color: Z.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 1,
              margin: '0 0 10px',
            }}
          >
            Mis roles
          </p>
          <div
            style={{
              borderRadius: Z.r.md,
              background: Z.surface,
              border: `1px solid ${Z.border}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {availableRoles.map((r, i) => {
              const isActive = r === role
              return (
                <button
                  key={r}
                  onClick={() => handleSwitchRole(r as UserRole)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderBottom: i < availableRoles.length - 1 || Object.keys(ROLE_LABELS).length > availableRoles.length ? `1px solid ${Z.divider}` : 'none',
                    background: isActive ? Z.orangeLight : 'transparent',
                    border: 'none',
                    cursor: isActive ? 'default' : 'pointer',
                    outline: 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: Z.font,
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? Z.orangeDark : Z.text,
                    }}
                  >
                    {ROLE_LABELS[r as UserRole] ?? r}
                  </span>
                  {isActive && (
                    <span
                      style={{
                        fontFamily: Z.font,
                        fontSize: 11,
                        fontWeight: 700,
                        color: Z.orangeDark,
                        background: Z.orange + '22',
                        padding: '3px 8px',
                        borderRadius: 8,
                      }}
                    >
                      Activo
                    </span>
                  )}
                </button>
              )
            })}
            
            {(Object.keys(ROLE_LABELS) as UserRole[]).filter(r => !availableRoles.includes(r)).map((r, i, arr) => (
              <button
                key={r}
                onClick={() => handleAddRole(r)}
                disabled={!!addingRole}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 16px',
                  borderBottom: i < arr.length - 1 ? `1px solid ${Z.divider}` : 'none',
                  background: 'transparent',
                  border: 'none',
                  cursor: addingRole ? 'default' : 'pointer',
                  outline: 'none',
                  opacity: addingRole === r ? 0.5 : 1,
                }}
              >
                <ZIcon name={addingRole === r ? 'hourglass_empty' : 'add'} size={18} color={Z.orange} />
                <span
                  style={{
                    fontFamily: Z.font,
                    fontSize: 14,
                    fontWeight: 600,
                    color: Z.orange,
                  }}
                >
                  Agregar rol de {ROLE_LABELS[r as UserRole]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: Z.r.md,
            border: 'none',
            background: '#FFF1F1',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: Z.font,
            fontSize: 15,
            fontWeight: 700,
            color: '#BA1A1A',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { updateProfile, AuthServiceError } from '../services/authService'
import { AUTH_ERRORS } from '../constants/authConstants'
import type { UserRole } from '../store/authStore'
import { useUploadPhoto } from '../../../shared/hooks/useUploadPhoto'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { supabase } from '../../../lib/supabaseClient'
import { Z } from '@/shared/design/tokens'
import { CIUDADES_ACTIVAS } from '@/shared/constants/geography'
import { track } from '../../../lib/analytics'

interface OnboardingScreenProps {
  onComplete: () => void
}

const ROLE_DATA: { role: UserRole; title: string; description: string }[] = [
  { role: 'constructor', title: 'Constructor', description: 'Compra materiales y gestiona obras' },
  { role: 'proveedor', title: 'Vendedor', description: 'Vende materiales y gestiona pedidos' },
  { role: 'maestro', title: 'Trabajador', description: 'Ofrece servicios profesionales' },
  { role: 'chofer', title: 'Repartidor', description: 'Realiza entregas de materiales' },
]

const VEHICLE_OPTIONS = [
  { value: 'moto', label: 'Motocicleta', icon: '🛵', subtitle: 'Carga ligera — hasta 5 kg' },
  { value: 'camioneta', label: 'Camioneta', icon: '🚗', subtitle: 'Carga pesada — más de 5 kg' },
  { value: 'camion', label: 'Camión', icon: '🚛', subtitle: 'Carga pesada — más de 5 kg' },
  { value: 'pickup', label: 'Pickup', icon: '🛻', subtitle: 'Carga pesada — más de 5 kg' },
] as const

function RoleIconConstructor() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="28" width="32" height="14" rx="2" fill={Z.orangeDark} opacity="0.15"/>
      <rect x="12" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
      <rect x="21" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
      <rect x="30" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
      <path d="M6 28h36" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 28V18l10-8 10 8v10" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      <rect x="20" y="20" width="8" height="8" rx="1.5" stroke={Z.orange} strokeWidth="2" fill="none"/>
    </svg>
  )
}

function RoleIconVendedor() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="20" width="32" height="22" rx="3" fill={Z.blue} opacity="0.12"/>
      <path d="M8 20h32" stroke={Z.blueDark} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M6 20c0 0 4-10 18-10s18 10 18 10" stroke={Z.blue} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <rect x="18" y="28" width="12" height="14" rx="2" stroke={Z.blueDark} strokeWidth="2" fill={Z.blue} opacity="0.2"/>
      <circle cx="24" cy="34" r="1.5" fill={Z.blueDark}/>
    </svg>
  )
}

function RoleIconTrabajador() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
      <path d="M18 10l-8 8 3 3 8-8M30 38l8-8-3-3-8 8" stroke={Z.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 34l20-20" stroke={Z.orangeDark} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="14" cy="34" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
      <circle cx="34" cy="14" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
    </svg>
  )
}

function RoleIconRepartidor() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
      <rect x="4" y="16" width="24" height="18" rx="3" stroke={Z.blueDark} strokeWidth="2.5" fill={Z.blue} opacity="0.1"/>
      <path d="M28 22h10l6 8v4h-16v-12z" stroke={Z.blueDark} strokeWidth="2.5" strokeLinejoin="round" fill={Z.blue} opacity="0.1"/>
      <circle cx="14" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white"/>
      <circle cx="38" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white"/>
      <circle cx="14" cy="36" r="1.5" fill={Z.blueDark}/>
      <circle cx="38" cy="36" r="1.5" fill={Z.blueDark}/>
    </svg>
  )
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  constructor: <RoleIconConstructor />,
  proveedor: <RoleIconVendedor />,
  maestro: <RoleIconTrabajador />,
  chofer: <RoleIconRepartidor />,
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { user, setUser } = useAuthStore()
  const { upload, isUploading } = useUploadPhoto()
  const { toasts, showToast, removeToast } = useToast()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [nameTouched, setNameTouched] = useState(false)
  const [city, setCity] = useState('')
  const [activeRole, setActiveRole] = useState<UserRole>(user?.active_role ?? 'constructor')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '')
  const [vehicleType, setVehicleType] = useState<string>('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const roles = user?.roles ?? []
  const hasMultipleRoles = roles.length > 1

  const nameError = nameTouched && name.trim().length > 0 && name.trim().length < 3
    ? 'Mínimo 3 caracteres'
    : null

  const isChofer = activeRole === 'chofer' || (user?.roles ?? []).includes('chofer')
  const vehicleError = isChofer && !vehicleType ? 'Selecciona tu tipo de vehículo' : null
  const hasErrors = !!nameError || !city || name.trim().length < 3 || !!vehicleError

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const publicUrl = await upload(file)
      setAvatarUrl(publicUrl)
      showToast('Foto de perfil cargada', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo subir la foto'
      showToast(msg, 'error')
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameTouched(true)
    if (hasErrors) return

    setApiError(null)
    setLoading(true)
    try {
      await updateProfile(user!.user_id, {
        name: name.trim(),
        city,
        active_role: activeRole,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })

      if (isChofer && vehicleType) {
        await supabase
          .from('user_roles')
          .update({ vehicle_type: vehicleType })
          .eq('user_id', user!.user_id)
          .eq('role', 'chofer')
      }

      if (user) {
        setUser({
          ...user,
          name: name.trim(),
          city,
          active_role: activeRole,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
      }
      track.onboardingComplete(activeRole)
      onComplete()
    } catch (err) {
      const errorCode = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      setApiError(AUTH_ERRORS[errorCode] ?? 'Ocurrió un error al guardar tu perfil, intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  const initials = name.trim().split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'Z'

  const inputStyle: React.CSSProperties = {
    fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text,
    padding: '14px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
    background: Z.surface, outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: Z.bg }}
    >
      <Toast toasts={toasts} onRemove={removeToast} />

      <div
        style={{
          padding: '60px 24px 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          background: `linear-gradient(180deg, ${Z.orangeLight} 0%, ${Z.bg} 100%)`,
        }}
      >
        <div style={{ position: 'relative', width: 88, height: 88 }}>
          <div
            style={{
              width: 88, height: 88, borderRadius: '50%',
              background: Z.gradOrange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(232,115,58,0.25)',
              overflow: 'hidden',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: Z.font, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: 1 }}>
                {initials}
              </span>
            )}
            {isUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined animate-spin text-white text-2xl">progress_activity</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => !isUploading && photoInputRef.current?.click()}
            disabled={isUploading}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: '50%',
              background: Z.orangeDark, color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              opacity: isUploading ? 0.5 : 1,
            }}
            aria-label="Seleccionar foto de perfil"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input
            ref={photoInputRef}
            id="onboarding-photo"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 22, color: Z.text, margin: 0 }}>
            Completa tu perfil
          </h2>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>
            Solo toma un momento
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto"
        style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
            Nombre completo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            placeholder="Ej. Alejandro Mendoza"
            style={{ ...inputStyle, borderColor: nameError ? Z.error : Z.border }}
          />
          {nameError && (
            <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{nameError}</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
            Ciudad
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{
              ...inputStyle,
              borderColor: nameTouched && !city ? Z.error : Z.border,
              appearance: 'none',
              cursor: 'pointer',
              color: city ? Z.text : Z.textMuted,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
          >
            <option value="">Selecciona tu ciudad</option>
            {CIUDADES_ACTIVAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {nameTouched && !city && (
            <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>Selecciona una ciudad</span>
          )}
        </div>

        <div>
          <label
            style={{
              fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textMuted,
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'block',
            }}
          >
            Rol activo
          </label>

          {hasMultipleRoles ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROLE_DATA.filter((r) => roles.includes(r.role)).map((r) => {
                const isSelected = activeRole === r.role
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setActiveRole(r.role)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: Z.r.md, cursor: 'pointer', width: '100%', textAlign: 'left',
                      border: isSelected ? `2px solid ${Z.orange}` : `1.5px solid ${Z.border}`,
                      background: isSelected ? Z.orangeLight : Z.surface,
                      transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none',
                    }}
                  >
                    {ROLE_ICONS[r.role]}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{r.title}</div>
                      <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 1 }}>{r.description}</div>
                    </div>
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? Z.orange : Z.border}`,
                        background: isSelected ? Z.orange : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {isSelected && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROLE_DATA.map((r) => {
                const isSelected = activeRole === r.role
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setActiveRole(r.role)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: Z.r.md, cursor: 'pointer', width: '100%', textAlign: 'left',
                      border: isSelected ? `2px solid ${Z.orange}` : `1.5px solid ${Z.border}`,
                      background: isSelected ? Z.orangeLight : Z.surface,
                      transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none',
                    }}
                  >
                    {ROLE_ICONS[r.role]}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{r.title}</div>
                      <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 1 }}>{r.description}</div>
                    </div>
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? Z.orange : Z.border}`,
                        background: isSelected ? Z.orange : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {isSelected && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {isChofer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              style={{
                fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textMuted,
                letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, display: 'block',
              }}
            >
              Tipo de vehículo
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {VEHICLE_OPTIONS.map((v) => {
                const isSelected = vehicleType === v.value
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVehicleType(v.value)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '12px 8px',
                      borderRadius: Z.r.md,
                      border: isSelected ? `2px solid ${Z.orange}` : `1.5px solid ${Z.border}`,
                      background: isSelected ? Z.orangeLight : Z.surface,
                      cursor: 'pointer', textAlign: 'center', outline: 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{v.icon}</span>
                    <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: isSelected ? Z.orangeDark : Z.text }}>{v.label}</span>
                    <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textSec, lineHeight: 1.3 }}>{v.subtitle}</span>
                  </button>
                )
              })}
            </div>
            {nameTouched && vehicleError && (
              <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{vehicleError}</span>
            )}
          </div>
        )}

        {apiError && (
          <div
            style={{
              padding: '12px 16px', borderRadius: Z.r.md,
              background: Z.errorBg, border: `1px solid ${Z.error}`,
            }}
          >
            <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error }}>{apiError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (nameTouched && hasErrors)}
          style={{
            fontFamily: Z.font, fontWeight: 700, fontSize: 15,
            letterSpacing: '0.2px',
            padding: '16px 24px', borderRadius: Z.r.md,
            background: Z.gradOrange, color: '#fff',
            border: 'none', cursor: loading ? 'default' : 'pointer', width: '100%',
            boxShadow: '0 4px 20px rgba(232,115,58,0.38)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'opacity 0.15s',
            opacity: loading || (nameTouched && hasErrors) ? 0.6 : 1,
          }}
        >
          {loading ? 'Guardando...' : (
            <>
              Ingresar como {ROLE_DATA.find((r) => r.role === activeRole)?.title}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>

        <div style={{ height: 8 }} />
      </form>
    </div>
  )
}

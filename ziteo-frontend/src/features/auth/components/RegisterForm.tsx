import { useRef, useState } from 'react'
import type { UserRole } from '../store/authStore'
import { registerUser, AuthServiceError } from '../services/authService'
import { AUTH_ERRORS } from '../constants/authConstants'
import { OAuthButtons } from './OAuthButtons'
import { Z } from '@/shared/design/tokens'

interface RegisterFormProps {
  onSuccess: (phone: string, pin: string, debugOtp?: string) => void
  onNavigate: (dest: string) => void
}

type RoleOption = {
  value: UserRole
  label: string
  description: string
  disabled?: boolean
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'constructor',
    label: 'Constructor',
    description: 'Busca materiales, herramientas y contrata profesionales para tus obras.',
  },
  {
    value: 'proveedor',
    label: 'Vendedor',
    description: 'Gestiona tu inventario, ventas y pedidos de materiales de construcción.',
  },
  {
    value: 'maestro',
    label: 'Trabajador',
    description: 'Recibe solicitudes de trabajo y muestra tu experiencia profesional.',
  },
  {
    value: 'chofer' as UserRole,
    label: 'Repartidor',
    description: 'Gestiona entregas de materiales con camiones o motocicletas.',
  },
]

const CITIES = [
  'La Paz',
  'Santa Cruz de la Sierra',
  'Cochabamba',
  'Sucre',
  'Oruro',
  'Potosí',
  'Tarija',
  'Trinidad',
  'Cobija',
  'El Alto',
  'Sacaba',
]

const PHONE_REGEX = /^[678]\d{7}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PIN_DIGITS = 8

interface FormErrors {
  phone?: string
  name?: string
  email?: string
  city?: string
  pin?: string
  confirmPin?: string
  companyName?: string
}

function ArrowLeftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke={Z.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function RoleIconConstructor() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
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
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
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
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
      <path d="M18 10l-8 8 3 3 8-8M30 38l8-8-3-3-8 8" stroke={Z.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 34l20-20" stroke={Z.orangeDark} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="14" cy="34" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
      <circle cx="34" cy="14" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
    </svg>
  )
}

function RoleIconRepartidor() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
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

export default function RegisterForm({ onSuccess, onNavigate }: RegisterFormProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0)

  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [roles, setRoles] = useState<UserRole[]>(['constructor'])
  const [isCompany, setIsCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const pinRef = useRef<HTMLInputElement>(null)
  const confirmPinRef = useRef<HTMLInputElement>(null)

  function toggleRole(r: UserRole) {
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])
  }

  function goBack() {
    if (step === 0) onNavigate('welcome')
    else setStep((s) => (s - 1) as 0 | 1 | 2)
  }

  function validateStep0(): FormErrors {
    const errs: FormErrors = {}
    if (!PHONE_REGEX.test(phone)) {
      errs.phone = 'Ingresa un número válido (8 dígitos, ej. 76543210)'
    }
    if (name.trim().length < 2) {
      errs.name = 'El nombre debe tener al menos 2 caracteres'
    }
    if (email && !EMAIL_REGEX.test(email)) {
      errs.email = 'Ingresa un correo válido'
    }
    if (!city) {
      errs.city = 'Selecciona una ciudad'
    }
    if (!/^\d{8}$/.test(pin)) {
      errs.pin = `La contraseña debe tener exactamente ${PIN_DIGITS} dígitos`
    }
    if (pin !== confirmPin) {
      errs.confirmPin = 'Las contraseñas no coinciden'
    }
    if (isCompany && !companyName.trim()) {
      errs.companyName = 'Ingresa el nombre de tu empresa'
    }
    return errs
  }

  function handleStep0Next() {
    const errs = validateStep0()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setStep(1)
  }

  async function handleSubmit() {
    const errs = validateStep0()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setStep(0)
      return
    }
    setErrors({})
    setApiError(null)
    setLoading(true)
    try {
      const fullPhone = '+591' + phone
      const result = await registerUser({
        phone: fullPhone,
        name: name.trim(),
        email: email.trim() || undefined,
        city,
        pin,
        initial_role: roles[0] ?? 'constructor',
        plan: 'free',
        company_name: companyName || undefined,
      })
      onSuccess(phone, pin, result.debug_otp)
    } catch (err) {
      const code = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      setApiError(AUTH_ERRORS[code] ?? 'Ocurrió un error, intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

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
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '58px 16px 12px', position: 'relative', zIndex: 5,
        }}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label="Volver"
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.04)',
          }}
        >
          <ArrowLeftIcon />
        </button>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '0 24px 8px' }}>
        <div style={{ display: 'flex', gap: 6, padding: '0 4px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i < step ? Z.orange : i === step ? Z.orangePastel : Z.divider,
                transition: 'background 0.3s',
                overflow: 'hidden', position: 'relative',
              }}
            >
              {i === step && (
                <div
                  style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: '50%', background: Z.orange, borderRadius: 2,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        {step === 0 && (
          <div
            key="step0"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFadeSlideIn 0.3s ease' }}
          >
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
                Crea tu cuenta
              </h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Ingresa tus datos para comenzar
              </p>
            </div>

            <OAuthButtons />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: Z.border }} />
              <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textMuted, whiteSpace: 'nowrap' }}>
                o con teléfono
              </span>
              <div style={{ flex: 1, height: 1, background: Z.border }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Número de teléfono
              </label>
              <div
                style={{
                  display: 'flex', alignItems: 'center',
                  border: `1.5px solid ${errors.phone ? Z.error : Z.border}`,
                  borderRadius: Z.r.sm, background: Z.surface, overflow: 'hidden',
                }}
              >
                <span style={{ padding: '0 0 0 14px', fontFamily: Z.font, fontSize: 15, fontWeight: 600, color: Z.textSec, whiteSpace: 'nowrap' }}>
                  +591
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="7XX XXX XX"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text, padding: '14px 14px 14px 8px' }}
                />
              </div>
              {errors.phone && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{errors.phone}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Carlos Mamani"
                style={{ ...inputStyle, borderColor: errors.name ? Z.error : Z.border }}
              />
              {errors.name && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{errors.name}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Correo electrónico{' '}
                <span style={{ fontWeight: 400, color: Z.textMuted }}>(opcional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                style={{ ...inputStyle, borderColor: errors.email ? Z.error : Z.border }}
              />
              {errors.email && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{errors.email}</span>}
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
                  borderColor: errors.city ? Z.error : Z.border,
                  appearance: 'none',
                  cursor: 'pointer',
                  color: city ? Z.text : Z.textMuted,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                }}
              >
                <option value="">Selecciona tu ciudad</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.city && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{errors.city}</span>}
            </div>

            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                  PIN de seguridad ({PIN_DIGITS} dígitos)
                </label>
                <div
                  onClick={() => pinRef.current?.focus()}
                  style={{ display: 'flex', gap: 8, justifyContent: 'center', cursor: 'text', position: 'relative' }}
                >
                  <input
                    ref={pinRef}
                    type="tel"
                    maxLength={PIN_DIGITS}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_DIGITS))}
                    style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                    autoComplete="new-password"
                  />
                  {Array.from({ length: PIN_DIGITS }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 36, height: 44, borderRadius: Z.r.sm,
                        border: `1.5px solid ${i === pin.length ? Z.orange : i < pin.length ? Z.orange : errors.pin ? Z.error : Z.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: i < pin.length ? Z.orangeLight : Z.surface,
                        transition: 'all 0.15s',
                      }}
                    >
                      {i < pin.length && (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: Z.orangeDark }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {errors.pin && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500, display: 'block', marginTop: 6 }}>{errors.pin}</span>}
            </div>

            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                  Confirmar PIN
                </label>
                <div
                  onClick={() => confirmPinRef.current?.focus()}
                  style={{ display: 'flex', gap: 8, justifyContent: 'center', cursor: 'text', position: 'relative' }}
                >
                  <input
                    ref={confirmPinRef}
                    type="tel"
                    maxLength={PIN_DIGITS}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, PIN_DIGITS))}
                    style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                    autoComplete="new-password"
                  />
                  {Array.from({ length: PIN_DIGITS }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 36, height: 44, borderRadius: Z.r.sm,
                        border: `1.5px solid ${i === confirmPin.length ? Z.orange : i < confirmPin.length ? Z.orange : errors.confirmPin ? Z.error : Z.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: i < confirmPin.length ? Z.orangeLight : Z.surface,
                        transition: 'all 0.15s',
                      }}
                    >
                      {i < confirmPin.length && (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: Z.orangeDark }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {errors.confirmPin && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500, display: 'block', marginTop: 6 }}>{errors.confirmPin}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                  ¿Registrar empresa?
                </span>
                <div
                  onClick={() => setIsCompany((v) => !v)}
                  style={{
                    width: 44, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer',
                    background: isCompany ? Z.orange : Z.border, transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: '50%', background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      transition: 'transform 0.2s',
                      transform: isCompany ? 'translateX(18px)' : 'translateX(0)',
                    }}
                  />
                </div>
              </div>
              {isCompany && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Constructora Andina S.R.L."
                    style={{ ...inputStyle, borderColor: errors.companyName ? Z.error : Z.border }}
                  />
                  {errors.companyName && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{errors.companyName}</span>}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleStep0Next}
              style={{
                fontFamily: Z.font, fontWeight: 700, fontSize: 14,
                letterSpacing: '0.3px', textTransform: 'uppercase',
                padding: '15px 24px', borderRadius: Z.r.md,
                background: Z.orangeDark, color: '#FFFFFF',
                border: 'none', cursor: 'pointer', width: '100%',
                transition: 'all 0.15s ease',
              }}
            >
              Siguiente
            </button>
          </div>
        )}

        {step === 1 && (
          <div
            key="step1"
            style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'zFadeSlideIn 0.3s ease' }}
          >
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
                ¿Cuál es tu rol?
              </h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Puedes seleccionar más de uno
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLE_OPTIONS.map((r) => {
                const selected = roles.includes(r.value)
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => toggleRole(r.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      borderRadius: Z.r.md, cursor: 'pointer', width: '100%', textAlign: 'left',
                      border: `2px solid ${selected ? Z.orange : Z.border}`,
                      background: selected ? Z.orangeLight : Z.surface,
                      transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none',
                    }}
                  >
                    {ROLE_ICONS[r.value]}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{r.label}</div>
                      <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec, marginTop: 2 }}>{r.description}</div>
                    </div>
                    <div
                      style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        border: `2px solid ${selected ? Z.orange : Z.border}`,
                        background: selected ? Z.orange : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      {selected && <CheckIcon />}
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={roles.length === 0}
              style={{
                fontFamily: Z.font, fontWeight: 700, fontSize: 14,
                letterSpacing: '0.3px', textTransform: 'uppercase',
                padding: '15px 24px', borderRadius: Z.r.md,
                background: Z.orangeDark, color: '#FFFFFF',
                border: 'none', cursor: roles.length === 0 ? 'default' : 'pointer', width: '100%',
                transition: 'all 0.15s ease', opacity: roles.length === 0 ? 0.45 : 1,
                marginTop: 8,
              }}
            >
              Siguiente
            </button>
          </div>
        )}

        {step === 2 && (
          <div
            key="step2"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFadeSlideIn 0.3s ease' }}
          >
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
                Elige tu plan
              </h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Comienza gratis, actualiza cuando quieras
              </p>
            </div>

            <div
              style={{
                padding: '16px 20px', borderRadius: Z.r.md,
                border: `2px solid ${Z.orange}`,
                background: Z.orangeLight,
              }}
            >
              <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 700, color: Z.text, marginBottom: 8 }}>
                Plan Gratuito
              </div>
              {['Hasta 3 proyectos activos', 'Acceso a la tienda', 'Perfil básico', 'Chat con otros usuarios'].map((b) => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: Z.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckIcon />
                  </div>
                  <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec }}>{b}</span>
                </div>
              ))}
            </div>

            {apiError && (
              <div aria-live="polite">
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error }}>{apiError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                fontFamily: Z.font, fontWeight: 700, fontSize: 14,
                letterSpacing: '0.3px', textTransform: 'uppercase',
                padding: '15px 24px', borderRadius: Z.r.md,
                background: Z.gradOrange, color: '#FFFFFF',
                border: 'none', cursor: loading ? 'default' : 'pointer', width: '100%',
                boxShadow: '0 4px 20px rgba(232,115,58,0.38)',
                transition: 'all 0.15s ease', opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Procesando...' : 'Crear Cuenta'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { registerUser, AuthServiceError } from '../services/authService'
import { AUTH_ERRORS } from '../constants/authConstants'
import { OAuthButtons } from './OAuthButtons'

interface RegisterFormProps {
  onSuccess: (phone: string, pin: string, debugOtp?: string) => void
  onNavigate: (dest: string) => void
}

// TODO Fase 2: add "Solicitar cambio de rol" screen post-registro that calls RPC promote_user_role

type PlanOption = {
  value: 'free' | 'pro' | 'ultra'
  label: string
  icon: string
  disabled: boolean
  benefits: string[]
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    value: 'free',
    label: 'Plan Gratuito',
    icon: 'card_membership',
    disabled: false,
    benefits: [
      'Hasta 3 proyectos activos',
      'Acceso a la tienda',
      'Perfil básico',
      'Chat con otros usuarios',
    ],
  },
  {
    value: 'pro',
    label: 'Plan Pro',
    icon: 'workspace_premium',
    disabled: true,
    benefits: [
      'Proyectos ilimitados',
      'Publicidad destacada',
      'Analytics avanzados',
      'Soporte prioritario',
    ],
  },
  {
    value: 'ultra',
    label: 'Plan Ultra',
    icon: 'diamond',
    disabled: true,
    benefits: [
      'Todo lo de Pro',
      'API access',
      'Multi-cuenta',
      'Manager dedicado',
    ],
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

const STEP_META = [
  { label: 'Tu información', heading: 'Crea tu\ncuenta', sub: 'Ingresa tus datos para comenzar' },
  { label: 'Tu plan', heading: 'Elige\ntu plan', sub: 'Comienza gratis, actualiza cuando quieras' },
]

export default function RegisterForm({ onSuccess, onNavigate }: RegisterFormProps) {
  const [step, setStep] = useState<1 | 2>(1)

  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [plan, setPlan] = useState<'free' | 'pro' | 'ultra'>('free')
  const [isCompany, setIsCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validateStep1(): FormErrors {
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

  function handleStep1Next() {
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setStep(1)
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
        initial_role: 'constructor', // always constructor; role upgrade via promote_user_role RPC
        plan,
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

  const currentMeta = STEP_META[step - 1]

  return (
    <main className="min-h-dvh w-full flex flex-col bg-background overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 bg-background z-10 px-5 pt-10 pb-5">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              if (step === 1) onNavigate('welcome')
              else setStep(1)
            }}
            className="w-11 h-11 flex items-center justify-center text-on-surface-variant cursor-pointer -ml-1"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="font-headline font-black text-sm text-on-surface/20 tracking-[-0.02em]">ZITEO</span>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-on-surface-variant/45 tracking-wide">
              Paso {step} de 2
            </span>
            <span className="font-body text-xs text-on-surface-variant/45">
              {currentMeta.label}
            </span>
          </div>
          <div className="w-full h-0.5 bg-outline-variant/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step heading */}
      <div className="px-6 mt-8 mb-8">
        <h1 className="font-headline font-black text-[42px] text-on-surface leading-[0.94] tracking-[-0.03em] whitespace-pre-line">
          {currentMeta.heading}
        </h1>
        <p className="font-body text-sm text-on-surface-variant/60 mt-3">{currentMeta.sub}</p>
      </div>

      {/* Step 1: Tu información */}
      {step === 1 && (
        <div className="flex flex-col gap-6 px-6 pb-10 max-w-sm mx-auto w-full">
          {/* OAuth quick-start */}
          <OAuthButtons />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant/30" />
            <span className="font-body text-xs text-on-surface-variant/40">o con teléfono</span>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-phone" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
              Teléfono de contacto
            </label>
            <div className="flex items-center rounded-xl border border-outline-variant/60 bg-surface-container-low overflow-hidden focus-within:border-primary/70">
              <span className="px-3 py-4 font-body text-sm text-on-surface-variant/60 border-r border-outline-variant/40 bg-surface-container select-none">
                +591
              </span>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="70000000"
                required
                className="flex-1 px-3 py-4 bg-transparent text-on-surface font-body text-sm focus:outline-none"
              />
            </div>
            <div aria-live="polite" className="min-h-[1rem]">
              {errors.phone && <span className="text-error text-xs">{errors.phone}</span>}
            </div>
          </div>

          {/* Full name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-name" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
              Nombre completo
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Alejandro Mendoza"
              required
              className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <div aria-live="polite" className="min-h-[1rem]">
              {errors.name && <span className="text-error text-xs">{errors.name}</span>}
            </div>
          </div>

          {/* Email (optional) */}
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-email" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
              Correo electrónico <span className="normal-case font-normal text-on-surface-variant/40">(opcional)</span>
            </label>
            <input
              id="reg-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <div aria-live="polite" className="min-h-[1rem]">
              {errors.email && <span className="text-error text-xs">{errors.email}</span>}
            </div>
          </div>

          {/* City */}
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-city" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
              Ciudad
            </label>
            <select
              id="reg-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none"
            >
              <option value="">Selecciona tu ciudad</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div aria-live="polite" className="min-h-[1rem]">
              {errors.city && <span className="text-error text-xs">{errors.city}</span>}
            </div>
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-pin" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
              Contraseña (8 dígitos)
            </label>
            <input
              id="reg-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_DIGITS))}
              placeholder="········"
              maxLength={PIN_DIGITS}
              aria-required="true"
              className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <div className="flex gap-2 mt-1">
              {Array.from({ length: PIN_DIGITS }, (_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 border-primary transition-colors duration-150 ${
                    i < pin.length ? 'bg-primary' : 'bg-transparent opacity-35'
                  }`}
                />
              ))}
            </div>
            <span className="font-body text-xs text-on-surface-variant/45 mt-0.5">Solo números, 8 dígitos</span>
            <div aria-live="polite" className="min-h-[1rem]">
              {errors.pin && <span className="text-error text-xs">{errors.pin}</span>}
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-confirm-pin" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
              Confirmar contraseña
            </label>
            <input
              id="reg-confirm-pin"
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, PIN_DIGITS))}
              placeholder="········"
              maxLength={PIN_DIGITS}
              aria-required="true"
              className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <div className="flex gap-2 mt-1">
              {Array.from({ length: PIN_DIGITS }, (_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 border-primary transition-colors duration-150 ${
                    i < confirmPin.length ? 'bg-primary' : 'bg-transparent opacity-35'
                  }`}
                />
              ))}
            </div>
            <div aria-live="polite" className="min-h-[1rem]">
              {errors.confirmPin && <span className="text-error text-xs">{errors.confirmPin}</span>}
            </div>
          </div>

          {/* Company toggle */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">¿Registrar empresa?</span>
              <button
                type="button"
                role="switch"
                aria-checked={isCompany}
                onClick={() => setIsCompany((v) => !v)}
                className={`relative inline-flex w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer ${isCompany ? 'bg-primary' : 'bg-outline-variant/60'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface shadow transition-transform duration-200 ${isCompany ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
            {isCompany && (
              <div className="flex flex-col gap-2">
                <label htmlFor="reg-company-name" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
                  Nombre de la empresa
                </label>
                <input
                  id="reg-company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej. Constructora Andina S.R.L."
                  required
                  className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <div aria-live="polite" className="min-h-[1rem]">
                  {errors.companyName && <span className="text-error text-xs">{errors.companyName}</span>}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleStep1Next}
            className="w-full px-4 py-[18px] bg-primary text-on-primary font-label font-bold rounded-xl text-[15px] tracking-[-0.01em] transition-[transform,opacity] active:scale-[0.98] active:opacity-80 cursor-pointer"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Step 2: Elige tu plan */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6 pb-10 max-w-sm mx-auto w-full">
          {PLAN_OPTIONS.map((opt) => {
            const isActive = plan === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => { if (!opt.disabled) setPlan(opt.value) }}
                className={`relative flex flex-col gap-3 p-5 rounded-xl text-left transition-colors ${
                  opt.disabled
                    ? 'border border-outline-variant/30 bg-surface-container opacity-30 cursor-not-allowed'
                    : isActive
                    ? 'border-2 border-primary bg-primary/[0.05] cursor-pointer'
                    : 'border border-outline-variant/50 bg-surface-container-low hover:border-outline-variant cursor-pointer'
                }`}
              >
                {opt.disabled && (
                  <span className="absolute top-3 right-3 bg-outline-variant/30 text-on-surface-variant/50 text-[9px] font-label font-semibold px-1.5 py-0.5 rounded-full leading-none uppercase tracking-wider">
                    Próximamente
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[28px] ${isActive && !opt.disabled ? 'text-primary' : 'text-on-surface-variant/60'}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {opt.icon}
                  </span>
                  <span className={`font-label text-[15px] font-bold ${isActive && !opt.disabled ? 'text-primary' : 'text-on-surface'}`}>
                    {opt.label}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {opt.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2.5">
                      <span
                        className={`material-symbols-outlined text-base flex-shrink-0 ${isActive && !opt.disabled ? 'text-primary' : 'text-on-surface-variant/40'}`}
                        style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="font-body text-sm text-on-surface-variant/70">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-[18px] bg-primary text-on-primary font-label font-bold rounded-xl text-[15px] tracking-[-0.01em] transition-[transform,opacity] active:scale-[0.98] active:opacity-80 disabled:opacity-60 mt-2 cursor-pointer"
          >
            {loading ? 'Procesando...' : 'Crear cuenta →'}
          </button>
          <div aria-live="polite" className="min-h-[1.25rem]">
            {apiError && <span className="text-error text-sm text-center block">{apiError}</span>}
          </div>
        </form>
      )}
    </main>
  )
}

import { useState } from 'react'
import { loginUser, AuthServiceError } from '../services/authService'
import { AUTH_ERRORS } from '../constants/authConstants'
import { useAuthStore } from '../store/authStore'
import { OAuthButtons } from './OAuthButtons'
import type { AuthUser } from '../types/authTypes'

const PIN_DIGITS = 8

interface LoginFormProps {
  onSuccess: () => void
  onNavigate: (dest: string) => void
}

const PHONE_REGEX = /^[678]\d{7}$/

interface FormErrors {
  phone?: string
  pin?: string
}

export default function LoginForm({ onSuccess, onNavigate }: LoginFormProps) {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((s) => s.setUser)

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!PHONE_REGEX.test(phone)) {
      errs.phone = 'Ingresa un número válido (8 dígitos, ej. 76543210)'
    }
    if (!/^\d{8}$/.test(pin)) {
      errs.pin = `La contraseña debe tener exactamente ${PIN_DIGITS} dígitos`
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setApiError(null)
    setLoading(true)
    try {
      const fullPhone = '+591' + phone
      const data = await loginUser({ phone: fullPhone, pin })
      const authUser: AuthUser = {
        user_id: data.user_id,
        name: data.name,
        phone: data.phone,
        active_role: data.active_role,
        roles: data.roles,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        avatar_url: data.avatar_url ?? undefined,
        city: data.city ?? null,
      }
      setUser(authUser)
      onSuccess()
    } catch (err) {
      const code = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      setApiError(AUTH_ERRORS[code] ?? 'Ocurrió un error, intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh w-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <button
          onClick={() => onNavigate('welcome')}
          className="w-11 h-11 flex items-center justify-center text-on-surface-variant cursor-pointer -ml-1"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <span className="font-headline font-black text-sm text-on-surface/20 tracking-[-0.02em]">ZITEO</span>
      </div>

      {/* Headline */}
      <div className="px-6 mt-14 mb-12">
        <p className="font-body text-[11px] text-on-surface-variant/45 font-medium tracking-[0.18em] uppercase mb-5">
          Iniciar sesión
        </p>
        <h1 className="font-headline font-black text-[52px] text-on-surface leading-[0.93] tracking-[-0.03em]">
          Bienvenido<br />de nuevo.
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 pb-10 max-w-sm mx-auto w-full">
        {/* Phone */}
        <div className="flex flex-col gap-2">
          <label htmlFor="login-phone" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
            Teléfono
          </label>
          <input
            id="login-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="70000000"
            required
            className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          <div aria-live="polite" className="min-h-[1rem]">
            {errors.phone && <span className="text-error text-xs">{errors.phone}</span>}
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label htmlFor="login-pin" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
            Contraseña (8 dígitos)
          </label>
          <input
            id="login-pin"
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
          <div aria-live="polite" className="min-h-[1rem]">
            {errors.pin && <span className="text-error text-xs">{errors.pin}</span>}
          </div>
        </div>

        {/* Forgot password */}
        <button
          type="button"
          onClick={() => onNavigate('forgot-pin')}
          className="-mt-2 self-start font-label text-sm text-on-surface-variant/50 cursor-pointer hover:text-primary transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-[18px] bg-primary text-on-primary font-label font-bold rounded-xl text-[15px] tracking-[-0.01em] transition-[transform,opacity] active:scale-[0.98] active:opacity-80 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Procesando...' : 'Iniciar sesión →'}
        </button>
        <div aria-live="polite" className="min-h-[1.25rem]">
          {apiError && <span className="text-error text-sm text-center block">{apiError}</span>}
        </div>

        {/* OAuth divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-outline-variant/30" />
          <span className="font-body text-xs text-on-surface-variant/40">o continuar con</span>
          <div className="flex-1 h-px bg-outline-variant/30" />
        </div>

        <OAuthButtons />

        <p className="text-center font-body text-sm text-on-surface-variant/60">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="text-primary font-semibold cursor-pointer hover:underline transition-colors"
          >
            Crear una
          </button>
        </p>
      </form>
    </main>
  )
}

import { useState, useRef } from 'react'
import { loginBeta, AuthServiceError } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { Z } from '@/shared/design/tokens'

interface AlreadyRegisteredNoticeProps {
  onBack: () => void
  onRegisterAnyway: () => void
  onSuccess: () => void
}

const PHONE_REGEX = /^[678]\d{7}$/


export default function AlreadyRegisteredNotice({ onBack, onRegisterAnyway, onSuccess }: AlreadyRegisteredNoticeProps) {
  const setUser = useAuthStore((s) => s.setUser)
  const [phone, setPhone] = useState('')
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const phoneRef = useRef<HTMLInputElement>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!PHONE_REGEX.test(phone)) {
      setError('Ingresa un número válido (8 dígitos, empieza con 6, 7 u 8)')
      return
    }
    setError(null)
    setSubmitting(true)

    try {
      const fullPhone = '+591' + phone
      const user = await loginBeta(fullPhone)
      setUser(user)
      onSuccess()
    } catch (err) {
      console.error('Login failed:', err)
      const code = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      const message = err instanceof Error ? err.message : 'Error desconocido'

      if (code === 'LOGIN_FAILED') {
        setError('Este número no está registrado en Ziteo. Crea una cuenta o verifica el número.')
      } else if (code === 'PROFILE_FETCH_FAILED' || code === 'ROLES_FETCH_FAILED') {
        setError('Tu cuenta existe pero tu perfil de beta está incompleto. Intenta registrarte de nuevo.')
      } else {
        setError(`Error al iniciar sesión: ${message}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = PHONE_REGEX.test(phone)

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: Z.bg }}>
      {/* Header */}
      <div style={{ padding: '58px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          style={{ width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke={Z.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: Z.textMuted, textTransform: 'uppercase' }}>
          Iniciar Sesión
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
            Bienvenido de vuelta
          </h2>
          <p style={{ fontFamily: Z.font, fontSize: 15, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
            Ingresa tu número de teléfono para recuperar tu cuenta e ingresar al instante.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="login-phone" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
              Número de teléfono
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${error ? Z.error : phoneFocused ? Z.orange : Z.border}`, borderRadius: Z.r.sm, background: Z.surface, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <span style={{ padding: '0 0 0 14px', fontFamily: Z.font, fontSize: 15, fontWeight: 600, color: Z.textSec, whiteSpace: 'nowrap' }}>+591</span>
              <input
                id="login-phone"
                data-testid="login-phone-input"
                ref={phoneRef}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))
                  setError(null)
                }}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                placeholder="7XX XXX XX"
                disabled={submitting}
                aria-label="Número de teléfono boliviano"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text, padding: '14px 14px 14px 8px', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            {error && <span data-testid="login-api-error" style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{error}</span>}
          </div>

          <button
            type="submit"
            data-testid="login-submit-btn"
            disabled={!isValid || submitting}
            style={{
              fontFamily: Z.font,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              padding: '15px 24px',
              borderRadius: Z.r.md,
              background: Z.orangeDark,
              color: '#FFFFFF',
              border: 'none',
              cursor: !isValid || submitting ? 'default' : 'pointer',
              width: '100%',
              opacity: !isValid || submitting ? 0.45 : 1,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {submitting ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10H12V2z" fill="currentColor" />
                </svg>
                Ingresando...
              </>
            ) : 'Ingresar'}
          </button>
        </form>

        <div style={{ padding: '14px 16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`, marginTop: 8 }}>
          <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text, marginBottom: 6 }}>
            ¿Eres nuevo en Ziteo?
          </div>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: 0, lineHeight: 1.6 }}>
            Si es tu primera vez aquí, crea una cuenta para poder acceder a la tienda de materiales, cotizar obras y registrarte.
          </p>
        </div>

        <button
          type="button"
          onClick={onRegisterAnyway}
          disabled={submitting}
          style={{ fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase', padding: '15px 24px', borderRadius: Z.r.md, background: 'transparent', color: Z.orange, border: `1.5px solid ${Z.orange}`, cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
        >
          Crear una cuenta nueva
        </button>
      </div>
    </div>
  )
}

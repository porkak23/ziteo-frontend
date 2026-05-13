import { useRef, useState } from 'react'
import { loginUser, AuthServiceError } from '../services/authService'
import { AUTH_ERRORS } from '../constants/authConstants'
import { useAuthStore } from '../store/authStore'
import { OAuthButtons } from './OAuthButtons'
import type { AuthUser } from '../types/authTypes'
import { Z } from '@/shared/design/tokens'

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

function ArrowLeftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke={Z.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function EyeIcon({ off, color }: { off?: boolean; color: string }) {
  if (off) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 003.3 3.1M6.7 6.7C4.3 8.3 3 12 3 12s4 7 9 7c1.8 0 3.4-.7 4.8-1.7" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M14 5.5C13.4 5.2 12.7 5 12 5c-5 0-9 7-9 7s1.3 3.7 3.7 5.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="12" rx="9" ry="6" stroke={color} strokeWidth="1.8" fill="none"/>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" fill="none"/>
    </svg>
  )
}

function FingerprintIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2a10 10 0 00-7.4 16.6M12 2a10 10 0 017.4 16.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M12 8a4 4 0 00-4 4c0 2.2.8 4.2 2 5.6M12 8a4 4 0 014 4c0 2.2-.8 4.2-2 5.6M12 11v4" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export default function LoginForm({ onSuccess, onNavigate }: LoginFormProps) {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [pinVisible, setPinVisible] = useState(false)
  const [biometrics, setBiometrics] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const pinRef = useRef<HTMLInputElement>(null)
  const setUser = useAuthStore((s) => s.setUser)

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!PHONE_REGEX.test(phone)) {
      errs.phone = 'Ingresa un número válido (+591)'
    }
    if (pin.length < 6) {
      errs.pin = 'El PIN debe tener 6 dígitos'
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
          onClick={() => onNavigate('welcome')}
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

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto"
        style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div>
          <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 28, color: Z.text, margin: 0 }}>
            Inicia Sesión
          </h2>
          <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
            Ingresa tus credenciales para continuar
          </p>
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
              transition: 'border-color 0.2s',
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
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text,
                padding: '14px 14px 14px 8px', width: '100%', boxSizing: 'border-box',
              }}
            />
          </div>
          {errors.phone && (
            <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{errors.phone}</span>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                PIN de seguridad
              </label>
              <button
                type="button"
                onClick={() => setPinVisible((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <EyeIcon off={pinVisible} color={Z.textMuted} />
              </button>
            </div>
            <div
              onClick={() => pinRef.current?.focus()}
              style={{ display: 'flex', gap: 10, justifyContent: 'center', cursor: 'text', position: 'relative' }}
            >
              <input
                ref={pinRef}
                type="tel"
                maxLength={PIN_DIGITS}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_DIGITS))}
                style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                autoComplete="off"
              />
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 46, height: 50, borderRadius: Z.r.sm,
                    border: `1.5px solid ${i === pin.length ? Z.orange : i < pin.length ? Z.orange : Z.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < pin.length ? Z.orangeLight : Z.surface,
                    transition: 'all 0.15s',
                  }}
                >
                  {i < pin.length && (
                    pinVisible
                      ? <span style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 700, color: Z.text }}>{pin[i]}</span>
                      : <div style={{ width: 12, height: 12, borderRadius: '50%', background: Z.orangeDark }} />
                  )}
                </div>
              ))}
            </div>
          </div>
          {errors.pin && (
            <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500, display: 'block', marginTop: 6 }}>{errors.pin}</span>
          )}
        </div>

        <label
          style={{
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.textSec,
          }}
        >
          <div
            onClick={(e) => { e.preventDefault(); setBiometrics((v) => !v) }}
            style={{
              width: 44, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer',
              background: biometrics ? Z.orange : Z.border, transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 22, height: 22, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
                transform: biometrics ? 'translateX(18px)' : 'translateX(0)',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FingerprintIcon color={Z.textSec} />
            Activar biometría
          </div>
        </label>

        {apiError && (
          <div aria-live="polite">
            <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error }}>{apiError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            fontFamily: Z.font, fontWeight: 700, fontSize: 14,
            letterSpacing: '0.3px', textTransform: 'uppercase',
            padding: '15px 24px', borderRadius: Z.r.md,
            background: Z.orangeDark, color: '#FFFFFF',
            border: 'none', cursor: loading ? 'default' : 'pointer', width: '100%',
            transition: 'all 0.15s ease', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Procesando...' : 'Ingresar'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: Z.border }} />
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textMuted, whiteSpace: 'nowrap' }}>
            o continúa con
          </span>
          <div style={{ flex: 1, height: 1, background: Z.border }} />
        </div>

        <OAuthButtons />

        <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: 16 }}>
          <span style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec }}>
            ¿No tienes cuenta?{' '}
            <span
              onClick={() => onNavigate('register')}
              style={{ color: Z.orange, fontWeight: 700, cursor: 'pointer' }}
            >
              Regístrate
            </span>
          </span>
        </div>
      </form>
    </div>
  )
}

import { useRef, useState } from 'react'
import { loginUser, AuthServiceError } from '../services/authService'
import { AUTH_ERRORS, PIN_LENGTH } from '../constants/authConstants'
import { useAuthStore } from '../store/authStore'
import { OAuthButtons } from './OAuthButtons'
import type { AuthUser } from '../types/authTypes'
import { Z } from '@/shared/design/tokens'

interface LoginFormProps {
  onSuccess: () => void
  onNavigate: (dest: string) => void
}

const PHONE_REGEX = /^[678]\d{7}$/

export default function LoginForm({ onSuccess, onNavigate }: LoginFormProps) {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [pinVisible, setPinVisible] = useState(false)
  const [biometrics, setBiometrics] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const pinRef = useRef<HTMLInputElement>(null)
  const setUser = useAuthStore((s) => s.setUser)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let valid = true
    if (!PHONE_REGEX.test(phone)) { setPhoneError('Ingresa un número válido (+591)'); valid = false } else setPhoneError(null)
    if (pin.length !== PIN_LENGTH) { setPinError(`El PIN debe tener exactamente ${PIN_LENGTH} dígitos`); valid = false } else setPinError(null)
    if (!valid) return

    setApiError(null)
    setLoading(true)
    try {
      const data = await loginUser({ phone: '+591' + phone, pin })
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
      setApiError(AUTH_ERRORS[code] ?? AUTH_ERRORS.UNKNOWN)
    } finally {
      setLoading(false)
    }
  }

  // PIN boxes — 8 boxes, sized to fit screen (375px - 48px padding = 327px)
  // 8 * 36px + 7 * 7px = 288 + 49 = 337px → adjust to 35px boxes + 6px gap = 280 + 42 = 322px ✓
  const BOX_W = 35
  const BOX_H = 46
  const BOX_GAP = 6

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: Z.bg }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '58px 16px 12px' }}>
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke={Z.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ width: 40 }} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto"
        style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        {/* Heading */}
        <div>
          <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 28, color: Z.text, margin: 0 }}>
            Inicia Sesión
          </h2>
          <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Phone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="login-phone" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
            Número de teléfono
          </label>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: `1.5px solid ${phoneError ? Z.error : phoneFocused ? Z.orange : Z.border}`,
            borderRadius: Z.r.sm, background: Z.surface, overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
            <span style={{ padding: '0 0 0 14px', fontFamily: Z.font, fontSize: 15, fontWeight: 600, color: Z.textSec, whiteSpace: 'nowrap' }}>
              +591
            </span>
            <input
              id="login-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              placeholder="7XX XXX XX"
              aria-label="Número de teléfono boliviano"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text,
                padding: '14px 14px 14px 8px', width: '100%', boxSizing: 'border-box',
              }}
            />
          </div>
          {phoneError && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{phoneError}</span>}
        </div>

        {/* PIN — 8 boxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
              PIN de seguridad (8 dígitos)
            </label>
            <button
              type="button"
              onClick={() => setPinVisible((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              {pinVisible
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 003.3 3.1M6.7 6.7C4.3 8.3 3 12 3 12s4 7 9 7c1.8 0 3.4-.7 4.8-1.7" stroke={Z.textMuted} strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M14 5.5C13.4 5.2 12.7 5 12 5c-5 0-9 7-9 7s1.3 3.7 3.7 5.3" stroke={Z.textMuted} strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="12" rx="9" ry="6" stroke={Z.textMuted} strokeWidth="1.8" fill="none"/><circle cx="12" cy="12" r="3" stroke={Z.textMuted} strokeWidth="1.8" fill="none"/></svg>
              }
            </button>
          </div>

          <div
            onClick={() => pinRef.current?.focus()}
            style={{ display: 'flex', gap: BOX_GAP, justifyContent: 'center', cursor: 'text', position: 'relative' }}
          >
            <input
              ref={pinRef}
              type="tel"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
              autoComplete="off"
            />
            {Array.from({ length: PIN_LENGTH }, (_, i) => (
              <div
                key={i}
                style={{
                  width: BOX_W, height: BOX_H, borderRadius: Z.r.sm,
                  border: `1.5px solid ${i === pin.length ? Z.orange : i < pin.length ? Z.orange : Z.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < pin.length ? Z.orangeLight : Z.surface,
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                {i < pin.length && (
                  pinVisible
                    ? <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 700, color: Z.text }}>{pin[i]}</span>
                    : <div style={{ width: 9, height: 9, borderRadius: '50%', background: Z.orangeDark }} />
                )}
              </div>
            ))}
          </div>
          {pinError && <span role="alert" style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500, marginTop: 2 }}>{pinError}</span>}

          <button
            type="button"
            onClick={() => onNavigate('forgot-pin')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 0', fontFamily: Z.font, fontSize: 13, color: Z.orange, fontWeight: 600, textAlign: 'left' }}
          >
            ¿Olvidaste tu PIN?
          </button>
        </div>

        {/* Biometrics */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.textSec }}>
          <div
            onClick={() => setBiometrics((v) => !v)}
            style={{ width: 44, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer', background: biometrics ? Z.orange : Z.border, transition: 'background 0.2s', display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'transform 0.2s', transform: biometrics ? 'translateX(18px)' : 'translateX(0)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a10 10 0 00-7.4 16.6M12 2a10 10 0 017.4 16.6" stroke={Z.textSec} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
              <path d="M12 8a4 4 0 00-4 4c0 2.2.8 4.2 2 5.6M12 8a4 4 0 014 4c0 2.2-.8 4.2-2 5.6M12 11v4" stroke={Z.textSec} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            </svg>
            Activar biometría
          </div>
        </label>

        {/* API error */}
        {apiError && (
          <div aria-live="polite" style={{ padding: '12px 16px', borderRadius: Z.r.md, background: Z.errorBg, border: `1px solid ${Z.error}` }}>
            <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error }}>{apiError}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase',
            padding: '15px 24px', borderRadius: Z.r.md, background: Z.orangeDark, color: '#FFFFFF',
            border: 'none', cursor: loading ? 'default' : 'pointer', width: '100%',
            transition: 'all 0.15s ease', opacity: loading ? 0.6 : 1, boxSizing: 'border-box', outline: 'none',
          }}
        >
          {loading ? 'Procesando...' : 'Ingresar'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: Z.border }} />
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textMuted, whiteSpace: 'nowrap' }}>o continúa con</span>
          <div style={{ flex: 1, height: 1, background: Z.border }} />
        </div>

        <OAuthButtons />

        <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: 16 }}>
          <span style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec }}>
            ¿No tienes cuenta?{' '}
            <span onClick={() => onNavigate('register')} style={{ color: Z.orange, fontWeight: 700, cursor: 'pointer' }}>
              Regístrate
            </span>
          </span>
        </div>
      </form>
    </div>
  )
}

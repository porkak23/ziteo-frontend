import { useState, useRef, useEffect } from 'react'
import { verifyOtp, loginUser, resendOtp, AuthServiceError } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { AUTH_ERRORS } from '../constants/authConstants'
import type { AuthUser } from '../types/authTypes'
import { Z } from '@/shared/design/tokens'

interface OtpVerificationProps {
  phone: string
  pin: string
  debugOtp?: string
  onSuccess: () => void
  onNavigate: (dest: string) => void
}

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

function ArrowLeftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke={Z.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function OtpVerification({ phone, pin, debugOtp, onSuccess, onNavigate }: OtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    if (digit && index === OTP_LENGTH - 1) {
      const completed = [...next]
      if (completed.every((d) => d !== '')) {
        verify(completed.join(''))
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]
    }
    setDigits(next)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
    if (pasted.length === OTP_LENGTH) {
      verify(pasted)
    }
  }

  const normalizedPhone = phone.startsWith('+') ? phone : `+591${phone}`

  async function verify(code: string) {
    if (loading) return
    setApiError(null)
    setLoading(true)
    try {
      const data = await verifyOtp({ phone: normalizedPhone, otp: code })
      if (data.phone_confirmed) {
        const loginData = await loginUser({ phone: normalizedPhone, pin })
        const authUser: AuthUser = {
          user_id: loginData.user_id,
          name: loginData.name,
          phone: loginData.phone,
          active_role: loginData.active_role,
          roles: loginData.roles,
          access_token: loginData.access_token,
          refresh_token: loginData.refresh_token,
          city: loginData.city ?? null,
          avatar_url: loginData.avatar_url ?? undefined,
        }
        setUser(authUser)
        onSuccess()
      }
    } catch (err) {
      const errorCode = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      setApiError(AUTH_ERRORS[errorCode] ?? 'Ocurrió un error, intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!canResend || resendLoading) return
    setResendLoading(true)
    setApiError(null)
    try {
      await resendOtp(phone)
      setCountdown(RESEND_COOLDOWN)
      setCanResend(false)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch {
      setApiError('No pudimos reenviar el código. Solicita un nuevo código desde el inicio.')
    } finally {
      setResendLoading(false)
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
          onClick={() => onNavigate('register')}
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

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div>
          <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
            Verifica tu número
          </h2>
          <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
            Te enviamos un código de {OTP_LENGTH} dígitos a{' '}
            <strong style={{ color: Z.text }}>
              {phone.startsWith('+591') ? phone : '+591 ' + phone}
            </strong>
          </p>
        </div>

        {debugOtp && (
          <button
            type="button"
            onClick={() => {
              const next = debugOtp.split('')
              setDigits(next)
              verify(debugOtp)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: Z.r.md,
              background: Z.orangeLight, border: `1px solid ${Z.orange}`,
              fontFamily: Z.font, fontSize: 13, color: Z.orangeDark,
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <span style={{ opacity: 0.7 }}>🐛</span>
            Código de prueba: <strong style={{ letterSpacing: 4 }}>{debugOtp}</strong> — toca para ingresar
          </button>
        )}

        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 10 }}>
            Código de verificación
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                autoFocus={i === 0}
                disabled={loading}
                aria-label={`Dígito ${i + 1} de ${OTP_LENGTH}`}
                style={{
                  width: 46, height: 54, borderRadius: Z.r.sm, textAlign: 'center',
                  border: `1.5px solid ${digit ? Z.orange : Z.border}`,
                  fontFamily: Z.font, fontSize: 22, fontWeight: 700, color: Z.text,
                  outline: 'none',
                  background: digit ? Z.orangeLight : Z.surface,
                  transition: 'all 0.15s', boxSizing: 'border-box',
                  opacity: loading ? 0.6 : 1,
                }}
              />
            ))}
          </div>
        </div>

        {apiError && (
          <div
            aria-live="polite"
            style={{
              padding: '12px 16px', borderRadius: Z.r.md,
              background: Z.errorBg, border: `1px solid ${Z.error}`,
            }}
          >
            <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error }}>{apiError}</span>
          </div>
        )}

        {loading && (
          <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, textAlign: 'center' }}>
            Verificando...
          </p>
        )}

        <div style={{ textAlign: 'center' }}>
          {canResend ? (
            <span
              onClick={handleResend}
              style={{
                fontFamily: Z.font, fontSize: 13, color: resendLoading ? Z.textMuted : Z.orange,
                fontWeight: 700, cursor: resendLoading ? 'default' : 'pointer',
              }}
            >
              {resendLoading ? 'Enviando...' : 'Reenviar código'}
            </span>
          ) : (
            <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted }}>
              Reenviar código en{' '}
              <span style={{ color: Z.orange, fontWeight: 700 }}>{countdown}s</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

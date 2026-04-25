import { useState, useRef, useEffect } from 'react'
import { verifyOtp, loginUser, resendOtp, AuthServiceError } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { AUTH_ERRORS } from '../constants/authConstants'
import type { AuthUser } from '../types/authTypes'

interface OtpVerificationProps {
  phone: string
  pin: string
  debugOtp?: string
  onSuccess: () => void
  onNavigate: (dest: string) => void
}

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

export default function OtpVerification({ phone, pin, debugOtp, onSuccess, onNavigate }: OtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const setUser = useAuthStore((s) => s.setUser)

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  function handleChange(index: number, value: string) {
    // Accept only a single digit
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)

    // Auto-advance focus
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are filled
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
    // Focus the next empty slot or last slot
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
    if (pasted.length === OTP_LENGTH) {
      verify(pasted)
    }
  }

  // Normalize phone to E.164 format for edge function calls
  const normalizedPhone = phone.startsWith('+') ? phone : `+591${phone}`

  async function verify(code: string) {
    if (loading) return
    setApiError(null)
    setLoading(true)
    try {
      const data = await verifyOtp({ phone: normalizedPhone, otp: code })
      if (data.phone_confirmed) {
        // Auto-login after OTP verification to get a real session
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
      // Reset UI on success
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
    <main className="min-h-dvh w-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          onClick={() => onNavigate('register')}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container text-on-surface cursor-pointer"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline font-extrabold text-xl text-on-surface">Verifica tu número</h1>
      </div>

      <div className="flex flex-col gap-8 px-6 max-w-sm mx-auto w-full mt-6">
        {/* Subtitle */}
        <div>
          <p className="font-body text-sm text-on-surface-variant">
            Enviamos un código de 6 dígitos a
          </p>
          {phone && (
            <p className="font-semibold text-on-surface text-sm mt-0.5">{phone.startsWith('+591') ? phone : '+591 ' + phone}</p>
          )}
        </div>

        {/* Dev helper: show OTP inline */}
        {debugOtp && (
          <button
            type="button"
            onClick={() => {
              const next = debugOtp.split('')
              setDigits(next)
              verify(debugOtp)
            }}
            className="flex items-center gap-2 bg-primary-container text-on-primary-container rounded-xl px-4 py-3 font-body text-sm text-left w-full"
          >
            <span className="material-symbols-outlined text-base">bug_report</span>
            <span>Código de prueba: <strong className="font-label tracking-widest">{debugOtp}</strong> — toca para ingresar</span>
          </button>
        )}

        {/* OTP inputs */}
        <div className="flex gap-2 justify-center">
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
              aria-label={`Dígito ${i + 1} de ${digits.length}`}
              className={`w-12 h-14 text-center border-2 rounded-xl font-label text-xl font-semibold bg-surface-container-low text-on-surface focus:outline-none transition-colors ${
                digit ? 'border-primary' : 'border-outline-variant'
              } focus:border-primary disabled:opacity-60`}
            />
          ))}
        </div>

        {/* Error */}
        {apiError && (
          <div className="flex items-center gap-2 bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm">
            <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
            <span>{apiError}</span>
          </div>
        )}

        {loading && (
          <p className="font-body text-sm text-on-surface-variant text-center">Verificando...</p>
        )}

        {/* Resend */}
        <div className="text-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-primary font-semibold text-sm disabled:opacity-60"
            >
              {resendLoading ? 'Enviando...' : 'Reenviar código'}
            </button>
          ) : (
            <p className="text-on-surface-variant text-sm">
              Reenviar código en {countdown}s
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

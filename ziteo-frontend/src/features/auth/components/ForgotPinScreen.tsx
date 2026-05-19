import { useState, useRef, useEffect } from 'react'
import type { ConfirmationResult } from 'firebase/auth'
import { sendPhoneOtp, confirmPhoneOtp, clearRecaptcha, resetPin, AuthServiceError } from '../services/authService'
import { AUTH_ERRORS, FIREBASE_ERRORS } from '../constants/authConstants'

interface ForgotPinScreenProps {
  onNavigate: (dest: string) => void
}

type Step = 'phone' | 'otp' | 'new-pin' | 'success'

const PHONE_REGEX = /^[678]\d{7}$/
const OTP_LENGTH = 6
const PIN_DIGITS = 8
const RESEND_COOLDOWN = 60

export default function ForgotPinScreen({ onNavigate }: ForgotPinScreenProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneLoading, setPhoneLoading] = useState(false)

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpError, setOtpError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [verifiedOtp, setVerifiedOtp] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function getFirebaseErrMsg(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = (err as { code: string }).code
      return FIREBASE_ERRORS[code] ?? AUTH_ERRORS.UNKNOWN
    }
    return AUTH_ERRORS.UNKNOWN
  }

  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinLoading, setPinLoading] = useState(false)

  const fullPhone = '+591' + phone

  // Countdown for OTP resend
  useEffect(() => {
    if (step !== 'otp') return
    if (countdown <= 0) { setCanResend(true); return }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, step])

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!PHONE_REGEX.test(phone)) {
      setPhoneError('Ingresa un número válido (8 dígitos, ej. 76543210)')
      return
    }
    setPhoneError(null)
    setPhoneLoading(true)
    try {
      const result = await sendPhoneOtp(fullPhone)
      setConfirmationResult(result)
      setStep('otp')
      setCountdown(RESEND_COOLDOWN)
      setCanResend(false)
    } catch (err) {
      setPhoneError(getFirebaseErrMsg(err))
    } finally {
      setPhoneLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
    if (digit && index === OTP_LENGTH - 1 && next.every((d) => d !== '')) {
      confirmOtp(next.join(''))
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
    if (pasted.length === OTP_LENGTH) confirmOtp(pasted)
  }

  async function confirmOtp(code: string) {
    if (!confirmationResult) return
    setOtpError(null)
    try {
      await confirmPhoneOtp(confirmationResult, code)
      setVerifiedOtp(code)
      clearRecaptcha()
      setStep('new-pin')
    } catch (err) {
      setOtpError(getFirebaseErrMsg(err))
      setDigits(Array(OTP_LENGTH).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    }
  }

  async function handleResend() {
    if (!canResend || resendLoading) return
    setResendLoading(true)
    setOtpError(null)
    try {
      const result = await sendPhoneOtp(fullPhone)
      setConfirmationResult(result)
      setCountdown(RESEND_COOLDOWN)
      setCanResend(false)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err) {
      setOtpError(getFirebaseErrMsg(err))
    } finally {
      setResendLoading(false)
    }
  }

  async function handleResetPin(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{8}$/.test(newPin)) {
      setPinError('La contraseña debe tener exactamente 8 dígitos')
      return
    }
    if (newPin !== confirmPin) {
      setPinError('Las contraseñas no coinciden')
      return
    }
    setPinError(null)
    setPinLoading(true)
    try {
      await resetPin({ phone: fullPhone, otp: verifiedOtp, new_pin: newPin })
      setStep('success')
    } catch (err) {
      const code = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      if (code === 'INVALID_OTP' || code === 'OTP_EXPIRED') {
        setPinError(AUTH_ERRORS[code])
        setStep('otp')
        setDigits(Array(OTP_LENGTH).fill(''))
        setVerifiedOtp('')
      } else {
        setPinError(AUTH_ERRORS[code] ?? AUTH_ERRORS.UNKNOWN)
      }
    } finally {
      setPinLoading(false)
    }
  }

  // ── Step: phone ──────────────────────────────────────────────────────────
  if (step === 'phone') {
    return (
      <main className="min-h-dvh w-full flex flex-col bg-background">
        {/* Firebase invisible reCAPTCHA — must always be in DOM */}
        <div id="recaptcha-container" style={{ position: 'fixed', bottom: 0, left: 0 }} />
        <div className="flex items-center justify-between px-5 pt-12 pb-2">
          <button
            onClick={() => onNavigate('login')}
            className="w-11 h-11 flex items-center justify-center text-on-surface-variant cursor-pointer -ml-1"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="font-headline font-black text-sm text-on-surface/20 tracking-[-0.02em]">ZITEO</span>
        </div>

        <div className="px-6 mt-14 mb-12">
          <p className="font-body text-[11px] text-on-surface-variant/45 font-medium tracking-[0.18em] uppercase mb-5">
            Recuperar acceso
          </p>
          <h1 className="font-headline font-black text-[48px] text-on-surface leading-[0.93] tracking-[-0.03em]">
            ¿Olvidaste tu<br />contraseña?
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-4">
            Ingresa tu número y te enviamos un código SMS para verificar tu identidad.
          </p>
        </div>

        <form onSubmit={handleSendCode} className="flex flex-col gap-6 px-6 pb-10 max-w-sm mx-auto w-full">
          <div className="flex flex-col gap-2">
            <label htmlFor="forgot-phone" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
              Teléfono
            </label>
            <div className="flex items-center gap-0 rounded-xl border border-outline-variant/60 bg-surface-container-low overflow-hidden focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20">
              <span className="px-3 font-body text-sm text-on-surface-variant/60 border-r border-outline-variant/40 py-4 select-none">+591</span>
              <input
                id="forgot-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="70000000"
                required
                className="flex-1 px-3 py-4 bg-transparent text-on-surface font-body text-sm focus:outline-none"
              />
            </div>
            <div aria-live="polite" className="min-h-[1rem]">
              {phoneError && <span className="text-error text-xs">{phoneError}</span>}
            </div>
          </div>

          <button
            type="submit"
            disabled={phoneLoading}
            className="w-full px-4 py-[18px] bg-primary text-on-primary font-label font-bold rounded-xl text-[15px] tracking-[-0.01em] transition-[transform,opacity] active:scale-[0.98] active:opacity-80 disabled:opacity-60 cursor-pointer"
          >
            {phoneLoading ? 'Enviando...' : 'Enviar código →'}
          </button>
        </form>
      </main>
    )
  }

  // ── Step: otp ────────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <main className="min-h-dvh w-full flex flex-col bg-background">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => { setStep('phone'); setDigits(Array(OTP_LENGTH).fill('')); setOtpError(null) }}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container text-on-surface cursor-pointer"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline font-extrabold text-xl text-on-surface">Ingresa el código</h1>
        </div>

        <div className="flex flex-col gap-8 px-6 max-w-sm mx-auto w-full mt-6">
          <div>
            <p className="font-body text-sm text-on-surface-variant">
              Enviamos un código SMS de 6 dígitos a
            </p>
            <p className="font-semibold text-on-surface text-sm mt-0.5">+591 {phone}</p>
          </div>

          <div className="flex gap-2 justify-center">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                autoFocus={i === 0}
                className={`w-12 h-14 text-center border-2 rounded-xl font-label text-xl font-semibold bg-surface-container-low text-on-surface focus:outline-none transition-colors ${
                  digit ? 'border-primary' : 'border-outline-variant'
                } focus:border-primary`}
              />
            ))}
          </div>

          {otpError && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm">
              <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
              <span>{otpError}</span>
            </div>
          )}

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
              <p className="text-on-surface-variant text-sm">Reenviar código en {countdown}s</p>
            )}
          </div>
        </div>
      </main>
    )
  }

  // ── Step: new-pin ────────────────────────────────────────────────────────
  if (step === 'new-pin') {
    return (
      <main className="min-h-dvh w-full flex flex-col bg-background">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => { setStep('otp'); setDigits(Array(OTP_LENGTH).fill('')); setPinError(null) }}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container text-on-surface cursor-pointer"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline font-extrabold text-xl text-on-surface">Nueva contraseña</h1>
        </div>

        <form onSubmit={handleResetPin} className="flex flex-col gap-6 px-6 max-w-sm mx-auto w-full mt-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="new-pin" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
              Nueva contraseña (8 dígitos)
            </label>
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, PIN_DIGITS))}
              placeholder="········"
              maxLength={PIN_DIGITS}
              className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <div className="flex gap-2 mt-1">
              {Array.from({ length: PIN_DIGITS }, (_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 border-primary transition-colors duration-150 ${
                    i < newPin.length ? 'bg-primary' : 'bg-transparent opacity-35'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-pin" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
              Confirmar contraseña
            </label>
            <input
              id="confirm-pin"
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, PIN_DIGITS))}
              placeholder="········"
              maxLength={PIN_DIGITS}
              className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <div className="flex gap-2 mt-1">
              {Array.from({ length: PIN_DIGITS }, (_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 transition-colors duration-150 ${
                    i < confirmPin.length
                      ? confirmPin[i] === newPin[i] ? 'bg-primary border-primary' : 'bg-error border-error'
                      : 'border-primary opacity-35'
                  }`}
                />
              ))}
            </div>
          </div>

          <div aria-live="polite" className="min-h-[1rem]">
            {pinError && <span className="text-error text-xs">{pinError}</span>}
          </div>

          <button
            type="submit"
            disabled={pinLoading}
            className="w-full px-4 py-[18px] bg-primary text-on-primary font-label font-bold rounded-xl text-[15px] tracking-[-0.01em] transition-[transform,opacity] active:scale-[0.98] active:opacity-80 disabled:opacity-60 cursor-pointer"
          >
            {pinLoading ? 'Guardando...' : 'Guardar contraseña →'}
          </button>
        </form>
      </main>
    )
  }

  // ── Step: success ────────────────────────────────────────────────────────
  return (
    <main className="min-h-dvh w-full flex flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-6 max-w-xs text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-primary">check_circle</span>
        </div>
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface mb-2">¡Contraseña actualizada!</h1>
          <p className="font-body text-sm text-on-surface-variant">
            Tu contraseña fue cambiada exitosamente. Inicia sesión con tu nueva contraseña.
          </p>
        </div>
        <button
          onClick={() => onNavigate('login')}
          className="w-full px-4 py-[18px] bg-primary text-on-primary font-label font-bold rounded-xl text-[15px] tracking-[-0.01em] transition-[transform,opacity] active:scale-[0.98] cursor-pointer"
        >
          Ir a iniciar sesión →
        </button>
      </div>
    </main>
  )
}

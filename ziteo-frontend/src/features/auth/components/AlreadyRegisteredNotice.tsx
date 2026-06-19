import { useEffect, useState } from 'react'
import {
  loginWithPinOrLegacy,
  startWhatsappVerification,
  resetPin,
  AuthServiceError,
} from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { Z } from '@/shared/design/tokens'
import { PinPad } from './PinPad'
import { OtpVerificationSheet } from './OtpVerificationSheet'
import { useBiometricAuth } from '../../../shared/hooks/useBiometricAuth'

interface AlreadyRegisteredNoticeProps {
  onBack: () => void
  onRegisterAnyway: () => void
  onSuccess: () => void
}

const PHONE_REGEX = /^[678]\d{7}$/

type Phase = 'phone' | 'pin' | 'forgot'

function formatPhoneDisplay(raw: string): string {
  // raw is 8 digits like '76XXXXXX'
  if (raw.length === 8) {
    return `+591 ${raw[0]} ${raw.slice(1, 4)} ${raw.slice(4)}`
  }
  return `+591 ${raw}`
}

export default function AlreadyRegisteredNotice({ onBack, onRegisterAnyway, onSuccess }: AlreadyRegisteredNoticeProps) {
  const setUser = useAuthStore((s) => s.setUser)
  const { isAvailable: biometricAvailable, biometricType, loginWithBiometric } = useBiometricAuth()

  const [phase, setPhase] = useState<Phase>('phone')
  const [phone, setPhone] = useState('')
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // PIN phase
  const [pinValue, setPinValue] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Forgot PIN sheet
  const [forgotStep, setForgotStep] = useState<'sending' | 'code' | 'pin-create' | 'pin-confirm'>('sending')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotCode, setForgotCode] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Cooldown countdown
  const handlePinSubmit = async (pin: string) => {
    setSubmitting(true)
    setPinError(null)
    try {
      const fullPhone = '+591' + phone
      const user = await loginWithPinOrLegacy(fullPhone, pin)
      setUser(user)
      onSuccess()
    } catch (err) {
      console.error('Login failed:', err)
      const code = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      const message = err instanceof Error ? err.message : 'Error desconocido'
      if (code === 'USER_NOT_FOUND' || code.includes('404') || code === 'LOGIN_FAILED') {
        setPinError('Este número no está registrado en Ziteo. Crea una cuenta.')
      } else if (code === 'INVALID_PIN' || code.includes('401')) {
        setPinError('PIN incorrecto. Intenta de nuevo.')
      } else {
        setPinError(`Error al ingresar: ${message}`)
      }
      setPinValue('')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Auto-submit when PIN is complete (6 digits)
  useEffect(() => {
    if (phase === 'pin' && pinValue.length === 6 && !submitting) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void handlePinSubmit(pinValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinValue, phase])

  // ---------------------------------------------------------------------------
  // Phase: phone
  // ---------------------------------------------------------------------------

  function handlePhoneContinue(e?: React.FormEvent) {
    e?.preventDefault()
    if (!PHONE_REGEX.test(phone)) {
      setPhoneError('Ingresa un número válido (8 dígitos, empieza con 6, 7 u 8)')
      return
    }
    setPhoneError(null)
    setPinValue('')
    setPinError(null)
    setPhase('pin')
  }

  // ---------------------------------------------------------------------------
  // Phase: pin
  // ---------------------------------------------------------------------------



  // ---------------------------------------------------------------------------
  // Phase: forgot PIN
  // ---------------------------------------------------------------------------

  async function handleForgotStart() {
    setForgotError(null)
    setForgotCode(null)
    setForgotStep('sending')
    setPhase('forgot')
    try {
      await startWhatsappVerification('+591' + phone)
      setForgotStep('code')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar el código'
      setForgotError(msg)
      setForgotStep('code')
    }
  }

  function handleForgotVerified(code: string) {
    setForgotCode(code)
    setForgotStep('pin-create')
  }

  // OtpVerificationSheet calls onPinCreated for both pin-create and pin-confirm
  function handleForgotPinCreated(pin: string) {
    if (forgotStep === 'pin-create') {
      setForgotStep('pin-confirm')
      return
    }
    // pin-confirm — reset the PIN
    void handleResetPin(pin)
  }

  async function handleResetPin(newPin: string) {
    if (!forgotCode) return
    setForgotLoading(true)
    setForgotError(null)
    try {
      await resetPin('+591' + phone, forgotCode, newPin)
      // Return to PIN phase so user can login with new PIN
      setPinValue('')
      setPinError(null)
      setPhase('pin')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al resetear el PIN'
      setForgotError(msg)
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleForgotResend() {
    setForgotError(null)
    try {
      await startWhatsappVerification('+591' + phone)
      setResendCooldown(60)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al reenviar el código'
      setForgotError(msg)
    }
  }

  // biometric callback from OtpVerificationSheet is not shown for forgot-PIN flow
  // but the sheet requires the prop — we just go back to PIN phase
  function handleForgotBiometricChoice() {
    setPhase('pin')
  }

  const isValidPhone = PHONE_REGEX.test(phone)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: Z.bg }}>
      {/* Header */}
      <div style={{ padding: '58px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={phase === 'pin' ? () => setPhase('phone') : onBack}
          aria-label="Volver"
          style={{ width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke={Z.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: Z.textMuted, textTransform: 'uppercase' }}>
          {phase === 'pin' ? 'Ingresa tu PIN' : 'Iniciar Sesión'}
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ------------------------------------------------------------------ */}
        {/* Phase: phone */}
        {/* ------------------------------------------------------------------ */}
        {phase === 'phone' && (
          <>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
                Bienvenido de vuelta
              </h2>
              <p style={{ fontFamily: Z.font, fontSize: 15, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Ingresa tu número de teléfono para continuar.
              </p>
            </div>

            <form onSubmit={handlePhoneContinue} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="login-phone" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                  Número de teléfono
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1.5px solid ${phoneError ? Z.error : phoneFocused ? Z.orange : Z.border}`,
                    borderRadius: Z.r.sm,
                    background: Z.surface,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <span style={{ padding: '0 0 0 14px', fontFamily: Z.font, fontSize: 15, fontWeight: 600, color: Z.textSec, whiteSpace: 'nowrap' }}>+591</span>
                  <input
                    id="login-phone"
                    data-testid="login-phone-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))
                      setPhoneError(null)
                    }}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    placeholder="7XX XXX XX"
                    aria-label="Número de teléfono boliviano"
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontFamily: Z.font,
                      fontSize: 15,
                      fontWeight: 500,
                      color: Z.text,
                      padding: '14px 14px 14px 8px',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {phoneError && (
                  <span data-testid="login-api-error" style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>
                    {phoneError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                data-testid="login-submit-btn"
                disabled={!isValidPhone}
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
                  cursor: !isValidPhone ? 'default' : 'pointer',
                  width: '100%',
                  opacity: !isValidPhone ? 0.45 : 1,
                  boxSizing: 'border-box',
                }}
              >
                Continuar
              </button>
            </form>

            <div style={{ padding: '14px 16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`, marginTop: 8 }}>
              <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text, marginBottom: 6 }}>
                ¿Eres nuevo en Ziteo?
              </div>
              <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: 0, lineHeight: 1.6 }}>
                Si es tu primera vez aquí, crea una cuenta para acceder a la tienda de materiales, cotizar obras y más.
              </p>
            </div>

            <button
              type="button"
              onClick={onRegisterAnyway}
              style={{
                fontFamily: Z.font,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                padding: '15px 24px',
                borderRadius: Z.r.md,
                background: 'transparent',
                color: Z.orange,
                border: `1.5px solid ${Z.orange}`,
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              Crear una cuenta nueva
            </button>
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Phase: pin */}
        {/* ------------------------------------------------------------------ */}
        {phase === 'pin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
            {/* Account indicator */}
            <div style={{ width: '100%', padding: '12px 16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`, textAlign: 'center' }}>
              <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 600, color: Z.text }}>
                {formatPhoneDisplay(phone)}
              </span>
            </div>

            {/* Biometric shortcut */}
            {biometricAvailable && (
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: Z.r.md,
                  border: `1.5px solid ${Z.border}`,
                  background: Z.surface,
                  fontFamily: Z.font,
                  fontSize: 14,
                  fontWeight: 700,
                  color: Z.text,
                  cursor: 'pointer',
                }}
                onClick={async () => {
                  try {
                    await loginWithBiometric()
                    onSuccess()
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Error al autenticar con biometría'
                    setPinError(message)
                  }
                }}
              >
                {biometricType === 'face' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={Z.orangeDark} strokeWidth="1.8" fill="none" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={Z.orangeDark} strokeWidth="1.8" fill="none" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={Z.orangeDark} strokeWidth="1.8" fill="none" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={Z.orangeDark} strokeWidth="1.8" fill="none" />
                    <circle cx="9" cy="10" r="1.2" fill={Z.orangeDark} />
                    <circle cx="15" cy="10" r="1.2" fill={Z.orangeDark} />
                    <path d="M9 15c0 1.66 1.34 3 3 3s3-1.34 3-3" stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 1C8.5 1 6 3.5 6 7c0 4 2 6.5 3.5 8.5" stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <path d="M9 6.5C9 4.5 10.3 3 12 3s3 1.5 3 3.5c0 3-1.5 5-3 6.5" stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <path d="M18 7c0-3.3-2.7-6-6-6" stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <circle cx="12" cy="12" r="1.2" fill={Z.orangeDark} />
                    <path d="M15 9.5c.7 1 1 2.2 1 3.5 0 2.5-1 4.5-2 6" stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  </svg>
                )}
                {biometricType === 'face' ? 'Entrar con reconocimiento facial' : 'Entrar con biometría'}
              </button>
            )}

            <PinPad
              value={pinValue}
              onChange={setPinValue}
              disabled={submitting}
              label="Ingresa tu PIN"
              sublabel="6 dígitos"
              error={pinError}
            />

            {/* Forgot PIN link */}
            <button
              type="button"
              onClick={handleForgotStart}
              style={{
                fontFamily: Z.font,
                fontSize: 13,
                color: Z.textSec,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              ¿Olvidaste tu PIN?
            </button>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Phase: forgot — OtpVerificationSheet overlay */}
      {/* ------------------------------------------------------------------ */}
      {phase === 'forgot' && (
        <OtpVerificationSheet
          phone={'+591' + phone}
          step={forgotStep}
          onVerified={handleForgotVerified}
          onPinCreated={handleForgotPinCreated}
          onBiometricChoice={handleForgotBiometricChoice}
          onChangePhone={() => {
            setPhase('phone')
          }}
          loading={forgotLoading}
          error={forgotError}
          onResend={handleForgotResend}
          resendCooldown={resendCooldown}
        />
      )}
    </div>
  )
}

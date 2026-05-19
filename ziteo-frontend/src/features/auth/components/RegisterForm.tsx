import { useRef, useState, useEffect } from 'react'
import type { ConfirmationResult } from 'firebase/auth'
import {
  registerUser, loginUser,
  sendPhoneOtp, confirmPhoneOtp, clearRecaptcha,
  AuthServiceError,
} from '../services/authService'
import { AUTH_ERRORS, FIREBASE_ERRORS, PIN_LENGTH, BOLIVIAN_CITIES } from '../constants/authConstants'
import { useAuthStore } from '../store/authStore'
import type { AuthUser, UserRole } from '../types/authTypes'
import { Z } from '@/shared/design/tokens'
import LegalModal, { type LegalDocType } from '@/shared/components/LegalModal'
import { isCiudadWaitlist, isFullLaunch } from '@/shared/utils/launchConfig'
import { track } from '../../../lib/analytics'

interface RegisterFormProps {
  onSuccess: () => void
  onNavigate: (dest: string) => void
}

const PHONE_REGEX = /^[678]\d{7}$/
const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

type Step = 'phone' | 'otp' | 'datos' | 'rol'
const MAIN_STEPS: Step[] = ['phone', 'otp', 'datos', 'rol']

const ROLES: { role: UserRole; title: string; description: string }[] = [
  { role: 'constructor', title: 'Constructor', description: 'Busca materiales, herramientas y contrata profesionales para tus obras.' },
  { role: 'proveedor', title: 'Vendedor / Proveedor', description: 'Gestiona tu inventario, ventas y pedidos de materiales de construcción.' },
  { role: 'maestro', title: 'Maestro de Obra', description: 'Recibe solicitudes de trabajo y muestra tu experiencia profesional.' },
  { role: 'chofer', title: 'Chofer / Repartidor', description: 'Realiza entregas de materiales con tu vehículo.' },
]

// ── Role icons ───────────────────────────────────────────────────────────────
function RoleIcon({ role, size = 40 }: { role: UserRole; size?: number }) {
  if (role === 'constructor') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="8" y="28" width="32" height="14" rx="2" fill={Z.orangeDark} opacity="0.15"/>
      <rect x="12" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
      <rect x="21" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
      <rect x="30" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
      <path d="M6 28h36" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 28V18l10-8 10 8v10" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      <rect x="20" y="20" width="8" height="8" rx="1.5" stroke={Z.orange} strokeWidth="2" fill="none"/>
    </svg>
  )
  if (role === 'proveedor') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="8" y="20" width="32" height="22" rx="3" fill={Z.blue} opacity="0.12"/>
      <path d="M8 20h32" stroke={Z.blueDark} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M6 20c0 0 4-10 18-10s18 10 18 10" stroke={Z.blue} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <rect x="18" y="28" width="12" height="14" rx="2" stroke={Z.blueDark} strokeWidth="2" fill={Z.blue} opacity="0.2"/>
      <circle cx="24" cy="34" r="1.5" fill={Z.blueDark}/>
    </svg>
  )
  if (role === 'maestro') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M18 10l-8 8 3 3 8-8M30 38l8-8-3-3-8 8" stroke={Z.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 34l20-20" stroke={Z.orangeDark} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="14" cy="34" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
      <circle cx="34" cy="14" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="4" y="16" width="24" height="18" rx="3" stroke={Z.blueDark} strokeWidth="2.5" fill={Z.blue} opacity="0.1"/>
      <path d="M28 22h10l6 8v4h-16v-12z" stroke={Z.blueDark} strokeWidth="2.5" strokeLinejoin="round" fill={Z.blue} opacity="0.1"/>
      <circle cx="14" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white"/>
      <circle cx="38" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white"/>
      <circle cx="14" cy="36" r="1.5" fill={Z.blueDark}/>
      <circle cx="38" cy="36" r="1.5" fill={Z.blueDark}/>
    </svg>
  )
}

function StepBar({ step }: { step: Step }) {
  const idx = MAIN_STEPS.indexOf(step)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {MAIN_STEPS.map((_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', position: 'relative', background: i < idx ? Z.orange : Z.divider }}>
          {i === idx && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: Z.orange, borderRadius: 2 }} />}
        </div>
      ))}
    </div>
  )
}

function getFirebaseErrMsg(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code
    return FIREBASE_ERRORS[code] ?? AUTH_ERRORS.UNKNOWN
  }
  return AUTH_ERRORS.UNKNOWN
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function RegisterForm({ onSuccess, onNavigate }: RegisterFormProps) {
  const setUser = useAuthStore((s) => s.setUser)
  const [step, setStep] = useState<Step>('phone')

  // Track registration funnel start
  useEffect(() => {
    track.registrationStarted()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // — phone step —
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [pinVisible, setPinVisible] = useState(false)
  const [phoneErr, setPhoneErr] = useState<string | null>(null)
  const [pinErr, setPinErr] = useState<string | null>(null)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const pinRef = useRef<HTMLInputElement>(null)

  // — otp step —
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpErr, setOtpErr] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // — datos step —
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [city, setCity] = useState('')
  const [datosErr, setDatosErr] = useState<{ name?: string; city?: string }>({})

  // — rol step —
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([])
  const [registerErr, setRegisterErr] = useState<string | null>(null)
  const [registerLoading, setRegisterLoading] = useState(false)

  // — terms acceptance —
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [legalModal, setLegalModal] = useState<LegalDocType | null>(null)

  // — waitlist banner (datos step) —
  const [showWaitlistBanner, setShowWaitlistBanner] = useState(false)

  useEffect(() => {
    if (step !== 'otp') return
    if (countdown <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, step])

  // ── Navigation ──
  function goBack() {
    if (step === 'phone') onNavigate('welcome')
    else if (step === 'otp') { clearRecaptcha(); setStep('phone') }
    else if (step === 'datos') setStep('otp')
    else if (step === 'rol') setStep('datos')
  }

  // ── Step: phone → send Firebase SMS OTP ──
  async function handlePhoneNext() {
    let ok = true
    if (!PHONE_REGEX.test(phone)) { setPhoneErr('Ingresa un número válido (+591)'); ok = false } else setPhoneErr(null)
    if (!/^\d{8}$/.test(pin)) { setPinErr(`El PIN debe tener exactamente ${PIN_LENGTH} dígitos`); ok = false } else setPinErr(null)
    if (!ok) return

    setPhoneLoading(true)
    try {
      const result = await sendPhoneOtp('+591' + phone)
      setConfirmationResult(result)
      setCountdown(RESEND_COOLDOWN)
      setCanResend(false)
      setOtpDigits(Array(OTP_LENGTH).fill(''))
      setOtpErr(null)
      setStep('otp')
    } catch (err) {
      setPhoneErr(getFirebaseErrMsg(err))
    } finally {
      setPhoneLoading(false)
    }
  }

  // ── Step: otp ──
  function handleOtpChange(i: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]
    next[i] = digit
    setOtpDigits(next)
    if (digit && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus()
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setOtpDigits(next)
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    if (pasted.length === OTP_LENGTH) handleOtpVerify(next)
  }

  async function handleOtpVerify(digits: string[]) {
    const code = digits.join('')
    if (code.length !== OTP_LENGTH || !confirmationResult) return
    setOtpLoading(true)
    setOtpErr(null)
    try {
      await confirmPhoneOtp(confirmationResult, code)
      track.otpVerified()
      setStep('datos')
    } catch (err) {
      setOtpErr(getFirebaseErrMsg(err))
      setOtpDigits(Array(OTP_LENGTH).fill(''))
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleResend() {
    if (!canResend || resendLoading) return
    setResendLoading(true)
    try {
      const result = await sendPhoneOtp('+591' + phone)
      setConfirmationResult(result)
      setCountdown(RESEND_COOLDOWN)
      setCanResend(false)
      setOtpDigits(Array(OTP_LENGTH).fill(''))
    } catch { /* ignore */ }
    finally { setResendLoading(false) }
  }

  // ── Step: datos ──
  function handleDatosNext() {
    const errs: typeof datosErr = {}
    if (name.trim().length < 2) errs.name = 'Ingresa tu nombre completo'
    if (!city) errs.city = 'Selecciona una ciudad'
    if (Object.keys(errs).length > 0) { setDatosErr(errs); return }
    setDatosErr({})
    // Show waitlist banner if city is in waitlist and full launch hasn't happened yet
    setShowWaitlistBanner(isCiudadWaitlist(city) && !isFullLaunch())
    setStep('rol')
  }

  // ── Step: rol → register → login ──
  async function handleCreateAccount() {
    if (selectedRoles.length === 0 || !termsAccepted) return
    setRegisterErr(null)
    setRegisterLoading(true)
    try {
      await registerUser({
        phone: '+591' + phone,
        name: name.trim(),
        email: email.trim() || undefined,
        city,
        pin,
        initial_role: selectedRoles[0],
        company_name: company.trim() || undefined,
        terms_accepted_at: new Date().toISOString(),
        waitlist: isCiudadWaitlist(city) && !isFullLaunch(),
      })
      // Phone was verified by Firebase — proceed directly to login
      const loginData = await loginUser({ phone: '+591' + phone, pin })
      setUser({
        user_id: loginData.user_id,
        name: loginData.name,
        phone: loginData.phone,
        active_role: loginData.active_role,
        roles: loginData.roles,
        access_token: loginData.access_token,
        refresh_token: loginData.refresh_token,
        city: loginData.city ?? null,
        avatar_url: loginData.avatar_url ?? undefined,
      } as AuthUser)
      onSuccess()
    } catch (err) {
      const code = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      setRegisterErr(AUTH_ERRORS[code] ?? AUTH_ERRORS.UNKNOWN)
    } finally {
      setRegisterLoading(false)
    }
  }

  const BOX_W = 35
  const BOX_H = 46
  const BOX_GAP = 6

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: Z.bg }}>
      {/* Firebase invisible reCAPTCHA — must always be in DOM */}
      <div id="recaptcha-container" style={{ position: 'fixed', bottom: 0, left: 0 }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '58px 16px 8px' }}>
        <button
          type="button"
          onClick={goBack}
          aria-label="Volver"
          style={{ width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke={Z.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ width: 40 }} />
      </div>

      {/* Step bar */}
      <div style={{ padding: '0 24px' }}>
        <StepBar step={step} />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ──────────────── STEP: phone + PIN ──────────────── */}
        {step === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>Crea tu cuenta</h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>Ingresa tu número y crea tu contraseña</p>
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="reg-phone" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>Número de teléfono</label>
              <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${phoneErr ? Z.error : phoneFocused ? Z.orange : Z.border}`, borderRadius: Z.r.sm, background: Z.surface, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <span style={{ padding: '0 0 0 14px', fontFamily: Z.font, fontSize: 15, fontWeight: 600, color: Z.textSec, whiteSpace: 'nowrap' }}>+591</span>
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  placeholder="7XX XXX XX"
                  autoFocus
                  aria-label="Número de teléfono boliviano"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text, padding: '14px 14px 14px 8px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              {phoneErr && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{phoneErr}</span>}
            </div>

            {/* PIN — 8 boxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>Contraseña (8 dígitos)</label>
                <button type="button" onClick={() => setPinVisible((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  {pinVisible
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 003.3 3.1M6.7 6.7C4.3 8.3 3 12 3 12s4 7 9 7c1.8 0 3.4-.7 4.8-1.7" stroke={Z.textMuted} strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M14 5.5C13.4 5.2 12.7 5 12 5c-5 0-9 7-9 7s1.3 3.7 3.7 5.3" stroke={Z.textMuted} strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="12" rx="9" ry="6" stroke={Z.textMuted} strokeWidth="1.8" fill="none"/><circle cx="12" cy="12" r="3" stroke={Z.textMuted} strokeWidth="1.8" fill="none"/></svg>
                  }
                </button>
              </div>
              <div onClick={() => pinRef.current?.focus()} style={{ display: 'flex', gap: BOX_GAP, justifyContent: 'center', cursor: 'text', position: 'relative' }}>
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
                  <div key={i} style={{ width: BOX_W, height: BOX_H, borderRadius: Z.r.sm, border: `1.5px solid ${i === pin.length ? Z.orange : i < pin.length ? Z.orange : Z.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < pin.length ? Z.orangeLight : Z.surface, transition: 'all 0.15s', flexShrink: 0 }}>
                    {i < pin.length && (
                      pinVisible
                        ? <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 700, color: Z.text }}>{pin[i]}</span>
                        : <div style={{ width: 9, height: 9, borderRadius: '50%', background: Z.orangeDark }} />
                    )}
                  </div>
                ))}
              </div>
              {pinErr && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500, marginTop: 2 }}>{pinErr}</span>}
            </div>

            <button
              type="button"
              onClick={handlePhoneNext}
              disabled={phone.length < 8 || pin.length < PIN_LENGTH || phoneLoading}
              style={{ fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase', padding: '15px 24px', borderRadius: Z.r.md, background: Z.orangeDark, color: '#FFFFFF', border: 'none', cursor: phone.length < 8 || pin.length < PIN_LENGTH || phoneLoading ? 'default' : 'pointer', width: '100%', transition: 'all 0.15s ease', opacity: phone.length < 8 || pin.length < PIN_LENGTH || phoneLoading ? 0.45 : 1, boxSizing: 'border-box', outline: 'none' }}
            >
              {phoneLoading ? 'Enviando código...' : 'Siguiente'}
            </button>

            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <span style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec }}>
                ¿Ya tienes cuenta?{' '}
                <span onClick={() => onNavigate('login')} style={{ color: Z.orange, fontWeight: 700, cursor: 'pointer' }}>Inicia sesión</span>
              </span>
            </div>
          </div>
        )}

        {/* ──────────────── STEP: OTP (Firebase SMS) ──────────────── */}
        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
                Verifica tu número
              </h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Enviamos un código SMS a <strong style={{ color: Z.text }}>+591 {phone}</strong>
              </p>
            </div>

            <div>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 10 }}>
                Código de verificación
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      handleOtpChange(i, e.target.value)
                      const next = [...otpDigits]
                      next[i] = e.target.value.replace(/\D/g, '').slice(-1)
                      if (next.every((d) => d !== '') && next.length === OTP_LENGTH) {
                        handleOtpVerify(next)
                      }
                    }}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    autoFocus={i === 0}
                    disabled={otpLoading}
                    style={{ width: 46, height: 54, borderRadius: Z.r.sm, textAlign: 'center', border: `1.5px solid ${digit ? Z.orange : Z.border}`, fontFamily: Z.font, fontSize: 22, fontWeight: 700, color: Z.text, outline: 'none', background: digit ? Z.orangeLight : Z.surface, transition: 'all 0.15s', boxSizing: 'border-box', opacity: otpLoading ? 0.6 : 1 }}
                  />
                ))}
              </div>
            </div>

            {otpErr && (
              <div aria-live="polite" style={{ padding: '12px 16px', borderRadius: Z.r.md, background: Z.errorBg, border: `1px solid ${Z.error}` }}>
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error }}>{otpErr}</span>
              </div>
            )}

            {otpLoading && (
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, textAlign: 'center', margin: 0 }}>
                Verificando...
              </p>
            )}

            <div style={{ textAlign: 'center' }}>
              {canResend
                ? <span onClick={handleResend} style={{ fontFamily: Z.font, fontSize: 13, color: resendLoading ? Z.textMuted : Z.orange, fontWeight: 700, cursor: resendLoading ? 'default' : 'pointer' }}>
                    {resendLoading ? 'Enviando...' : 'Reenviar código'}
                  </span>
                : <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted }}>
                    Reenviar en <span style={{ color: Z.orange, fontWeight: 700 }}>{countdown}s</span>
                  </span>
              }
            </div>
          </div>
        )}

        {/* ──────────────── STEP: datos ──────────────── */}
        {step === 'datos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>Datos personales</h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>Completa tu perfil para comenzar</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="reg-name" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>Nombre completo</label>
              <input id="reg-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Carlos Mamani" autoFocus
                style={{ border: `1.5px solid ${datosErr.name ? Z.error : Z.border}`, borderRadius: Z.r.sm, background: Z.surface, outline: 'none', fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text, padding: '14px', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              />
              {datosErr.name && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{datosErr.name}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="reg-email" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Correo electrónico <span style={{ fontWeight: 400, color: Z.textMuted }}>(opcional)</span>
              </label>
              <input id="reg-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com"
                style={{ border: `1.5px solid ${Z.border}`, borderRadius: Z.r.sm, background: Z.surface, outline: 'none', fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text, padding: '14px', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="reg-company" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Nombre de empresa <span style={{ fontWeight: 400, color: Z.textMuted }}>(opcional)</span>
              </label>
              <input id="reg-company" type="text" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ej: Constructora Andina S.R.L."
                style={{ border: `1.5px solid ${Z.border}`, borderRadius: Z.r.sm, background: Z.surface, outline: 'none', fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text, padding: '14px', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>Ciudad</label>
              <select value={city} onChange={(e) => { setCity(e.target.value); setShowWaitlistBanner(false) }}
                style={{ border: `1.5px solid ${datosErr.city ? Z.error : Z.border}`, borderRadius: Z.r.sm, background: Z.surface, outline: 'none', fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: city ? Z.text : Z.textMuted, padding: '14px', width: '100%', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
              >
                <option value="">Selecciona tu ciudad</option>
                {BOLIVIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {datosErr.city && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{datosErr.city}</span>}
              {/* Waitlist preview — shown inline when selecting a waitlist city */}
              {city && isCiudadWaitlist(city) && !isFullLaunch() && (
                <div style={{ marginTop: 4, padding: '10px 14px', borderRadius: Z.r.sm, background: Z.orangeLight, border: `1px solid ${Z.orange}` }}>
                  <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.orangeDark, fontWeight: 500, lineHeight: 1.5 }}>
                    Ziteo llega pronto a {city}. Completa tu registro y te avisamos cuando esté disponible.
                  </span>
                </div>
              )}
            </div>

            <button type="button" onClick={handleDatosNext} disabled={!name || !city}
              style={{ fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase', padding: '15px 24px', borderRadius: Z.r.md, background: Z.orangeDark, color: '#FFFFFF', border: 'none', cursor: !name || !city ? 'default' : 'pointer', width: '100%', transition: 'all 0.15s ease', opacity: !name || !city ? 0.45 : 1, boxSizing: 'border-box', outline: 'none' }}
            >
              Siguiente
            </button>
          </div>
        )}

        {/* ──────────────── STEP: rol ──────────────── */}
        {step === 'rol' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>¿Cuál es tu rol?</h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>Puedes seleccionar más de uno</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLES.map(({ role, title, description }) => {
                const sel = selectedRoles.includes(role)
                return (
                  <button key={role} type="button"
                    onClick={() => setSelectedRoles((p) => p.includes(role) ? p.filter((r) => r !== role) : [...p, role])}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: Z.r.md, cursor: 'pointer', width: '100%', textAlign: 'left', border: `2px solid ${sel ? Z.orange : Z.border}`, background: sel ? Z.orangeLight : Z.surface, transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none' }}
                  >
                    <RoleIcon role={role} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{title}</div>
                      <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec, marginTop: 2 }}>{description}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid ${sel ? Z.orange : Z.border}`, background: sel ? Z.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {sel && <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Waitlist city banner */}
            {showWaitlistBanner && (
              <div style={{ padding: '12px 16px', borderRadius: Z.r.md, background: Z.orangeLight, border: `1px solid ${Z.orange}` }}>
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.orangeDark, fontWeight: 500, lineHeight: 1.5 }}>
                  Ziteo llega pronto a {city}. Completa tu registro y te avisamos cuando esté disponible en tu ciudad.
                </span>
              </div>
            )}

            {/* Terms acceptance */}
            <div
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
              onClick={() => setTermsAccepted((v) => !v)}
            >
              <div
                role="checkbox"
                aria-checked={termsAccepted}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${termsAccepted ? Z.orange : Z.border}`,
                  background: termsAccepted ? Z.orange : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {termsAccepted && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, lineHeight: 1.6 }}>
                Acepto los{' '}
                <span
                  onClick={(e) => { e.stopPropagation(); setLegalModal('terminos') }}
                  style={{ color: Z.orange, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Términos de Uso
                </span>
                {' '}y la{' '}
                <span
                  onClick={(e) => { e.stopPropagation(); setLegalModal('privacidad') }}
                  style={{ color: Z.orange, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Política de Privacidad
                </span>
                {' '}de Ziteo
              </span>
            </div>

            {registerErr && (
              <div style={{ padding: '12px 16px', borderRadius: Z.r.md, background: Z.errorBg, border: `1px solid ${Z.error}` }}>
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error }}>{registerErr}</span>
              </div>
            )}

            <button type="button" onClick={handleCreateAccount} disabled={selectedRoles.length === 0 || !termsAccepted || registerLoading}
              style={{ fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase', padding: '15px 24px', borderRadius: Z.r.md, marginTop: 8, background: Z.orangeDark, color: '#FFFFFF', border: 'none', cursor: selectedRoles.length === 0 || !termsAccepted || registerLoading ? 'default' : 'pointer', width: '100%', transition: 'all 0.15s ease', opacity: selectedRoles.length === 0 || !termsAccepted || registerLoading ? 0.45 : 1, boxSizing: 'border-box', outline: 'none' }}
            >
              {registerLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>
        )}

      </div>

      {/* Legal modals */}
      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { registerWithPin, resendOtp, verifyOtpAndLogin, loginWithPin, AuthServiceError } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { useBiometricAuth } from '../../../shared/hooks/useBiometricAuth'
import type { UserRole } from '../types/authTypes'
import { Z } from '@/shared/design/tokens'
import LegalModal, { type LegalDocType } from '@/shared/components/LegalModal'
import { track } from '../../../lib/analytics'
import { OtpVerificationSheet } from './OtpVerificationSheet'
import type { VerificationStep } from './OtpVerificationSheet'

interface RegisterFormProps {
  onSuccess: () => void
  onNavigate: (dest: string) => void
}

const PHONE_REGEX = /^[678]\d{7}$/

type Step = 1 | 2 | 3
const TOTAL_STEPS = 3

const ROLES: { role: UserRole; title: string; description: string }[] = [
  { role: 'constructor', title: 'Constructor', description: 'Busca materiales, herramientas y contrata profesionales para tus obras.' },
  { role: 'proveedor', title: 'Vendedor / Proveedor', description: 'Gestiona tu inventario, ventas y pedidos de materiales.' },
  { role: 'maestro', title: 'Maestro de Obra', description: 'Recibe solicitudes de trabajo y muestra tu experiencia.' },
  { role: 'chofer', title: 'Chofer / Repartidor', description: 'Realiza entregas de materiales con tu vehículo.' },
]

function RoleIcon({ role, size = 40 }: { role: UserRole; size?: number }) {
  if (role === 'constructor') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="28" width="32" height="14" rx="2" fill={Z.orangeDark} opacity="0.15" />
      <rect x="12" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5" />
      <rect x="21" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5" />
      <rect x="30" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5" />
      <path d="M6 28h36" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 28V18l10-8 10 8v10" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <rect x="20" y="20" width="8" height="8" rx="1.5" stroke={Z.orange} strokeWidth="2" fill="none" />
    </svg>
  )
  if (role === 'proveedor') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="20" width="32" height="22" rx="3" fill={Z.blue} opacity="0.12" />
      <path d="M8 20h32" stroke={Z.blueDark} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 20c0 0 4-10 18-10s18 10 18 10" stroke={Z.blue} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="18" y="28" width="12" height="14" rx="2" stroke={Z.blueDark} strokeWidth="2" fill={Z.blue} opacity="0.2" />
      <circle cx="24" cy="34" r="1.5" fill={Z.blueDark} />
    </svg>
  )
  if (role === 'maestro') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M18 10l-8 8 3 3 8-8M30 38l8-8-3-3-8 8" stroke={Z.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 34l20-20" stroke={Z.orangeDark} strokeWidth="3" strokeLinecap="round" />
      <circle cx="14" cy="34" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2" />
      <circle cx="34" cy="14" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2" />
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="4" y="16" width="24" height="18" rx="3" stroke={Z.blueDark} strokeWidth="2.5" fill={Z.blue} opacity="0.1" />
      <path d="M28 22h10l6 8v4h-16v-12z" stroke={Z.blueDark} strokeWidth="2.5" strokeLinejoin="round" fill={Z.blue} opacity="0.1" />
      <circle cx="14" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white" />
      <circle cx="38" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white" />
      <circle cx="14" cy="36" r="1.5" fill={Z.blueDark} />
      <circle cx="38" cy="36" r="1.5" fill={Z.blueDark} />
    </svg>
  )
}

function StepBar({ step }: { step: Step }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: s <= step ? Z.orange : Z.divider,
            transition: 'background 0.25s ease',
          }}
        />
      ))}
    </div>
  )
}

const inputBase: React.CSSProperties = {
  fontFamily: Z.font,
  fontSize: 15,
  fontWeight: 500,
  color: Z.text,
  padding: '14px',
  borderRadius: Z.r.sm,
  background: Z.surface,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  border: `1.5px solid ${Z.border}`,
  transition: 'border-color 0.2s',
}

export default function RegisterForm({ onSuccess, onNavigate }: RegisterFormProps) {
  const setUser = useAuthStore((s) => s.setUser)
  const { saveCredential } = useBiometricAuth()
  const [step, setStep] = useState<Step>(1)

  useEffect(() => {
    track.registrationStarted()
  }, [])

  // Step 1 — required
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [step1Err, setStep1Err] = useState<{ name?: string; phone?: string }>({})
  const nameRef = useRef<HTMLInputElement>(null)

  // Step 2 — optional email/company, required city
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [selectedCity, setSelectedCity] = useState('Sucre')

  // Step 3 — role
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [legalModal, setLegalModal] = useState<LegalDocType | null>(null)

  // Temporarily holds the confirmed PIN during registration so it can be saved for biometrics
  const [createdPin, setCreatedPin] = useState<string | null>(null)

  // OTP Verification Sheet state
  const [showSheet, setShowSheet] = useState(false)
  const [sheetStep, setSheetStep] = useState<VerificationStep>('pin-create')
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  // debug_otp: only populated in local dev when WhatsApp is not configured
  const [debugOtp, setDebugOtp] = useState<string | null>(null)

  function goBack() {
    if (step === 1) onNavigate('welcome')
    else setStep((step - 1) as Step)
  }

  function handleStep1Next() {
    const errs: typeof step1Err = {}
    if (name.trim().length < 2) errs.name = 'Ingresa tu nombre completo'
    if (!PHONE_REGEX.test(phone)) errs.phone = 'Ingresa un número válido (8 dígitos, empieza con 6, 7 u 8)'
    if (Object.keys(errs).length > 0) { setStep1Err(errs); return }
    setStep1Err({})
    setStep(2)
  }

  function handleStep2Next() {
    setStep(3)
  }

  // Registration flow:
  // 1. Sheet opens at pin-create (collect PIN first, no backend call yet)
  // 2. pin-create → pin-confirm (PIN confirmed locally)
  // 3. pin-confirm complete → sending (calls auth-register, which creates user and sends OTP)
  // 4. code (user enters OTP) → calls verifyOtpAndLogin → sets user session
  // 5. biometric (optional)

  function handleOpenSheet() {
    if (!selectedRole || !termsAccepted) return
    setSheetError(null)
    setShowSheet(true)
    // Start at pin-create so user sets their PIN before we call the backend
    setSheetStep('pin-create')
  }

  // Called from the 'code' step once OTP is entered
  async function handleVerified(code: string) {
    if (!createdPin || !selectedRole) return
    setSheetLoading(true)
    setSheetError(null)
    try {
      const user = await verifyOtpAndLogin('+591' + phone, code, createdPin)
      setUser(user)
      track.onboardingComplete(selectedRole)
      setDebugOtp(null)
      setSheetStep('biometric')
    } catch (err) {
      console.error('OTP verification failed:', err)
      const errCode = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      if (errCode === 'OTP_EXPIRED') {
        setSheetError('El código expiró. Solicita uno nuevo.')
      } else if (errCode === 'INVALID_OTP') {
        setSheetError('Código incorrecto. Revísalo e inténtalo de nuevo.')
      } else {
        setSheetError(`No pudimos verificar tu código. Inténtalo de nuevo o contacta a soporte [${errCode}].`)
      }
    } finally {
      setSheetLoading(false)
    }
  }

  // Called by OtpVerificationSheet for both pin-create and pin-confirm steps
  function handlePinCreated(pin: string) {
    if (sheetStep === 'pin-create') {
      setCreatedPin(pin)
      setSheetStep('pin-confirm')
      return
    }
    // pin-confirm step — PIN is confirmed; now register the user
    void handleRegister(pin)
  }

  function mapRegisterError(code: string): string {
    switch (code) {
      case 'PHONE_ALREADY_REGISTERED':
        return 'Este número ya está registrado. Por favor, inicia sesión.'
      case 'RATE_LIMITED':
        return 'Demasiados intentos. Espera 15 minutos antes de intentarlo de nuevo.'
      case 'WHATSAPP_SEND_FAILED':
        return 'No pudimos enviar el código de verificación. Inténtalo de nuevo más tarde.'
      case 'INVALID_PHONE_FORMAT':
        return 'Número de teléfono inválido. Verifica el número e inténtalo de nuevo.'
      default:
        return `No pudimos completar tu registro en este momento. Inténtalo más tarde o contacta a soporte indicando el código [${code}].`
    }
  }

  async function handleRegister(pin: string) {
    if (!selectedRole) return
    setSheetLoading(true)
    setSheetError(null)
    setSheetStep('sending')
    try {
      const result = await registerWithPin(
        {
          name: name.trim(),
          phone: '+591' + phone,
          email: email.trim() || undefined,
          company_name: company.trim() || undefined,
          initial_role: selectedRole,
          city: selectedCity,
          terms_accepted_at: new Date().toISOString(),
        },
        pin
      )
      if (!result.requires_otp) {
        // Piloto sin WhatsApp: el backend ya verificó el teléfono y no hay
        // código que ingresar. Logueamos directo con el PIN recién creado.
        const user = await loginWithPin('+591' + phone, pin)
        setUser(user)
        track.onboardingComplete(selectedRole)
        setSheetStep('biometric')
        return
      }
      // auth-register created the user and sent the OTP (or returned debug_otp in dev)
      if (result.debug_otp) setDebugOtp(result.debug_otp)
      setSheetStep('code')
    } catch (err) {
      console.error('Registration failed:', err)
      const code = err instanceof AuthServiceError ? err.code : 'ERR_AUTH_EDGE'
      setSheetError(mapRegisterError(code))
      // Return to pin-create so the user can retry (PIN fields reset by OtpVerificationSheet)
      setSheetStep('pin-create')
    } finally {
      setSheetLoading(false)
    }
  }

  function handleBiometricChoice(enabled: boolean) {
    localStorage.setItem('ziteo_biometric_enabled', enabled ? 'true' : 'false')
    if (enabled && createdPin) {
      // Save credentials to Preferences so biometric login can retrieve them later.
      // Fire-and-forget: if it fails, the user can still log in with their PIN.
      void saveCredential('+591' + phone, createdPin)
    }
    onSuccess()
  }

  async function handleResend() {
    if (resendCooldown > 0 || sheetLoading) return
    setSheetLoading(true)
    setSheetError(null)
    try {
      const result = await resendOtp('+591' + phone)
      if (result.debug_otp) setDebugOtp(result.debug_otp)
      // Start 60s cooldown
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      const errCode = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      if (errCode === 'RATE_LIMITED') {
        setSheetError('Espera al menos 60 segundos antes de solicitar un nuevo código.')
        setResendCooldown(60)
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) { clearInterval(interval); return 0 }
            return prev - 1
          })
        }, 1000)
      } else {
        setSheetError('No pudimos reenviar el código. Inténtalo de nuevo.')
      }
    } finally {
      setSheetLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: Z.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '58px 16px 8px' }}>
        <button
          type="button"
          onClick={goBack}
          aria-label="Volver"
          style={{ width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke={Z.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: Z.textMuted, textTransform: 'uppercase' }}>
          Paso {step} de {TOTAL_STEPS}
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '0 24px' }}>
        <StepBar step={step} />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>Lo esencial</h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Empecemos con tu nombre y tu número de contacto.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="reg-name" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Nombre completo
              </label>
              <input
                id="reg-name"
                ref={nameRef}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Carlos Mamani"
                autoFocus
                style={{ ...inputBase, borderColor: step1Err.name ? Z.error : Z.border }}
              />
              {step1Err.name && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{step1Err.name}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="reg-phone" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Número de teléfono
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${step1Err.phone ? Z.error : phoneFocused ? Z.orange : Z.border}`, borderRadius: Z.r.sm, background: Z.surface, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <span style={{ padding: '0 0 0 14px', fontFamily: Z.font, fontSize: 15, fontWeight: 600, color: Z.textSec, whiteSpace: 'nowrap' }}>+591</span>
                <input
                  id="reg-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  placeholder="7XX XXX XX"
                  aria-label="Número de teléfono boliviano"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text, padding: '14px 14px 14px 8px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              {step1Err.phone && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{step1Err.phone}</span>}
            </div>

            <button
              type="button"
              onClick={handleStep1Next}
              disabled={!name || phone.length < 8}
              style={{ fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase', padding: '15px 24px', borderRadius: Z.r.md, background: Z.orangeDark, color: '#FFFFFF', border: 'none', cursor: !name || phone.length < 8 ? 'default' : 'pointer', width: '100%', opacity: !name || phone.length < 8 ? 0.45 : 1, boxSizing: 'border-box' }}
            >
              Continuar
            </button>

            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <span style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec }}>
                ¿Ya tienes cuenta?{' '}
                <span onClick={() => onNavigate('welcome')} style={{ color: Z.orange, fontWeight: 700, cursor: 'pointer' }}>
                  Volver al inicio
                </span>
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>Información adicional</h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Todo aquí es opcional. Puedes saltar este paso si prefieres.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="reg-email" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Correo electrónico <span style={{ fontWeight: 400, color: Z.textMuted }}>(opcional)</span>
              </label>
              <input
                id="reg-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoFocus
                style={inputBase}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="reg-company" style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Nombre de empresa o tienda <span style={{ fontWeight: 400, color: Z.textMuted }}>(opcional)</span>
              </label>
              <input
                id="reg-company"
                type="text"
                autoComplete="organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej: Constructora Andina S.R.L."
                style={inputBase}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Tu ciudad operativa <span style={{ color: Z.orange }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Sucre', 'Potosí', 'Santa Cruz'].map((c) => {
                  const active = selectedCity === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCity(c)}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        borderRadius: Z.r.sm,
                        fontFamily: Z.font,
                        fontSize: 14,
                        fontWeight: 700,
                        textAlign: 'center',
                        border: `1.5px solid ${active ? Z.orange : Z.border}`,
                        background: active ? Z.orangeLight : Z.surface,
                        color: active ? Z.orangeDark : Z.textSec,
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStep2Next}
              style={{ fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase', padding: '15px 24px', borderRadius: Z.r.md, background: Z.orangeDark, color: '#FFFFFF', border: 'none', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
            >
              Continuar
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>¿Cuál es tu rol?</h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Elige cómo vas a usar Ziteoo. Podrás cambiarlo más tarde.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLES.map(({ role, title, description }) => {
                const sel = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: Z.r.md, cursor: 'pointer', width: '100%', textAlign: 'left', border: `2px solid ${sel ? Z.orange : Z.border}`, background: sel ? Z.orangeLight : Z.surface, transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none' }}
                  >
                    <RoleIcon role={role} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{title}</div>
                      <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec, marginTop: 2, lineHeight: 1.45 }}>{description}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: `2px solid ${sel ? Z.orange : Z.border}`, background: sel ? Z.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFFFFF' }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginTop: 4 }}
              onClick={() => setTermsAccepted((v) => !v)}
            >
              <div
                role="checkbox"
                aria-checked={termsAccepted}
                style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1, border: `2px solid ${termsAccepted ? Z.orange : Z.border}`, background: termsAccepted ? Z.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              >
                {termsAccepted && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, lineHeight: 1.6 }}>
                Acepto los{' '}
                <span onClick={(e) => { e.stopPropagation(); setLegalModal('terminos') }} style={{ color: Z.orange, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
                  Términos de Uso
                </span>
                {' '}y la{' '}
                <span onClick={(e) => { e.stopPropagation(); setLegalModal('privacidad') }} style={{ color: Z.orange, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
                  Política de Privacidad
                </span>
                {' '}de Ziteoo.
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenSheet}
              disabled={!selectedRole || !termsAccepted}
              style={{ fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase', padding: '15px 24px', borderRadius: Z.r.md, marginTop: 4, background: Z.orangeDark, color: '#FFFFFF', border: 'none', cursor: !selectedRole || !termsAccepted ? 'default' : 'pointer', width: '100%', opacity: !selectedRole || !termsAccepted ? 0.45 : 1, boxSizing: 'border-box' }}
            >
              Entrar a Ziteoo
            </button>
          </div>
        )}

      </div>

      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}

      {showSheet && (
        <OtpVerificationSheet
          phone={'+591' + phone}
          step={sheetStep}
          onVerified={handleVerified}
          onPinCreated={handlePinCreated}
          onBiometricChoice={handleBiometricChoice}
          onChangePhone={() => {
            setShowSheet(false)
            setSheetStep('pin-create')
            setDebugOtp(null)
          }}
          loading={sheetLoading}
          error={sheetError}
          onResend={handleResend}
          resendCooldown={resendCooldown}
          debugOtp={debugOtp ?? undefined}
        />
      )}
    </div>
  )
}

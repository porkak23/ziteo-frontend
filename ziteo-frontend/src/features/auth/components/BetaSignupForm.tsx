import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../store/authStore'
import { Z } from '@/shared/design/tokens'

interface BetaSignupFormProps {
  onSuccess: () => void
}

const PHONE_REGEX = /^\+591[678]\d{7}$/

const CITIES = ['Santa Cruz de la Sierra', 'Sucre', 'Potosí'] as const
type City = (typeof CITIES)[number]

interface RoleOption {
  value: UserRole
  label: string
  description: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'constructor',
    label: 'Constructor',
    description: 'Soy contratista o jefe de obra. Necesito materiales, maestros y choferes para mis proyectos.',
  },
  {
    value: 'proveedor',
    label: 'Proveedor de materiales',
    description: 'Vendo materiales de construcción. Quiero llegar a más constructores.',
  },
  {
    value: 'maestro',
    label: 'Maestro de obra',
    description: 'Ofrezco mi trabajo en albañilería, plomería, electricidad u otra especialidad.',
  },
  {
    value: 'chofer',
    label: 'Chofer',
    description: 'Tengo movilidad de carga y ofrezco servicio de transporte de materiales.',
  },
]

interface BetaSignupResponse {
  user_id: string
  name: string
  phone: string
  email?: string
  city: string | null
  active_role: UserRole
  roles: UserRole[]
  access_token: string
  refresh_token: string
  is_returning?: boolean
}

interface BetaSignupErrorBody {
  error?: string
  message?: string
}

type Step = 1 | 2 | 3

export default function BetaSignupForm({ onSuccess }: BetaSignupFormProps) {
  // Wizard state
  const [step, setStep] = useState<Step>(1)

  // Step 1 — datos de contacto
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+591 ')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState<City | ''>('')

  const [nameErr, setNameErr] = useState<string | null>(null)
  const [phoneErr, setPhoneErr] = useState<string | null>(null)
  const [cityErr, setCityErr] = useState<string | null>(null)

  // Step 2 — rol
  const [role, setRole] = useState<UserRole | ''>('')
  const [submitErr, setSubmitErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isReturning, setIsReturning] = useState(false)

  function normalizePhone(raw: string): string {
    return raw.replace(/\s/g, '')
  }

  function handlePhoneChange(value: string) {
    if (!value.startsWith('+591')) {
      setPhone('+591 ')
      return
    }
    setPhone(value)
  }

  // ── Step 1 validation ─────────────────────────────────────────
  function validateStep1(): boolean {
    let ok = true

    if (name.trim().length < 2) {
      setNameErr('Ingresa tu nombre completo')
      ok = false
    } else {
      setNameErr(null)
    }

    const normalizedPhone = normalizePhone(phone)
    if (!PHONE_REGEX.test(normalizedPhone)) {
      setPhoneErr('Número inválido — formato: +591 7XXXXXXX')
      ok = false
    } else {
      setPhoneErr(null)
    }

    if (!city) {
      setCityErr('Selecciona tu ciudad')
      ok = false
    } else {
      setCityErr(null)
    }

    return ok
  }

  function handleStep1Continue() {
    if (!validateStep1()) return
    setStep(2)
  }

  // ── Step 2 — submit ───────────────────────────────────────────
  async function handleStep2Continue() {
    if (!role) return

    setSubmitErr(null)
    setLoading(true)

    const normalizedPhone = normalizePhone(phone)
    const cityValue = city || null

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/beta-signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({
            name: name.trim(),
            phone: normalizedPhone,
            email: email.trim() || undefined,
            city: cityValue,
            role,
          }),
        }
      )

      const raw = (await res.json()) as BetaSignupResponse & BetaSignupErrorBody

      if (!res.ok) {
        // Edge function returns: { error: <code>, message: <human-readable> }
        const msg = raw.message ?? raw.error ?? 'Ocurrió un error, intenta de nuevo'
        setSubmitErr(msg)
        return
      }

      useAuthStore.getState().setUser({
        user_id: raw.user_id,
        name: raw.name,
        phone: raw.phone,
        email: raw.email,
        city: raw.city,
        active_role: raw.active_role,
        roles: raw.roles,
        access_token: raw.access_token,
        refresh_token: raw.refresh_token,
      })

      if (raw.is_returning) {
        // Returning users already know how to install — skip step 3.
        setIsReturning(true)
        onSuccess()
        return
      }

      setStep(3)
    } catch {
      setSubmitErr('Ocurrió un error, intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  const step1CanContinue =
    name.trim().length >= 2 && phone.length > 5 && !!city

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: Z.bg }}>
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '64px 24px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        {/* Step indicator */}
        <StepIndicator step={step} />

        {step === 1 && (
          <div
            key="step-1"
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            className="animate-[fadeSlideUp_0.25s_ease-out]"
          >
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h1 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 28, color: Z.text, margin: 0 }}>
                Bienvenido a Ziteo
              </h1>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: 0, lineHeight: 1.5 }}>
                Acceso beta — te avisaremos cuando la app lance oficialmente
              </p>
            </div>

            {/* Nombre completo */}
            <Field label="Nombre completo">
              <input
                id="beta-name"
                type="text"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Carlos Mamani"
                style={inputStyle(!!nameErr)}
              />
              {nameErr && <ErrText>{nameErr}</ErrText>}
            </Field>

            {/* Teléfono */}
            <Field label="Teléfono">
              <input
                id="beta-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+591 7XXXXXXX"
                style={inputStyle(!!phoneErr)}
              />
              {phoneErr && <ErrText>{phoneErr}</ErrText>}
            </Field>

            {/* Correo (opcional) */}
            <Field
              label="Correo electrónico"
              optional
            >
              <input
                id="beta-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opcional"
                style={inputStyle(false)}
              />
            </Field>

            {/* Ciudad */}
            <Field label="Ciudad">
              <select
                id="beta-city"
                value={city}
                onChange={(e) => setCity(e.target.value as City | '')}
                style={selectStyle(!!cityErr, !!city)}
              >
                <option value="">Selecciona tu ciudad</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {cityErr && <ErrText>{cityErr}</ErrText>}
            </Field>

            {/* Continuar */}
            <button
              type="button"
              onClick={handleStep1Continue}
              disabled={!step1CanContinue}
              style={primaryButtonStyle(step1CanContinue)}
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div
            key="step-2"
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            className="animate-[fadeSlideUp_0.25s_ease-out]"
          >
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h1 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 28, color: Z.text, margin: 0 }}>
                ¿Cuál es tu rol?
              </h1>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: 0, lineHeight: 1.5 }}>
                Elige cómo usarás Ziteo
              </p>
            </div>

            {/* Role cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ROLE_OPTIONS.map((opt) => {
                const selected = role === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      padding: '16px 18px',
                      minHeight: 64,
                      borderRadius: Z.r.md,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      border: `2px solid ${selected ? Z.orange : Z.border}`,
                      background: selected ? Z.orangeLight : Z.surface,
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: Z.font,
                        fontSize: 15,
                        fontWeight: 700,
                        color: selected ? Z.orangeDark : Z.text,
                      }}
                    >
                      {opt.label}
                    </span>
                    <span
                      style={{
                        fontFamily: Z.font,
                        fontSize: 13,
                        fontWeight: 500,
                        color: Z.textSec,
                        lineHeight: 1.45,
                      }}
                    >
                      {opt.description}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Submit error */}
            {submitErr && (
              <div
                aria-live="polite"
                style={{
                  padding: '12px 16px',
                  borderRadius: Z.r.md,
                  background: Z.errorBg,
                  border: `1px solid ${Z.error}`,
                }}
              >
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error }}>{submitErr}</span>
              </div>
            )}

            {/* Returning user toast (rare — usually we skip to onSuccess) */}
            {isReturning && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: Z.r.md,
                  background: Z.orangeLight,
                  border: `1px solid ${Z.orange}`,
                }}
              >
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.orangeDark, fontWeight: 500 }}>
                  Bienvenido de nuevo
                </span>
              </div>
            )}

            {/* Nav buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                style={{
                  fontFamily: Z.font,
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '15px 20px',
                  borderRadius: Z.r.md,
                  background: 'transparent',
                  color: Z.textSec,
                  border: 'none',
                  cursor: loading ? 'default' : 'pointer',
                  outline: 'none',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleStep2Continue}
                disabled={!role || loading}
                style={{
                  ...primaryButtonStyle(!!role && !loading),
                  flex: 1,
                }}
              >
                {loading ? 'Cargando...' : 'Continuar'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div
            key="step-3"
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            className="animate-[fadeSlideUp_0.25s_ease-out]"
          >
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h1 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 28, color: Z.text, margin: 0 }}>
                Instala Ziteo en tu celular
              </h1>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: 0, lineHeight: 1.5 }}>
                Para usar la app cuando quieras, agrégala a tu pantalla de inicio
              </p>
            </div>

            <InstallInstructionsInline />

            <button
              type="button"
              onClick={onSuccess}
              style={primaryButtonStyle(true)}
            >
              Entrar a la app
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step indicator ─────────────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  const pct = step === 1 ? 33 : step === 2 ? 66 : 100
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          fontFamily: Z.font,
          fontSize: 12,
          fontWeight: 600,
          color: Z.textSec,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
        }}
      >
        Paso {step} de 3
      </span>
      <div
        style={{
          height: 3,
          width: '100%',
          background: Z.divider,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: Z.orange,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

// ── Small UI helpers ───────────────────────────────────────────────
function Field({
  label,
  optional,
  children,
}: {
  label: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontFamily: Z.font,
          fontSize: 13,
          fontWeight: 600,
          color: Z.textSec,
        }}
      >
        {label}
        {optional && (
          <span style={{ fontWeight: 400, color: Z.textMuted }}> (opcional)</span>
        )}
      </label>
      {children}
    </div>
  )
}

function ErrText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>
      {children}
    </span>
  )
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    border: `1.5px solid ${hasError ? Z.error : Z.border}`,
    borderRadius: Z.r.sm,
    background: Z.surface,
    outline: 'none',
    fontFamily: Z.font,
    fontSize: 15,
    fontWeight: 500,
    color: Z.text,
    padding: '14px',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }
}

function selectStyle(hasError: boolean, hasValue: boolean): React.CSSProperties {
  return {
    border: `1.5px solid ${hasError ? Z.error : Z.border}`,
    borderRadius: Z.r.sm,
    background: Z.surface,
    outline: 'none',
    fontFamily: Z.font,
    fontSize: 15,
    fontWeight: 500,
    color: hasValue ? Z.text : Z.textMuted,
    padding: '14px',
    width: '100%',
    boxSizing: 'border-box',
    appearance: 'none',
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
  }
}

function primaryButtonStyle(enabled: boolean): React.CSSProperties {
  return {
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
    cursor: enabled ? 'pointer' : 'default',
    width: '100%',
    transition: 'all 0.15s ease',
    opacity: enabled ? 1 : 0.45,
    boxSizing: 'border-box',
    outline: 'none',
  }
}

// ── Install instructions (inline, text-only — iOS Safari + Android Chrome) ──
function InstallInstructionsInline() {
  const iosSteps = [
    'Abre esta página en Safari (el navegador predeterminado de Apple).',
    'Toca el botón de compartir en la barra inferior de Safari.',
    'Desplázate hacia abajo y toca "Añadir a pantalla de inicio".',
    'Toca "Añadir" en la esquina superior derecha para confirmar.',
  ]
  const androidSteps = [
    'Abre esta página en Chrome para Android.',
    'Toca el menú de tres puntos en la esquina superior derecha.',
    'Selecciona "Añadir a pantalla de inicio".',
    'Confirma tocando "Añadir" en el diálogo que aparece.',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <InstallCard title="iPhone / iPad" subtitle="Debe abrirse en Safari, no en Chrome" steps={iosSteps} />
      <InstallCard title="Android" subtitle="Abre esta página en Chrome" steps={androidSteps} />
      <p
        style={{
          fontFamily: Z.font,
          fontSize: 13,
          color: Z.textSec,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Una vez instalada, Ziteo funciona como una app normal desde tu pantalla de inicio.
      </p>
    </div>
  )
}

function InstallCard({
  title,
  subtitle,
  steps,
}: {
  title: string
  subtitle: string
  steps: string[]
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: Z.r.md,
        background: Z.surface,
        border: `1px solid ${Z.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>
          {title}
        </span>
        <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec }}>
          {subtitle}
        </span>
      </div>
      <ol
        style={{
          margin: 0,
          paddingLeft: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {steps.map((s, i) => (
          <li
            key={i}
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              color: Z.textSec,
              lineHeight: 1.5,
            }}
          >
            {s}
          </li>
        ))}
      </ol>
    </div>
  )
}

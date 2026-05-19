/**
 * MaestroOnboardingWizard — Wizard de primer login para Maestros.
 *
 * Aparece cuando onboarding_complete = false en user_roles para el rol maestro.
 * 3 pasos: Especialidad, Tarifa, Disponibilidad.
 * Al completar o saltar todo: marca onboarding_complete = true.
 */
import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { CIUDADES_ACTIVAS } from '../../../shared/constants/geography'
import { Z } from '../../../shared/design/tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardProps {
  onComplete: () => void
}

type WizardStep = 1 | 2 | 3

// ─── Constants ────────────────────────────────────────────────────────────────

const ESPECIALIDADES = [
  'Albanileria',
  'Electricidad',
  'Plomeria',
  'Carpinteria',
  'Pintura',
  'Instalaciones',
  'Otro',
] as const

type Especialidad = typeof ESPECIALIDADES[number]

type RateTipo = 'hora' | 'proyecto'

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: WizardStep; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as WizardStep
        const isActive = step === current
        const isDone = step < current
        return (
          <div
            key={step}
            style={{
              width: isActive ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: isActive || isDone ? Z.orange : Z.divider,
              transition: 'all 0.2s',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Shared field primitive ───────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textSec, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  fontFamily: Z.font,
  fontSize: 15,
  fontWeight: 500,
  color: Z.text,
  padding: '13px 14px',
  borderRadius: Z.r.sm,
  border: `1.5px solid ${Z.border}`,
  background: Z.surface,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

// ─── Step 1: Especialidad ─────────────────────────────────────────────────────

interface Step1Data {
  especialidades: Especialidad[]
  experiencia: string
}

function Step1Especialidad({ onNext }: { onNext: (data: Step1Data) => void }) {
  const [selected, setSelected] = useState<Especialidad[]>([])
  const [experiencia, setExperiencia] = useState('')
  const [touched, setTouched] = useState(false)

  const selError = touched && selected.length === 0 ? 'Selecciona al menos una especialidad' : null

  function toggleEsp(e: Especialidad) {
    setSelected((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    )
  }

  function handleNext() {
    setTouched(true)
    if (selected.length === 0) return
    onNext({ especialidades: selected, experiencia })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
          Tu especialidad
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginTop: 4 }}>
          Los constructores te buscaran por tu especialidad. Puedes elegir mas de una.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ESPECIALIDADES.map((e) => {
          const isSelected = selected.includes(e)
          return (
            <button
              key={e}
              type="button"
              onClick={() => toggleEsp(e)}
              style={{
                padding: '10px 16px',
                borderRadius: Z.r.full,
                border: isSelected ? `2px solid ${Z.orange}` : `1.5px solid ${Z.border}`,
                background: isSelected ? Z.orangeLight : Z.surface,
                color: isSelected ? Z.orangeDark : Z.text,
                fontFamily: Z.font,
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {e}
            </button>
          )
        })}
      </div>

      {selError && (
        <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{selError}</span>
      )}

      <Field label="Anos de experiencia (opcional)">
        <input
          type="number"
          value={experiencia}
          onChange={(e) => setExperiencia(e.target.value)}
          placeholder="Ej. 5"
          min="0"
          max="60"
          style={inputStyle}
        />
      </Field>

      <button
        onClick={handleNext}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Continuar
      </button>
    </div>
  )
}

// ─── Step 2: Tarifa ───────────────────────────────────────────────────────────

interface Step2Data {
  rateType: RateTipo
  rateAmount: string
  city: string
}

function Step2Tarifa({
  initialCity,
  onNext,
}: {
  initialCity: string | null
  onNext: (data: Step2Data) => void
}) {
  const [rateType, setRateType] = useState<RateTipo>('hora')
  const [amount, setAmount] = useState('')
  const [city, setCity] = useState(
    initialCity && (CIUDADES_ACTIVAS as readonly string[]).includes(initialCity) ? initialCity : ''
  )
  const [touched, setTouched] = useState(false)

  const cityError = touched && !city ? 'Selecciona tu ciudad de trabajo' : null

  function handleNext() {
    setTouched(true)
    if (!city) return
    onNext({ rateType, rateAmount: amount, city })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
          Tu tarifa
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginTop: 4 }}>
          Indica como cobras para que los constructores te puedan contratar.
        </p>
      </div>

      <Field label="Tipo de tarifa">
        <div style={{ display: 'flex', gap: 10 }}>
          {(['hora', 'proyecto'] as RateTipo[]).map((t) => {
            const label = t === 'hora' ? 'Por hora' : 'Por proyecto'
            const isSelected = rateType === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setRateType(t)}
                style={{
                  flex: 1,
                  padding: '13px 8px',
                  borderRadius: Z.r.sm,
                  border: isSelected ? `2px solid ${Z.orange}` : `1.5px solid ${Z.border}`,
                  background: isSelected ? Z.orangeLight : Z.surface,
                  color: isSelected ? Z.orangeDark : Z.text,
                  fontFamily: Z.font,
                  fontSize: 14,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label={`Monto en Bs. ${rateType === 'hora' ? '(por hora)' : '(por proyecto estimado)'}`}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ej. 150"
          min="0"
          style={inputStyle}
        />
      </Field>

      <Field label="Ciudad donde trabajas">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onBlur={() => setTouched(true)}
          style={{
            ...inputStyle,
            appearance: 'none',
            cursor: 'pointer',
            color: city ? Z.text : Z.textMuted,
            borderColor: cityError ? Z.error : Z.border,
          }}
        >
          <option value="">Selecciona tu ciudad</option>
          {CIUDADES_ACTIVAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {cityError && (
          <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{cityError}</span>
        )}
      </Field>

      <button
        onClick={handleNext}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Continuar
      </button>
    </div>
  )
}

// ─── Step 3: Disponibilidad ────────────────────────────────────────────────────

function Step3Disponibilidad({ onFinish }: { onFinish: (available: boolean) => void }) {
  const [available, setAvailable] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
          Tu disponibilidad
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginTop: 4 }}>
          Puedes cambiar esto en cualquier momento desde tu perfil.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setAvailable((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px',
          borderRadius: Z.r.md,
          border: `1.5px solid ${available ? Z.orange : Z.border}`,
          background: available ? Z.orangeLight : Z.surface,
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>
            Estoy disponible para trabajos
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>
            {available ? 'Los constructores podran encontrarte.' : 'No apareceran en busquedas por ahora.'}
          </div>
        </div>

        {/* Toggle visual */}
        <div
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: available ? Z.orange : Z.divider,
            position: 'relative',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: available ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              transition: 'left 0.2s',
            }}
          />
        </div>
      </button>

      <button
        onClick={() => onFinish(available)}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          marginTop: 8,
        }}
      >
        Empezar a trabajar
      </button>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function MaestroOnboardingWizard({ onComplete }: WizardProps) {
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState<WizardStep>(1)

  // Accumulated data across steps
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)

  function handleStep1(data: Step1Data) {
    setStep1Data(data)
    setStep(2)
  }

  function handleStep2(data: Step2Data) {
    setStep2Data(data)
    setStep(3)
  }

  async function handleFinish(available: boolean) {
    if (!user) { onComplete(); return }

    const updates: Record<string, unknown> = {
      is_available: available,
      onboarding_complete: true,
      onboarding_completed: true,
    }

    if (step1Data) {
      updates.specialty = step1Data.especialidades.join(', ')
      const exp = parseInt(step1Data.experiencia, 10)
      if (!isNaN(exp) && exp >= 0) updates.years_experience = exp
    }

    if (step2Data) {
      const amt = parseFloat(step2Data.rateAmount)
      updates.rate_type = step2Data.rateType
      if (!isNaN(amt) && amt > 0) updates.hourly_rate = amt
    }

    // Persist user_roles update
    await supabase
      .from('user_roles')
      .update(updates)
      .eq('user_id', user.user_id)
      .eq('role', 'maestro')

    // Update city in profiles if provided
    if (step2Data?.city) {
      await supabase
        .from('profiles')
        .update({ city: step2Data.city })
        .eq('user_id', user.user_id)
    }

    onComplete()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: Z.bg,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '48px 24px 16px',
          background: `linear-gradient(180deg, ${Z.orangeLight} 0%, ${Z.bg} 100%)`,
        }}
      >
        <p style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>
          Paso {step} de 3
        </p>
        <StepDots current={step} total={3} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 32px' }}>
        {step === 1 && <Step1Especialidad onNext={handleStep1} />}
        {step === 2 && (
          <Step2Tarifa
            initialCity={user?.city ?? null}
            onNext={handleStep2}
          />
        )}
        {step === 3 && <Step3Disponibilidad onFinish={handleFinish} />}
      </div>
    </div>
  )
}

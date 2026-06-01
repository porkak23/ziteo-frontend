/**
 * MaestroOnboardingWizard — Wizard de primer login para Maestros.
 *
 * Aparece cuando onboarding_complete = false en user_roles para el rol maestro.
 * 3 pasos: Especialidad, Tarifa, Disponibilidad.
 * Al completar o saltar todo: marca onboarding_complete = true.
 */
import { useState, useEffect } from 'react'
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

function Step1Especialidad({
  initialSelected,
  initialExperiencia,
  onNext,
  saving,
}: {
  initialSelected: Especialidad[]
  initialExperiencia: string
  onNext: (data: Step1Data) => void
  saving?: boolean
}) {
  const [selected, setSelected] = useState<Especialidad[]>(initialSelected)
  const [experiencia, setExperiencia] = useState(initialExperiencia)
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
        disabled={saving}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: saving ? 'default' : 'pointer',
          width: '100%',
          opacity: saving ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {saving ? 'Guardando...' : 'Continuar'}
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
  initialRateType,
  initialAmount,
  initialCity,
  onNext,
  saving,
}: {
  initialRateType: RateTipo
  initialAmount: string
  initialCity: string | null
  onNext: (data: Step2Data) => void
  saving?: boolean
}) {
  const [rateType, setRateType] = useState<RateTipo>(initialRateType)
  const [amount, setAmount] = useState(initialAmount)
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
        disabled={saving}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: saving ? 'default' : 'pointer',
          width: '100%',
          opacity: saving ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {saving ? 'Guardando...' : 'Continuar'}
      </button>
    </div>
  )
}

// ─── Step 3: Disponibilidad ────────────────────────────────────────────────────

function Step3Disponibilidad({
  initialAvailable,
  onFinish,
  saving,
}: {
  initialAvailable: boolean
  onFinish: (available: boolean) => void
  saving?: boolean
}) {
  const [available, setAvailable] = useState(initialAvailable)

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
        disabled={saving}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: saving ? 'default' : 'pointer',
          width: '100%',
          marginTop: 8,
          opacity: saving ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {saving ? 'Guardando...' : 'Empezar a trabajar'}
      </button>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function MaestroOnboardingWizard({ onComplete }: WizardProps) {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [step, setStep] = useState<WizardStep>(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Accumulated state loaded from DB
  const [specialties, setSpecialties] = useState<Especialidad[]>([])
  const [experience, setExperience] = useState('')
  const [rateType, setRateType] = useState<RateTipo>('hora')
  const [rateAmount, setRateAmount] = useState('')
  const [city, setCity] = useState('')
  const [available, setAvailable] = useState(true)

  // Fetch current database values to pre-fill wizard
  useEffect(() => {
    if (!user) return
    let cancelled = false

    Promise.all([
      supabase
        .from('user_roles')
        .select('specialty, years_experience, hourly_rate, is_available')
        .eq('user_id', user.user_id)
        .eq('role', 'maestro')
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('city')
        .eq('user_id', user.user_id)
        .maybeSingle()
    ]).then(([roleRes, profileRes]) => {
      if (cancelled) return

      if (roleRes.data) {
        const rData = roleRes.data
        if (rData.specialty) {
          const parsed = rData.specialty
            .split(', ')
            .filter((x: string) => (ESPECIALIDADES as readonly string[]).includes(x)) as Especialidad[]
          setSpecialties(parsed)
        }
        if (rData.years_experience != null) {
          setExperience(String(rData.years_experience))
        }
        if (rData.hourly_rate != null) {
          setRateAmount(String(rData.hourly_rate))
        }
        if (rData.is_available != null) {
          setAvailable(rData.is_available)
        }
      }

      if (profileRes.data?.city) {
        setCity(profileRes.data.city)
      }

      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [user])

  async function handleStep1(data: Step1Data) {
    setSpecialties(data.especialidades)
    setExperience(data.experiencia)
    if (!user) { setStep(2); return }

    setSaving(true)
    try {
      const updates: Record<string, unknown> = {
        specialty: data.especialidades.join(', '),
      }
      const exp = parseInt(data.experiencia, 10)
      if (!isNaN(exp) && exp >= 0) {
        updates.years_experience = exp
      } else {
        updates.years_experience = null
      }

      await supabase
        .from('user_roles')
        .update(updates)
        .eq('user_id', user.user_id)
        .eq('role', 'maestro')

      setStep(2)
    } catch (err) {
      console.error('Error saving step 1:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleStep2(data: Step2Data) {
    setRateType(data.rateType)
    setRateAmount(data.rateAmount)
    setCity(data.city)
    if (!user) { setStep(3); return }

    setSaving(true)
    try {
      const updates: Record<string, unknown> = {
        rate_type: data.rateType,
      }
      const amt = parseFloat(data.rateAmount)
      if (!isNaN(amt) && amt > 0) {
        updates.hourly_rate = amt
      } else {
        updates.hourly_rate = null
      }

      await supabase
        .from('user_roles')
        .update(updates)
        .eq('user_id', user.user_id)
        .eq('role', 'maestro')

      if (data.city) {
        await supabase
          .from('profiles')
          .update({ city: data.city })
          .eq('user_id', user.user_id)

        if (data.city !== user.city) {
          setUser({ ...user, city: data.city })
        }
      }

      setStep(3)
    } catch (err) {
      console.error('Error saving step 2:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleFinish(isAvailable: boolean) {
    setAvailable(isAvailable)
    if (!user) { onComplete(); return }

    setSaving(true)
    try {
      await supabase
        .from('user_roles')
        .update({
          is_available: isAvailable,
          onboarding_complete: true,
          onboarding_completed: true,
        })
        .eq('user_id', user.user_id)
        .eq('role', 'maestro')

      onComplete()
    } catch (err) {
      console.error('Error completing onboarding:', err)
    } finally {
      setSaving(false)
    }
  }

  async function finish() {
    if (user) {
      setSaving(true)
      try {
        await supabase
          .from('user_roles')
          .update({ onboarding_complete: true, onboarding_completed: true })
          .eq('user_id', user.user_id)
          .eq('role', 'maestro')
      } catch (err) {
        console.error('Error skipping onboarding:', err)
      } finally {
        setSaving(false)
      }
    }
    onComplete()
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: Z.bg, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: Z.font, fontSize: 15, color: Z.textSec }}>Cargando primeros pasos...</span>
      </div>
    )
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Paso {step} de 3
          </p>
          <button
            onClick={finish}
            disabled={saving}
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              fontWeight: 700,
              color: Z.textSec,
              background: 'transparent',
              border: 'none',
              cursor: saving ? 'default' : 'pointer',
              padding: '4px 6px',
              margin: '-4px -6px',
              opacity: saving ? 0.5 : 1,
            }}
          >
            Saltar
          </button>
        </div>
        <StepDots current={step} total={3} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 32px' }}>
        {step === 1 && (
          <Step1Especialidad
            initialSelected={specialties}
            initialExperiencia={experience}
            onNext={handleStep1}
            saving={saving}
          />
        )}
        {step === 2 && (
          <Step2Tarifa
            initialRateType={rateType}
            initialAmount={rateAmount}
            initialCity={city || user?.city || null}
            onNext={handleStep2}
            saving={saving}
          />
        )}
        {step === 3 && (
          <Step3Disponibilidad
            initialAvailable={available}
            onFinish={handleFinish}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

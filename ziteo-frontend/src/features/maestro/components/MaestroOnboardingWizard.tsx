/**
 * MaestroOnboardingWizard — Wizard de primer login para Maestros.
 * Rediseñado con estética premium, glassmorphism y micro-interacciones.
 */
import { useState, useEffect, useId } from 'react'
import React from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { CIUDADES_ACTIVAS } from '../../../shared/constants/geography'
import { Z } from '../../../shared/design/tokens'
import { SKILLS_DISPONIBLES } from '../hooks/useHabilidades'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardProps {
  onComplete: () => void
}

type WizardStep = 1 | 2 | 3

type RateTipo = 'hora' | 'proyecto'

// ─── Step progress bar ─────────────────────────────────────────────────────────

function StepProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 800, color: Z.orange, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Paso {current} de {total}
        </span>
        <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted }}>
          {Math.round(percentage)}% Completado
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: Z.gradOrange,
            borderRadius: 3,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}

// ─── Shared field primitive ───────────────────────────────────────────────────

const FORM_CONTROLS = ['input', 'select', 'textarea']

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string | null }) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  const isFormControl = React.isValidElement(children) && typeof children.type === 'string' && FORM_CONTROLS.includes(children.type)
  const childWithId = isFormControl
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id,
        'aria-describedby': errorId ?? undefined,
        'aria-invalid': error ? true : undefined,
      })
    : children

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <label
        htmlFor={isFormControl ? id : undefined}
        style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textSec, textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        {label}
      </label>
      {childWithId}
      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>warning</span>
          {error}
        </span>
      )}
    </div>
  )
}

const baseInputStyle: React.CSSProperties = {
  fontFamily: Z.font,
  fontSize: 15,
  fontWeight: 500,
  color: Z.text,
  padding: '14px 16px',
  borderRadius: 14,
  border: '1.5px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(255, 255, 255, 0.03)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
}

// ─── Step 1: Especialidad ─────────────────────────────────────────────────────

interface Step1Data {
  title: string
  skills: string[]
  experiencia: string
}

function Step1Especialidad({
  initialTitle,
  initialSelected,
  initialExperiencia,
  onNext,
  saving,
}: {
  initialTitle: string
  initialSelected: string[]
  initialExperiencia: string
  onNext: (data: Step1Data) => void
  saving?: boolean
}) {
  const [title, setTitle] = useState(initialTitle)
  const [selected, setSelected] = useState<string[]>(initialSelected)
  const [experiencia, setExperiencia] = useState(initialExperiencia)
  const [touched, setTouched] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const titleError = touched && !title.trim() ? 'Ingresa tu título o maestría' : null
  const selError = touched && selected.length === 0 ? 'Selecciona al menos una habilidad' : null

  function toggleEsp(s: string) {
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function handleNext() {
    setTouched(true)
    if (!title.trim() || selected.length === 0) return
    onNext({ title, skills: selected, experiencia })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 24, fontWeight: 800, color: Z.text, margin: 0, letterSpacing: '-0.02em' }}>
          Tu maestría y habilidades
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, marginTop: 6, lineHeight: 1.5 }}>
          Indica tu especialidad general y las habilidades específicas para que te contraten.
        </p>
      </div>

      <Field label="Título profesional o Maestría" error={titleError}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); setTouched(true) }}
          placeholder="Ej. Maestro Albañil, Contratista"
          style={{
            ...baseInputStyle,
            borderColor: titleError ? Z.error : (isFocused ? Z.orange : 'rgba(255, 255, 255, 0.08)'),
            boxShadow: isFocused ? '0 0 10px rgba(255, 90, 31, 0.15)' : 'none',
            background: isFocused ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.03)'
          }}
        />
      </Field>

      <Field label="Tus habilidades específicas" error={selError}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {SKILLS_DISPONIBLES.map((s) => {
            const isSelected = selected.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleEsp(s)}
                style={{
                  padding: '9px 16px',
                  borderRadius: Z.r.full,
                  border: isSelected ? `2.5px solid ${Z.orange}` : '1.5px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(255, 90, 31, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? Z.text : Z.textSec,
                  fontFamily: Z.font,
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? '0 4px 12px rgba(255, 90, 31, 0.2)' : 'none',
                  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Años de experiencia (opcional)">
        <input
          type="number"
          value={experiencia}
          onChange={(e) => setExperiencia(e.target.value)}
          placeholder="Ej. 5"
          min="0"
          max="60"
          style={baseInputStyle}
        />
      </Field>

      <button
        onClick={handleNext}
        disabled={saving}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '16px 24px',
          borderRadius: 16,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: saving ? 'default' : 'pointer',
          width: '100%',
          opacity: saving ? 0.7 : 1,
          boxShadow: '0 8px 24px rgba(255, 90, 31, 0.25)',
          transition: 'all 0.3s ease',
          marginTop: 8,
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
  const [isCityFocused, setIsCityFocused] = useState(false)

  const cityError = touched && !city ? 'Selecciona tu ciudad de trabajo' : null

  function handleNext() {
    setTouched(true)
    if (!city) return
    onNext({ rateType, rateAmount: amount, city })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 24, fontWeight: 800, color: Z.text, margin: 0, letterSpacing: '-0.02em' }}>
          Tu tarifa y ubicación
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, marginTop: 6, lineHeight: 1.5 }}>
          Indica cómo cobras y dónde trabajas para que los constructores puedan encontrarte.
        </p>
      </div>

      <Field label="Tipo de tarifa">
        <div style={{ display: 'flex', gap: 12 }}>
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
                  padding: '16px 8px',
                  borderRadius: 14,
                  border: isSelected ? `2.5px solid ${Z.orange}` : '1.5px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(255, 90, 31, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? Z.text : Z.textSec,
                  fontFamily: Z.font,
                  fontSize: 14,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(255, 90, 31, 0.15)' : 'none',
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
          style={baseInputStyle}
        />
      </Field>

      <Field label="Ciudad donde trabajas" error={cityError}>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onFocus={() => setIsCityFocused(true)}
          onBlur={() => { setIsCityFocused(false); setTouched(true) }}
          style={{
            ...baseInputStyle,
            appearance: 'none',
            cursor: 'pointer',
            color: city ? Z.text : Z.textMuted,
            borderColor: cityError ? Z.error : (isCityFocused ? Z.orange : 'rgba(255, 255, 255, 0.08)'),
            background: isCityFocused ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.03)'
          }}
        >
          <option value="" style={{ background: '#121214' }}>Selecciona tu ciudad</option>
          {CIUDADES_ACTIVAS.map((c) => (
            <option key={c} value={c} style={{ background: '#121214', color: '#fff' }}>{c}</option>
          ))}
        </select>
      </Field>

      <button
        onClick={handleNext}
        disabled={saving}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '16px 24px',
          borderRadius: 16,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: saving ? 'default' : 'pointer',
          width: '100%',
          opacity: saving ? 0.7 : 1,
          boxShadow: '0 8px 24px rgba(255, 90, 31, 0.25)',
          transition: 'all 0.3s ease',
          marginTop: 8,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 24, fontWeight: 800, color: Z.text, margin: 0, letterSpacing: '-0.02em' }}>
          Tu disponibilidad
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, marginTop: 6, lineHeight: 1.5 }}>
          Puedes cambiar esto en cualquier momento desde tu perfil de trabajador.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setAvailable((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 22px',
          borderRadius: 18,
          border: `2px solid ${available ? Z.orange : 'rgba(255, 255, 255, 0.08)'}`,
          background: available ? 'rgba(255, 90, 31, 0.08)' : 'rgba(255, 255, 255, 0.02)',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: available ? '0 8px 28px rgba(255, 90, 31, 0.12)' : 'none',
        }}
      >
        <div style={{ paddingRight: 12 }}>
          <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 700, color: Z.text }}>
            Estoy disponible para trabajos
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginTop: 4, lineHeight: 1.4 }}>
            {available ? 'Los constructores podrán encontrarte en las búsquedas.' : 'No aparecerás en las búsquedas por ahora.'}
          </div>
        </div>

        {/* Toggle visual */}
        <div
          style={{
            width: 48,
            height: 26,
            borderRadius: 13,
            background: available ? Z.orange : 'rgba(255, 255, 255, 0.15)',
            position: 'relative',
            flexShrink: 0,
            transition: 'background 0.25s',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: available ? 25 : 3,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
          padding: '16px 24px',
          borderRadius: 16,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: saving ? 'default' : 'pointer',
          width: '100%',
          opacity: saving ? 0.7 : 1,
          boxShadow: '0 8px 24px rgba(255, 90, 31, 0.25)',
          transition: 'all 0.3s ease',
          marginTop: 8,
        }}
      >
        {saving ? 'Guardando...' : 'Empezar a trabajar'}
      </button>
    </div>
  )
}

export function MaestroOnboardingWizard({ onComplete }: WizardProps) {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [step, setStep] = useState<WizardStep>(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toasts, showToast, removeToast } = useToast()

  // Accumulated state loaded from DB
  const [title, setTitle] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
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
        .maybeSingle(),
      supabase
        .from('maestro_habilidades')
        .select('skill')
        .eq('maestro_id', user.user_id)
    ]).then(([roleRes, profileRes, skillsRes]) => {
      if (cancelled) return

      if (roleRes.data) {
        const rData = roleRes.data
        if (rData.specialty) {
          setTitle(rData.specialty)
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

      if (skillsRes.data) {
        setSelectedSkills(skillsRes.data.map(h => h.skill))
      }

      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [user])

  async function handleStep1(data: Step1Data) {
    setTitle(data.title)
    setSelectedSkills(data.skills)
    setExperience(data.experiencia)
    if (!user) { setStep(2); return }

    setSaving(true)
    try {
      const exp = parseInt(data.experiencia, 10)

      // 1. Guardar en user_roles usando upsert
      const { error: roleErr } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.user_id,
          role: 'maestro',
          specialty: data.title,
          years_experience: !isNaN(exp) && exp >= 0 ? exp : null
        }, { onConflict: 'user_id,role' })
      if (roleErr) throw roleErr

      // 2. Sincronizar en maestro_profiles
      const { error: profileErr } = await supabase
        .from('maestro_profiles')
        .upsert({
          user_id: user.user_id,
          specialties: data.skills,
          experience_years: !isNaN(exp) && exp >= 0 ? exp : null,
          rate_amount: 0
        }, { onConflict: 'user_id' })
      if (profileErr) throw profileErr

      // 3. Sincronizar tabla maestro_habilidades
      await supabase
        .from('maestro_habilidades')
        .delete()
        .eq('maestro_id', user.user_id)

      if (data.skills.length > 0) {
        const inserts = data.skills.map((s) => ({
          maestro_id: user.user_id,
          skill: s,
          porcentaje: 100,
        }))
        const { error: skillsErr } = await supabase
          .from('maestro_habilidades')
          .insert(inserts)
        if (skillsErr) throw skillsErr
      }

      setStep(2)
    } catch (err: unknown) {
      console.error('Error saving step 1:', err)
      const msg = err instanceof Error ? err.message : 'Error al guardar el paso 1'
      showToast(msg, 'error')
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

      // 1. Guardar en user_roles usando upsert
      const { error: roleErr } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.user_id,
          role: 'maestro',
          ...updates
        }, { onConflict: 'user_id,role' })
      if (roleErr) throw roleErr

      // 2. Sincronizar en maestro_profiles
      const { error: profileErr } = await supabase
        .from('maestro_profiles')
        .upsert({
          user_id: user.user_id,
          rate_type: data.rateType,
          rate_amount: !isNaN(amt) && amt > 0 ? amt : 0
        }, { onConflict: 'user_id' })
      if (profileErr) throw profileErr

      if (data.city) {
        const { error: cityErr } = await supabase
          .from('profiles')
          .update({ city: data.city })
          .eq('user_id', user.user_id)
        if (cityErr) throw cityErr

        if (data.city !== user.city) {
          setUser({ ...user, city: data.city })
        }
      }

      setStep(3)
    } catch (err: unknown) {
      console.error('Error saving step 2:', err)
      const msg = err instanceof Error ? err.message : 'Error al guardar el paso 2'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleFinish(isAvailable: boolean) {
    setAvailable(isAvailable)
    if (!user) { onComplete(); return }

    setSaving(true)
    try {
      // 1. Guardar en user_roles usando upsert
      const { error: roleErr } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.user_id,
          role: 'maestro',
          is_available: isAvailable,
          onboarding_complete: true,
          onboarding_completed: true,
        }, { onConflict: 'user_id,role' })
      if (roleErr) throw roleErr

      // 2. Sincronizar en maestro_profiles
      const { error: profileErr } = await supabase
        .from('maestro_profiles')
        .upsert({
          user_id: user.user_id,
          available: isAvailable,
          rate_amount: 0,
        }, { onConflict: 'user_id' })
      if (profileErr) throw profileErr

      onComplete()
    } catch (err: unknown) {
      console.error('Error completing onboarding:', err)
      const msg = err instanceof Error ? err.message : 'Error al finalizar el registro'
      showToast(msg, 'error')
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
          .upsert({
            user_id: user.user_id,
            role: 'maestro',
            onboarding_complete: true,
            onboarding_completed: true
          }, { onConflict: 'user_id,role' })
      } catch (err: unknown) {
        console.error('Error skipping onboarding:', err)
        const msg = err instanceof Error ? err.message : 'Error al saltar el registro'
        showToast(msg, 'error')
      } finally {
        setSaving(false)
      }
    }
    onComplete()
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0D0E12', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 600, color: Z.textSec, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, border: `2.5px solid ${Z.orange}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Cargando primeros pasos...
        </span>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 50% -20%, rgba(255, 90, 31, 0.12) 0%, #08080A 100%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Toast toasts={toasts} onRemove={removeToast} />
      {/* Top Header bar */}
      <div
        style={{
          padding: '24px 24px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 900, color: Z.orange, letterSpacing: '0.05em' }}>
          ZITEO
        </span>
        <button
          onClick={finish}
          disabled={saving}
          style={{
            fontFamily: Z.font,
            fontSize: 13,
            fontWeight: 700,
            color: Z.textSec,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            cursor: saving ? 'default' : 'pointer',
            padding: '8px 16px',
            opacity: saving ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          Saltar
        </button>
      </div>

      {/* Main card container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div
          style={{
            background: 'rgba(20, 20, 25, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 24,
            padding: '24px 24px 32px',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6), 0 0 60px rgba(255, 90, 31, 0.02)',
            width: '100%',
            maxWidth: 480,
            boxSizing: 'border-box',
          }}
        >
          <StepProgressBar current={step} total={3} />

          {/* Render Active Step with nice transition styling */}
          <div style={{ animation: 'fadeIn 0.35s ease' }}>
            {step === 1 && (
              <Step1Especialidad
                initialTitle={title}
                initialSelected={selectedSkills}
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
      </div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}} />
    </div>
  )
}

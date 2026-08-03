import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../store/authStore'

/**
 * Full-screen modal shown once per user after first login/onboarding.
 * Saves beta_acknowledged_at to profiles when the user confirms.
 */
export function BetaAcknowledgment() {
  const user = useAuthStore((s) => s.user)
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null) // null = loading
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    async function fetchAck() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('beta_acknowledged_at')
          .eq('user_id', user!.user_id)
          .maybeSingle()
        setAcknowledged(!!data?.beta_acknowledged_at)
      } catch {
        // On error, don't block the user — assume already acknowledged
        setAcknowledged(true)
      }
    }

    void fetchAck()
  }, [user])

  async function handleContinue() {
    if (!user || !checked) return
    setSaving(true)
    try {
      await supabase
        .from('profiles')
        .update({ beta_acknowledged_at: new Date().toISOString() })
        .eq('user_id', user.user_id)
      setAcknowledged(true)
    } catch {
      // best-effort: don't block user if update fails
      setAcknowledged(true)
    } finally {
      setSaving(false)
    }
  }

  // Not authenticated, or loading, or already acknowledged
  if (!user || acknowledged === null || acknowledged === true) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="beta-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface flex flex-col gap-5 p-6"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
      >
        <div className="flex flex-col gap-2">
          <h2
            id="beta-title"
            className="text-on-surface font-bold text-lg"
          >
            Bienvenido a Ziteoo Beta
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Estás usando una versión beta de Ziteoo. Algunas funciones pueden comportarse de manera inesperada. Tus datos están protegidos según nuestra Política de Privacidad.
          </p>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Si encuentras un problema, usa el botón "Reportar problema" en cualquier pantalla.
          </p>
        </div>

        {/* El onClick vive en el <label>, no en el div: un <label> solo activa
            controles nativos, y este "checkbox" es un div con role. Con el
            handler adentro, tocar el texto no hacía nada y había que acertarle
            al cuadro de 20px — el usuario quedaba atrapado en el modal. */}
        <label
          className="flex items-start gap-3 cursor-pointer select-none -m-2 p-2"
          onClick={() => setChecked((v) => !v)}
        >
          <div
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                setChecked((v) => !v)
              }
            }}
            className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
            style={{
              borderColor: checked ? 'var(--color-primary, #A43700)' : 'var(--color-outline, #94A3B8)',
              background: checked ? 'var(--color-primary, #A43700)' : 'transparent',
            }}
          >
            {checked && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="text-sm text-on-surface-variant leading-relaxed">
            Entiendo que esta es una versión beta
          </span>
        </label>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!checked || saving}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-on-primary transition-opacity disabled:opacity-40"
          style={{ background: 'var(--color-primary, #A43700)' }}
        >
          {saving ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}

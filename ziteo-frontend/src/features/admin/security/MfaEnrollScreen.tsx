import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Z } from '@/shared/design/tokens'
import { supabase } from '@/lib/supabaseClient'

// Enrollment TOTP para el panel admin. Único lugar de la app que usa MFA —
// las escrituras admin (reset de PIN de usuarios, gestión de roles) exigen
// aal2 vía is_admin_mfa() en Postgres (20260801000002_admin_role_hardening.sql).
// El panel se ve completo sin esto (aal1 alcanza para lectura); este flujo
// solo habilita los botones de escritura.
export function MfaEnrollScreen({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<'start' | 'scan' | 'error'>('start')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleStartEnroll() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Ziteoo Admin',
      })
      if (enrollError) throw enrollError
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setStep('scan')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el enrolamiento.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!factorId || code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      })
      if (verifyError) throw verifyError

      await queryClient.invalidateQueries({ queryKey: ['admin', 'is-admin'] })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: Z.bg, padding: 24, gap: 20 }}>
      <div style={{ maxWidth: 360, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
        <span style={{ color: Z.text, fontSize: 18, fontWeight: 700 }}>Verificación en dos pasos</span>

        {step === 'start' && (
          <>
            <span style={{ color: Z.textMuted, fontSize: 14 }}>
              Para resetear PINs o modificar usuarios necesitas activar un segundo factor con
              una app como Google Authenticator o Authy.
            </span>
            <button
              type="button"
              onClick={handleStartEnroll}
              disabled={loading}
              style={{
                padding: '10px 20px', borderRadius: 12, background: Z.orangeDark, color: '#fff',
                fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Generando código…' : 'Activar verificación'}
            </button>
            <button type="button" onClick={onDone} style={{ background: 'none', border: 'none', color: Z.textMuted, fontSize: 13, cursor: 'pointer' }}>
              Ahora no (solo lectura)
            </button>
          </>
        )}

        {step === 'scan' && qrCode && (
          <>
            <span style={{ color: Z.textMuted, fontSize: 14 }}>
              Escanea este código con tu app de autenticación, o ingresa la clave manualmente.
            </span>
            <img src={qrCode} alt="Código QR de verificación en dos pasos" width={200} height={200} style={{ borderRadius: 12, background: '#fff', padding: 8 }} />
            {secret && (
              <code style={{ fontSize: 12, color: Z.textMuted, wordBreak: 'break-all', background: Z.surface, padding: '6px 10px', borderRadius: 8 }}>
                {secret}
              </code>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${Z.border}`,
                fontSize: 20, textAlign: 'center', letterSpacing: 6, background: Z.surface, color: Z.text,
              }}
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              style={{
                padding: '10px 20px', borderRadius: 12, background: Z.orangeDark, color: '#fff',
                fontSize: 14, fontWeight: 600, border: 'none', width: '100%',
                cursor: loading || code.length !== 6 ? 'default' : 'pointer',
                opacity: loading || code.length !== 6 ? 0.6 : 1,
              }}
            >
              {loading ? 'Verificando…' : 'Confirmar'}
            </button>
          </>
        )}

        {step === 'error' && (
          <button type="button" onClick={handleStartEnroll} style={{ padding: '10px 20px', borderRadius: 12, background: Z.orangeDark, color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Reintentar
          </button>
        )}

        {error && <span style={{ color: Z.error, fontSize: 13 }}>{error}</span>}
      </div>
    </div>
  )
}

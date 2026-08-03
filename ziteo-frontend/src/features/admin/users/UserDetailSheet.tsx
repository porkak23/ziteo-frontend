import { useState } from 'react'
import { Z } from '@/shared/design/tokens'
import type { AdminUserRow } from '@/features/admin/hooks/useAdminUsers'
import { useResetUserPin } from '@/features/admin/hooks/useAdminUsers'

interface UserDetailSheetProps {
  user: AdminUserRow
  onClose: () => void
}

// El paso de verificación de identidad (docs/RESET_PIN_ADMIN.md paso 1: llamar
// al número registrado, no confiar solo en lo que se ve en pantalla) no se
// puede automatizar — es un check manual que el admin confirma antes de que
// el botón de reset se habilite. Recuerda por qué existe en vez de solo
// exigirlo.
export function UserDetailSheet({ user, onClose }: UserDetailSheetProps) {
  const [identityVerified, setIdentityVerified] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [resetPin, setResetPin] = useState<{ pin: string } | null>(null)
  const resetMutation = useResetUserPin()

  function generatePin(): string {
    return String(Math.floor(100000 + Math.random() * 900000))
  }

  function handleResetClick() {
    setNewPin(generatePin())
  }

  function handleConfirmReset() {
    if (newPin.length !== 6) return
    resetMutation.mutate(
      { targetUserId: user.user_id, newPin },
      { onSuccess: () => setResetPin({ pin: newPin }) }
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        background: Z.surface,
        borderTop: `1px solid ${Z.border}`,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        maxHeight: '70%',
        overflowY: 'auto',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: Z.text }}>{user.name}</div>
          <div style={{ fontSize: 12, color: Z.textMuted, marginTop: 2 }}>
            {user.phone} · {user.city ?? 'Sin ciudad'} · {user.active_role}
          </div>
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: Z.textMuted, fontSize: 14, cursor: 'pointer' }}>
          Cerrar
        </button>
      </div>

      {resetPin ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: Z.text }}>
            PIN reseteado. Comunícalo por el mismo canal que verificaste (nunca por escrito público):
          </div>
          <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: Z.orangeDark, background: Z.orangeLight, padding: '10px 16px', borderRadius: 8, textAlign: 'center' }}>
            {resetPin.pin}
          </code>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: Z.text, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={identityVerified}
              onChange={(e) => setIdentityVerified(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              Verifiqué la identidad de {user.name} por un canal fuera de la app
              (llamada al {user.phone}) antes de resetear su PIN.
            </span>
          </label>

          {newPin && (
            <div style={{ fontSize: 13, color: Z.textMuted }}>
              Nuevo PIN generado: <strong style={{ color: Z.text }}>{newPin}</strong>
            </div>
          )}

          {resetMutation.isError && (
            <span style={{ fontSize: 13, color: Z.error }}>
              {resetMutation.error instanceof Error && resetMutation.error.message.includes('FORBIDDEN')
                ? 'Necesitas verificación en dos pasos activa para esta acción.'
                : 'No se pudo resetear el PIN. Intenta de nuevo.'}
            </span>
          )}

          {!newPin ? (
            <button
              type="button"
              disabled={!identityVerified}
              onClick={handleResetClick}
              style={{
                padding: '10px 20px', borderRadius: 12,
                background: identityVerified ? Z.orangeDark : Z.border,
                color: identityVerified ? '#fff' : Z.textMuted,
                fontSize: 14, fontWeight: 600, border: 'none',
                cursor: identityVerified ? 'pointer' : 'default',
              }}
            >
              Generar nuevo PIN
            </button>
          ) : (
            <button
              type="button"
              disabled={resetMutation.isPending}
              onClick={handleConfirmReset}
              style={{
                padding: '10px 20px', borderRadius: 12, background: Z.orangeDark, color: '#fff',
                fontSize: 14, fontWeight: 600, border: 'none',
                cursor: resetMutation.isPending ? 'default' : 'pointer',
                opacity: resetMutation.isPending ? 0.6 : 1,
              }}
            >
              {resetMutation.isPending ? 'Reseteando…' : 'Confirmar reset de PIN'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

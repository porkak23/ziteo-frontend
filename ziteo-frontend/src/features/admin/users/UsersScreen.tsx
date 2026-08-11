import { useEffect, useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers'
import { UserDetailSheet } from '@/features/admin/users/UserDetailSheet'

export function UsersScreen() {
  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: users = [], isLoading } = useAdminUsers(debouncedTerm)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(term), 300)
    return () => clearTimeout(id)
  }, [term])

  const selectedUser = users.find((u) => u.user_id === selectedId) ?? null

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 160px)' }}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${Z.border}`,
            fontSize: 14, background: Z.surface, color: Z.text,
          }}
        />

        {term.trim().length > 0 && term.trim().length < 2 && (
          <span style={{ fontSize: 12, color: Z.textMuted }}>Escribe al menos 2 caracteres.</span>
        )}

        {isLoading && <span style={{ fontSize: 13, color: Z.textMuted }}>Buscando…</span>}

        {!isLoading && debouncedTerm.trim().length >= 2 && users.length === 0 && (
          <span style={{ fontSize: 13, color: Z.textMuted }}>Sin resultados.</span>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map((user) => (
            <button
              key={user.user_id}
              onClick={() => setSelectedId(user.user_id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                padding: 12, borderRadius: 10, border: `1px solid ${Z.border}`, background: Z.surface,
                textAlign: 'left', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: Z.text }}>{user.name}</span>
              <span style={{ fontSize: 12, color: Z.textMuted }}>
                {user.phone} · {user.city ?? 'Sin ciudad'} · {user.active_role}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedUser && (
        <UserDetailSheet user={selectedUser} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}

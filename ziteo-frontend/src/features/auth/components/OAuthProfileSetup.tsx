import { useState } from 'react'
import { setupOAuthProfile, AuthServiceError } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../../../lib/supabaseClient'
import type { UserRole, OAuthUserData } from '../types/authTypes'
import { CIUDADES_ACTIVAS } from '../../../shared/constants/geography'

// TODO Fase 2: add "Solicitar cambio de rol" screen post-registro that calls RPC promote_user_role

interface Props {
  oauthUser: OAuthUserData
  onComplete: () => void
}

export default function OAuthProfileSetup({ oauthUser, onComplete }: Props) {
  const [name, setName]   = useState(oauthUser.name)
  const [city, setCity]   = useState('')
  const initialRole: UserRole = 'constructor'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setUser = useAuthStore((s) => s.setUser)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) { setError('Ingresa tu nombre completo'); return }
    if (!city) { setError('Selecciona tu ciudad'); return }
    setError(null)
    setLoading(true)
    try {
      await setupOAuthProfile(oauthUser.accessToken, { name: name.trim(), city, initial_role: initialRole })

      // Fetch the freshly created profile to build the authUser
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name, phone, city, active_role, avatar_url')
        .eq('user_id', oauthUser.userId)
        .single()

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', oauthUser.userId)

      if (profile) {
        setUser({
          user_id: oauthUser.userId,
          name: profile.name,
          phone: profile.phone ?? '',
          email: oauthUser.email,
          active_role: profile.active_role as UserRole,
          roles: rolesData?.map((r: { role: string }) => r.role as UserRole) ?? [initialRole],
          access_token: oauthUser.accessToken,
          refresh_token: oauthUser.refreshToken,
          avatar_url: oauthUser.avatarUrl ?? undefined,
          city: profile.city,
        })
      }
      onComplete()
    } catch (err) {
      const code = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      setError(code === 'PROFILE_ALREADY_EXISTS' ? 'Esta cuenta ya tiene un perfil.' : 'No se pudo crear el perfil. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh w-full flex flex-col bg-background overflow-y-auto">
      <div className="px-6 pt-14 pb-8">
        <p className="font-body text-[11px] text-on-surface-variant/45 font-medium tracking-[0.18em] uppercase mb-5">
          Última configuración
        </p>
        <h1 className="font-headline font-black text-[42px] text-on-surface leading-[0.94] tracking-[-0.03em]">
          Completa<br />tu perfil.
        </h1>
        <p className="font-body text-sm text-on-surface-variant/60 mt-3">
          Cuéntanos cómo participas en el sector
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 pb-10 max-w-sm mx-auto w-full">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="oauth-name" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
            Nombre completo
          </label>
          <input
            id="oauth-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Alejandro Mendoza"
            required
            className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>

        {/* City */}
        <div className="flex flex-col gap-2">
          <label htmlFor="oauth-city" className="font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
            Ciudad
          </label>
          <select
            id="oauth-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="px-4 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-body text-sm focus:outline-none focus:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none"
          >
            <option value="">Selecciona tu ciudad</option>
            {CIUDADES_ACTIVAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {error && (
          <div aria-live="polite">
            <span className="text-error text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-[18px] bg-primary text-on-primary font-label font-bold rounded-xl text-[15px] tracking-[-0.01em] transition-[transform,opacity] active:scale-[0.98] active:opacity-80 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Creando perfil...' : 'Entrar a Ziteo →'}
        </button>
      </form>
    </main>
  )
}

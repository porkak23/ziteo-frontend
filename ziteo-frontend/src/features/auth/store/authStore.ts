import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setUser as sentrySetUser } from '../../../lib/sentryClient'
import { identifyUser, resetUser as analyticsResetUser } from '../../../lib/analytics'

export type UserRole = 'constructor' | 'proveedor' | 'maestro' | 'chofer'

export interface AuthUser {
  user_id: string
  name: string
  phone: string
  email?: string
  active_role: UserRole
  roles: UserRole[]
  access_token: string
  refresh_token: string
  avatar_url?: string
  city: string | null
}

interface AuthStore {
  user: AuthUser | null
  setUser: (user: AuthUser) => void
  setActiveRole: (role: UserRole) => void
  addRole: (role: UserRole) => void
  removeRole: (role: UserRole) => void
  logout: () => void
  clearSession: () => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user) => {
        // Attach identity to Sentry for error attribution.
        // Only non-sensitive fields: id and display name — no phone, no tokens.
        sentrySetUser({ id: user.user_id, username: user.name })
        // Identify in PostHog — only user_id and role, no PII
        identifyUser(user.user_id, user.active_role)
        set({ user })
      },

      setActiveRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, active_role: role } : null,
        })),

      addRole: (role) =>
        set((state) => {
          if (!state.user) return state
          if (state.user.roles.includes(role)) return state
          return { user: { ...state.user, roles: [...state.user.roles, role] } }
        }),

      removeRole: (role) =>
        set((state) => {
          if (!state.user) return state
          const newRoles = state.user.roles.filter((r) => r !== role)
          const activeRole = state.user.active_role === role ? newRoles[0] || 'constructor' : state.user.active_role
          return { user: { ...state.user, roles: newRoles, active_role: activeRole } }
        }),

      logout: () => {
        sentrySetUser(null)
        analyticsResetUser()
        set({ user: null })
      },

      clearSession: () => {
        sentrySetUser(null)
        analyticsResetUser()
        set({ user: null })
      },

      updateTokens: (accessToken, refreshToken) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, access_token: accessToken, refresh_token: refreshToken }
            : null,
        })),

      isAuthenticated: () => get().user !== null,
    }),
    {
      name: 'ziteo-auth',
      // Supabase's own client already persists the session (incl. tokens) in
      // its own storage key with proper rotation handling. Don't duplicate
      // access_token/refresh_token here — it's a redundant copy that can
      // drift out of sync after a silent refresh and widens the blast radius
      // of an XSS-style token theft.
      partialize: (state) => ({
        user: state.user
          ? { ...state.user, access_token: '', refresh_token: '' }
          : null,
      }),
    }
  )
)

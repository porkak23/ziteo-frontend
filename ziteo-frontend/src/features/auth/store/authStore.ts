import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user) => set({ user }),

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

      logout: () => set({ user: null }),

      isAuthenticated: () => get().user !== null,
    }),
    { name: 'ziteo-auth' }
  )
)

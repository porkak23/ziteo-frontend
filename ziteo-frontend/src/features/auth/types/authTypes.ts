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

// Respuesta del backend en login y otp-verify
export interface AuthApiResponse {
  user_id: string
  name: string
  phone: string
  active_role: UserRole
  roles: UserRole[]
  access_token: string
  refresh_token: string
  avatar_url: string | null
  city: string | null
}

// Respuesta del backend en register (no devuelve sesión, requiere OTP)
export interface RegisterApiResponse {
  user_id: string
  phone: string
  requires_otp: true
  debug_otp?: string // solo en development
}

export interface SwitchRoleApiResponse {
  active_role: UserRole
  access_token: string
}

// Payloads de cada endpoint
export interface RegisterPayload {
  phone: string
  name: string
  email?: string
  city: string
  pin: string
  initial_role: UserRole
  plan?: string
  company_name?: string
  terms_accepted_at?: string
  waitlist?: boolean
}

export interface OAuthSetupPayload {
  name: string
  city: string
  initial_role: UserRole
}

export interface OAuthUserData {
  userId: string
  email: string
  name: string
  avatarUrl: string | null
  accessToken: string
  refreshToken: string
}

export interface LoginPayload {
  phone: string
  pin: string
}

export interface OtpVerifyPayload {
  phone: string
  otp: string
}

export interface SwitchRolePayload {
  new_role: UserRole
}

// Error de la API
export interface AuthError {
  error: string
  message?: string
}

// Filas de BD (para queries directas a Supabase)
export interface ProfileRow {
  user_id: string
  name: string
  phone: string
  city: string | null
  active_role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface UserRoleRow {
  id: string
  user_id: string
  role: UserRole
  onboarding_completed: boolean
  is_verified: boolean
}

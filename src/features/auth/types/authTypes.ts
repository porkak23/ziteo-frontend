// src/features/auth/types/authTypes.ts

// ─── Rol de usuario ────────────────────────────────────────────────────────────

export type UserRole = 'constructor' | 'proveedor' | 'maestro' | 'chofer';

// ─── Estado en Zustand ─────────────────────────────────────────────────────────

export interface AuthUser {
  user_id:      string;
  name:         string;
  phone:        string;
  active_role:  UserRole;
  roles:        UserRole[];
  access_token: string;
  avatar_url?:  string;
}

// ─── Respuestas del backend ────────────────────────────────────────────────────

/** Respuesta de POST /api/auth/login y POST /api/auth/otp/verify */
export interface AuthApiResponse {
  user_id:      string;
  name:         string;
  phone:        string;
  active_role:  UserRole;
  roles:        UserRole[];
  access_token: string;
  avatar_url?:  string;
}

/** Respuesta de POST /api/auth/register */
export interface RegisterApiResponse {
  user_id:      string;
  phone:        string;
  requires_otp: true;
}

/** Respuesta de PATCH /api/auth/switch-role */
export interface SwitchRoleApiResponse {
  active_role:  UserRole;
  access_token: string;
}

// ─── Payloads (request bodies) ─────────────────────────────────────────────────

export interface RegisterPayload {
  phone:        string;
  name:         string;
  city:         string;
  pin:          string;
  initial_role: UserRole;
}

export interface LoginPayload {
  phone: string;
  pin:   string;
}

export interface OtpVerifyPayload {
  phone: string;
  otp:   string;
}

export interface SwitchRolePayload {
  new_role: UserRole;
}

// ─── Errores de API ────────────────────────────────────────────────────────────

export interface AuthError {
  error:    string;
  message?: string;
}

// ─── Modelo de base de datos (Supabase) ───────────────────────────────────────

/** Fila de la tabla `profiles` */
export interface ProfileRow {
  user_id:     string;
  name:        string;
  phone:       string;
  city:        string | null;
  active_role: UserRole | null;
  avatar_url:  string | null;
  created_at:  string; // ISO 8601
}

/** Fila de la tabla `user_roles` */
export interface UserRoleRow {
  user_id:              string;
  role:                 UserRole;
  onboarding_completed: boolean;
  is_verified:          boolean;
}

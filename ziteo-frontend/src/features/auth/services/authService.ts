import { supabase } from '../../../lib/supabaseClient'
import { Preferences } from '@capacitor/preferences'
import type { AuthUser, UserRole } from '../types/authTypes'

export class AuthServiceError extends Error {
  code: string

  constructor(code: string, message?: string) {
    super(message ?? code)
    this.code = code
    this.name = 'AuthServiceError'
  }
}

export interface RegisterInput {
  name: string
  phone: string
  email?: string
  company_name?: string
  initial_role: UserRole
  city?: string | null
  terms_accepted_at?: string
}

/** @deprecated — use RegisterInput */
export type AnonymousRegisterInput = RegisterInput

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildAuthUser(data: {
  user_id: string
  name: string
  phone: string
  active_role: string
  roles: string[]
  access_token: string
  refresh_token: string
  avatar_url?: string | null
  city?: string | null
  email?: string | null
}): AuthUser {
  return {
    user_id: data.user_id,
    name: data.name,
    phone: data.phone,
    active_role: data.active_role as UserRole,
    roles: (data.roles as UserRole[]),
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? '',
    avatar_url: data.avatar_url ?? undefined,
    city: data.city ?? null,
    email: data.email ?? undefined,
  }
}

/**
 * Extracts a meaningful error code from a supabase.functions.invoke error.
 * Non-2xx responses store the parsed body in error.context; the `error` field
 * there is the code the edge function returned (e.g. 'PHONE_ALREADY_REGISTERED').
 */
function extractEdgeError(error: unknown): string {
  if (!error) return 'EDGE_FUNCTION_ERROR'
  const e = error as { context?: { error?: string }; message?: string }
  return e.context?.error ?? e.message ?? 'EDGE_FUNCTION_ERROR'
}

// Legacy beta credentials (deterministic, used only for backward compat)
function getBetaCredentials(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '')
  return {
    email: `${cleanPhone}@gmail.com`,
    password: `ZiteoBeta_${cleanPhone}_2026!`,
  }
}

// Internal — not exported. Tries the old signInWithPassword scheme for beta testers.
async function loginLegacyBeta(phone: string): Promise<AuthUser> {
  const { email, password } = getBetaCredentials(phone)

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signInData.session || !signInData.user) {
    throw new AuthServiceError('LOGIN_FAILED', signInError?.message ?? 'Credenciales inválidas.')
  }

  const userId = signInData.user.id
  const session = signInData.session

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, name, phone, email, active_role, avatar_url, city')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError || !profile) {
    throw new AuthServiceError('PROFILE_FETCH_FAILED', profileError?.message ?? 'No se encontró el perfil.')
  }

  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  if (rolesError || !userRoles || userRoles.length === 0) {
    throw new AuthServiceError('ROLES_FETCH_FAILED', rolesError?.message ?? 'No se encontraron roles.')
  }

  const roles = userRoles.map((ur) => ur.role as UserRole)

  return {
    user_id: userId,
    name: profile.name,
    phone: profile.phone,
    email: profile.email ?? undefined,
    active_role: profile.active_role as UserRole,
    roles,
    access_token: session.access_token,
    refresh_token: session.refresh_token ?? '',
    avatar_url: profile.avatar_url ?? undefined,
    city: profile.city,
  }
}

// ---------------------------------------------------------------------------
// WhatsApp OTP — Forgot PIN flow
// ---------------------------------------------------------------------------

/**
 * Sends a WhatsApp OTP to a registered phone number (forgot-PIN flow).
 * Maps to auth-forgot-pin edge function.
 */
export async function startWhatsappVerification(phone: string): Promise<{ debug_otp?: string } | undefined> {
  const { data, error } = await supabase.functions.invoke('auth-forgot-pin', {
    body: { phone },
  })
  if (error) {
    throw new AuthServiceError(extractEdgeError(error), extractEdgeError(error))
  }
  return data as { debug_otp?: string }
}

/**
 * Verifies the OTP code (post-registration or forgot-PIN).
 * Maps to auth-otp-verify. Returns void — call loginWithPin afterward to get a session.
 */
export async function checkWhatsappCode(phone: string, code: string): Promise<void> {
  const { error } = await supabase.functions.invoke('auth-otp-verify', {
    body: { phone, otp: code },
  })
  if (error) {
    throw new AuthServiceError(extractEdgeError(error), extractEdgeError(error))
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Registers a new user with PIN.
 * Calls auth-register which creates the user, inserts profile/role, generates
 * OTP and sends it via WhatsApp. Returns { user_id, phone, debug_otp? }.
 * debug_otp is only included in local dev (localhost origin) when WhatsApp is
 * not configured — NEVER expose it in production.
 */
export async function registerWithPin(
  input: RegisterInput,
  pin: string
): Promise<{ user_id: string; phone: string; debug_otp?: string }> {
  const { data, error } = await supabase.functions.invoke('auth-register', {
    body: {
      phone: input.phone,
      name: input.name,
      email: input.email,
      city: input.city ?? 'Sucre',
      pin,
      initial_role: input.initial_role,
      terms_accepted_at: input.terms_accepted_at ?? new Date().toISOString(),
    },
  })
  if (error) {
    const code = extractEdgeError(error)
    throw new AuthServiceError(code, code)
  }

  const resp = data as { user_id: string; phone: string; requires_otp: boolean; debug_otp?: string }
  return { user_id: resp.user_id, phone: resp.phone, debug_otp: resp.debug_otp }
}

/**
 * Resends an OTP to a phone that has a pending registration.
 * Maps to auth-otp-resend. Returns { debug_otp? } in local dev.
 */
export async function resendOtp(phone: string): Promise<{ debug_otp?: string }> {
  const { data, error } = await supabase.functions.invoke('auth-otp-resend', {
    body: { phone },
  })
  if (error) {
    const code = extractEdgeError(error)
    throw new AuthServiceError(code, code)
  }
  const resp = data as { sent: boolean; debug_otp?: string }
  return { debug_otp: resp?.debug_otp }
}

/**
 * Verifies OTP after registration, then logs in to obtain a full session.
 * This is the second step after registerWithPin.
 */
export async function verifyOtpAndLogin(phone: string, otp: string, pin: string): Promise<AuthUser> {
  await checkWhatsappCode(phone, otp)
  return loginWithPin(phone, pin)
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/** Login con PIN (llama Edge Function auth-login) */
export async function loginWithPin(phone: string, pin: string): Promise<AuthUser> {
  const { data, error } = await supabase.functions.invoke('auth-login', {
    body: { phone, pin },
  })
  if (error) {
    const code = extractEdgeError(error)
    throw new AuthServiceError(code, code)
  }

  const resp = data as {
    user_id: string
    name: string
    phone: string
    active_role: string
    roles: string[]
    access_token: string
    refresh_token: string
    avatar_url?: string | null
    city?: string | null
  }

  await supabase.auth.setSession({
    access_token: resp.access_token,
    refresh_token: resp.refresh_token,
  })

  return buildAuthUser(resp)
}

/**
 * Intenta login con PIN; si el usuario no existe (USER_NOT_FOUND / 404),
 * cae en el esquema legacy de beta testers.
 */
export async function loginWithPinOrLegacy(phone: string, pin: string): Promise<AuthUser> {
  try {
    return await loginWithPin(phone, pin)
  } catch (err) {
    if (
      err instanceof AuthServiceError &&
      (err.code === 'USER_NOT_FOUND' || err.code.includes('404'))
    ) {
      return await loginLegacyBeta(phone)
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// PIN reset
// ---------------------------------------------------------------------------

/** Resetea PIN via WhatsApp OTP (code from auth-forgot-pin) */
export async function resetPin(phone: string, code: string, newPin: string): Promise<void> {
  const { error } = await supabase.functions.invoke('auth-reset-pin', {
    body: { phone, code, new_pin: newPin },
  })
  if (error) {
    const errCode = extractEdgeError(error)
    throw new AuthServiceError(errCode, errCode)
  }
}

// ---------------------------------------------------------------------------
// Session / Profile management (kept intact)
// ---------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  await Promise.all([
    supabase.auth.signOut(),
    Preferences.remove({ key: 'ziteo_bio_phone' }),
    Preferences.remove({ key: 'ziteo_bio_pin' }),
  ])
  localStorage.removeItem('ziteo_biometric_enabled')
}

export async function addRole(_accessToken: string, role: UserRole): Promise<void> {
  const { data: sessionData } = await supabase.auth.getUser()
  const userId = sessionData.user?.id
  if (!userId) throw new AuthServiceError('NOT_AUTHENTICATED')
  const { error } = await supabase.from('user_roles').insert({
    user_id: userId,
    role,
    onboarding_completed: false,
    is_verified: false,
  })
  if (error && !/duplicate|unique/i.test(error.message)) {
    throw new AuthServiceError('ROLE_ADD_FAILED', error.message)
  }
}

export async function removeRole(role: UserRole): Promise<void> {
  const { data: sessionData } = await supabase.auth.getUser()
  const userId = sessionData.user?.id
  if (!userId) throw new AuthServiceError('NOT_AUTHENTICATED')

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role)

  if (error) {
    throw new AuthServiceError('ROLE_REMOVE_FAILED', error.message)
  }

  if (role === 'maestro') {
    const { error: profileError } = await supabase
      .from('maestro_profiles')
      .delete()
      .eq('user_id', userId)
    if (profileError) {
      console.error('Error deleting maestro profile:', profileError.message)
    }

    const { error: habError } = await supabase
      .from('maestro_habilidades')
      .delete()
      .eq('maestro_id', userId)
    if (habError) {
      console.error('Error deleting maestro habilidades:', habError.message)
    }

    const { error: bioError } = await supabase
      .from('profiles')
      .update({ bio: null })
      .eq('user_id', userId)
    if (bioError) {
      console.error('Error resetting bio in profiles:', bioError.message)
    }

    try {
      const filePath = `${userId}/qr.png`
      await supabase.storage.from('payment-qrs').remove([filePath])
    } catch (storageErr) {
      console.error('Error deleting payment QR from storage:', storageErr)
    }
  } else if (role === 'proveedor') {
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .eq('provider_id', userId)
    if (productsError) {
      console.error('Error deleting provider products:', productsError.message)
    }

    try {
      const filePath = `${userId}/qr.png`
      await supabase.storage.from('payment-qrs').remove([filePath])
    } catch (storageErr) {
      console.error('Error deleting provider QR from storage:', storageErr)
    }
  }
}

export async function updateProfile(
  userId: string,
  data: { name: string; city: string; active_role: string; avatar_url?: string }
): Promise<void> {
  const payload: Record<string, unknown> = { name: data.name, city: data.city, active_role: data.active_role }
  if (data.avatar_url) payload.avatar_url = data.avatar_url

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
  if (error) {
    throw new AuthServiceError('PROFILE_UPDATE_FAILED', error.message)
  }
}

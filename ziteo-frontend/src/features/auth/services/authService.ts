import { supabase } from '../../../lib/supabaseClient'
import { Preferences } from '@capacitor/preferences'
import type { AuthUser, UserRole } from '../types/authTypes'
import { getClientOtpProvider } from '../otp'
import { FIREBASE_ERRORS } from '../constants/authConstants'

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

/** Traduce un código de error de Firebase Auth (auth/*) a un mensaje o lo deja pasar tal cual. */
function translateFirebaseError(err: unknown): AuthServiceError {
  console.error('[Firebase Auth Raw Error]:', err)
  const errObj = err as { code?: string; message?: string }
  const rawStr = `${errObj?.code ?? ''} ${errObj?.message ?? ''} ${String(err)}`
  const match = /auth\/[a-z-]+/.exec(rawStr)
  const firebaseCode = match?.[0]
  if (firebaseCode) {
    const message = FIREBASE_ERRORS[firebaseCode] ?? `Error de autenticación de Firebase (${firebaseCode})`
    return new AuthServiceError(firebaseCode, message)
  }
  return new AuthServiceError('OTP_CLIENT_ERROR', errObj?.message ?? 'No se pudo verificar el código, intenta de nuevo.')
}

/**
 * Inicia la verificación OTP para el flujo de "olvidé mi PIN". Con el
 * proveedor whatsapp, el backend ya generó y envió el código. Con firebase,
 * el backend no envía nada (channel:'client') y aquí se dispara
 * signInWithPhoneNumber para que Firebase entregue su propio SMS.
 * Maps to auth-forgot-pin edge function.
 */
export async function startWhatsappVerification(phone: string): Promise<{ debug_otp?: string } | undefined> {
  const { data, error } = await supabase.functions.invoke('auth-forgot-pin', {
    body: { phone },
  })
  if (error) {
    throw new AuthServiceError(extractEdgeError(error), extractEdgeError(error))
  }
  const resp = data as { sent?: boolean; otp_provider?: string; debug_otp?: string }
  if (resp?.otp_provider === 'firebase') {
    try {
      const provider = await getClientOtpProvider()
      await provider.requestCode(phone)
    } catch (err) {
      throw translateFirebaseError(err)
    }
  }
  return { debug_otp: resp?.debug_otp }
}

/**
 * Verifies the OTP code (post-registration or forgot-PIN).
 * Con firebase, `code` es el código de 6 dígitos que el usuario recibió por
 * SMS de Google; se convierte localmente en un ID token antes de mandarlo al
 * backend. Maps to auth-otp-verify. Returns void — call loginWithPin afterward.
 */
export async function checkWhatsappCode(phone: string, code: string): Promise<void> {
  const provider = await getClientOtpProvider()
  let proof: string
  try {
    proof = await provider.getProof(code)
  } catch (err) {
    throw translateFirebaseError(err)
  }

  const { error } = await supabase.functions.invoke('auth-otp-verify', {
    body: { phone, otp: proof },
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
): Promise<{ user_id: string; phone: string; requires_otp: boolean; debug_otp?: string }> {
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

  const resp = data as {
    user_id: string; phone: string; requires_otp: boolean; otp_provider?: string; debug_otp?: string
  }

  if (resp.requires_otp && resp.otp_provider === 'firebase') {
    try {
      const provider = await getClientOtpProvider()
      await provider.requestCode(resp.phone)
    } catch (err) {
      throw translateFirebaseError(err)
    }
  }

  return { user_id: resp.user_id, phone: resp.phone, requires_otp: resp.requires_otp, debug_otp: resp.debug_otp }
}

/**
 * Resends an OTP to a phone that has a pending registration. Con el
 * proveedor firebase, el reenvío lo dispara el cliente directamente (el
 * backend responde sent:false, sin generar/enviar nada).
 * Maps to auth-otp-resend. Returns { debug_otp? } in local dev.
 */
export async function resendOtp(phone: string): Promise<{ debug_otp?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('auth-otp-resend', {
      body: { phone },
    })
    if (error) {
      const code = extractEdgeError(error)
      // Si el perfil aún no existe porque la persona está en pleno proceso de registro,
      // con Firebase Auth igual permitimos disparar el reenvío desde el cliente.
      if (code === 'USER_NOT_FOUND' || code.includes('404')) {
        const provider = await getClientOtpProvider()
        if (provider.name === 'firebase') {
          await provider.requestCode(phone)
          return {}
        }
      }
      throw new AuthServiceError(code, code)
    }
    const resp = data as { sent: boolean; otp_provider?: string; debug_otp?: string }

    if (resp.otp_provider === 'firebase') {
      try {
        const provider = await getClientOtpProvider()
        await provider.requestCode(phone)
      } catch (err) {
        throw translateFirebaseError(err)
      }
    }

    return { debug_otp: resp?.debug_otp }
  } catch (err) {
    if (err instanceof AuthServiceError) throw err
    const provider = await getClientOtpProvider()
    if (provider.name === 'firebase') {
      try {
        await provider.requestCode(phone)
        return {}
      } catch (fbErr) {
        throw translateFirebaseError(fbErr)
      }
    }
    throw translateFirebaseError(err)
  }
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

/**
 * Resetea PIN via OTP (code from auth-forgot-pin). Con firebase, `code` es
 * el código de 6 dígitos recibido por SMS; se convierte a ID token localmente.
 */
export async function resetPin(phone: string, code: string, newPin: string): Promise<void> {
  const provider = await getClientOtpProvider()
  let proof: string
  try {
    proof = await provider.getProof(code)
  } catch (err) {
    throw translateFirebaseError(err)
  }

  const { error } = await supabase.functions.invoke('auth-reset-pin', {
    body: { phone, code: proof, new_pin: newPin },
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

/**
 * Full logout: clears the Supabase session, biometric credentials, and every
 * cached query (memory + IndexedDB persister), so a second user on the same
 * device never sees the previous user's data. Callers still need to clear
 * their own Zustand auth store afterwards.
 */
export async function performLogout(): Promise<void> {
  const { queryClient, idbPersister } = await import('../../../lib/queryClient')
  await Promise.all([
    signOut(),
    queryClient.clear(),
    idbPersister.removeClient(),
  ])
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
    // Soft-delete: mismo patrón que Ocasión (useOcasion.ts:233). Un DELETE
    // físico acá era irreversible — tocar el toggle de rol borraba el
    // catálogo entero sin posibilidad de recuperarlo si el usuario volvía
    // a activar el rol proveedor.
    const { error: productsError } = await supabase
      .from('products')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ active: false, is_deleted: true } as any)
      .eq('provider_id', userId)
    if (productsError) {
      console.error('Error soft-deleting provider products:', productsError.message)
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

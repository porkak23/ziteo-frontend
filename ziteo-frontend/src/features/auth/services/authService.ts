import { supabase } from '../../../lib/supabaseClient'
import type { AuthUser, UserRole } from '../types/authTypes'

export class AuthServiceError extends Error {
  code: string

  constructor(code: string, message?: string) {
    super(message ?? code)
    this.code = code
    this.name = 'AuthServiceError'
  }
}

export interface AnonymousRegisterInput {
  name: string
  phone: string
  email?: string
  company_name?: string
  role: UserRole
  city?: string | null
  terms_accepted_at?: string
}

// Genera credenciales deterministas e invisibles para la beta a partir del teléfono
export function getBetaCredentials(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '')
  return {
    email: `${cleanPhone}@gmail.com`,
    password: `ZiteoBeta_${cleanPhone}_2026!`,
  }
}

// Inicia sesión usando el teléfono con sus credenciales deterministas y obtiene los datos del perfil
export async function loginBeta(phone: string): Promise<AuthUser> {
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

  // Obtener perfil de la base de datos
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError || !profile) {
    throw new AuthServiceError('PROFILE_FETCH_FAILED', profileError?.message ?? 'No se encontró el perfil para este usuario.')
  }

  // Obtener roles de la base de datos
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  if (rolesError || !userRoles || userRoles.length === 0) {
    throw new AuthServiceError('ROLES_FETCH_FAILED', rolesError?.message ?? 'No se encontraron roles para este usuario.')
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

// Actualiza silenciosamente una sesión anónima activa a una sesión beta determinista
export async function upgradeAnonymousSession(phone: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    // Si no hay usuario o ya tiene un correo de la beta, no es necesario actualizar
    if (!user || user.email?.endsWith('@gmail.com')) {
      return
    }

    const { email, password } = getBetaCredentials(phone)
    const { error } = await supabase.auth.updateUser({ email, password })
    if (error) {
      console.warn('Silent upgrade to permanent user failed:', error.message)
    } else {
      console.log('Silent upgrade to permanent user succeeded!')
    }
  } catch (err) {
    console.warn('Error during silent upgrade:', err)
  }
}

// Registro con credenciales deterministas invisibles y soporte de migración/recuperación
export async function registerAnonymous(input: AnonymousRegisterInput): Promise<AuthUser> {
  const { email: betaEmail, password: betaPassword } = getBetaCredentials(input.phone)

  // 1. Pre-verificar si el teléfono ya está registrado en la base de datos
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('user_id, phone')
    .eq('phone', input.phone)
    .maybeSingle()

  if (checkError) {
    throw new AuthServiceError('PROFILE_CHECK_FAILED', checkError.message)
  }

  // 2. Si ya está registrado en profiles, intentamos recuperar la cuenta
  if (existingProfile) {
    try {
      // Intentamos iniciar sesión con la contraseña determinista
      return await loginBeta(input.phone)
    } catch (loginErr) {
      // Si falla, significa que el usuario es un usuario anónimo antiguo sin credencial de contraseña
      // Procedemos a crear su cuenta de Auth determinista y migrar su perfil antiguo
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: betaEmail,
        password: betaPassword,
      })

      if (signUpError || !signUpData.session || !signUpData.user) {
        throw new AuthServiceError('ANON_UPGRADE_SIGNUP_FAILED', signUpError?.message ?? 'No se pudo crear la credencial de recuperación.')
      }

      const newUserId = signUpData.user.id

      // Llamamos a la función RPC de la base de datos para actualizar todas las referencias relacionales
      const { error: rpcError } = await (supabase as any).rpc('migrate_anonymous_profile', {
        p_old_uid: existingProfile.user_id,
        p_new_uid: newUserId,
        p_phone: input.phone,
      })

      if (rpcError) {
        console.warn('RPC migration failed, attempting direct profile update fallback:', rpcError.message)
        // Fallback directo: intentamos actualizar el user_id del perfil si no hay restricciones complejas
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_id: newUserId })
          .eq('phone', input.phone)

        if (updateError) {
          throw new AuthServiceError('MIGRATION_FAILED', `No pudimos migrar tu perfil: ${rpcError.message}`)
        }
      }

      // Volvemos a iniciar sesión ahora que el perfil está migrado
      return await loginBeta(input.phone)
    }
  }

  // 3. Si no existe el teléfono, creamos una cuenta nueva desde cero
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: betaEmail,
    password: betaPassword,
  })

  if (signUpError) {
    throw new AuthServiceError('ANON_SIGNIN_FAILED', signUpError.message)
  }

  if (!signUpData.session || !signUpData.user) {
    throw new AuthServiceError(
      'ANON_SIGNIN_FAILED',
      'Confirmación de correo activa. Por favor, ve a tu panel de Supabase -> Auth -> Providers -> Email y DESACTIVA la opción "Confirm email".'
    )
  }

  const userId = signUpData.user.id
  const session = signUpData.session

  const profilePayload = {
    user_id: userId,
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    city: input.city || 'Sucre',
    active_role: input.role,
    pin_hash: '',
    terms_accepted_at: input.terms_accepted_at ?? new Date().toISOString(),
    preferred_auth_method: 'pin',
  }

  const { error: profileError } = await supabase.from('profiles').insert(profilePayload)
  if (profileError) {
    await supabase.auth.signOut().catch(() => undefined)
    throw new AuthServiceError('PROFILE_CREATE_FAILED', profileError.message)
  }

  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role: input.role,
    onboarding_completed: false,
    is_verified: false,
  })
  if (roleError) {
    throw new AuthServiceError('ROLE_CREATE_FAILED', roleError.message)
  }

  if (input.company_name) {
    await supabase
      .from('profiles')
      .update({ bio: input.company_name })
      .eq('user_id', userId)
      .then(() => undefined, () => undefined)
  }

  return {
    user_id: userId,
    name: input.name,
    phone: input.phone,
    email: input.email ?? undefined,
    active_role: input.role,
    roles: [input.role],
    access_token: session.access_token,
    refresh_token: session.refresh_token ?? '',
    city: input.city || 'Sucre',
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
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


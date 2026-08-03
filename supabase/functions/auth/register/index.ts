import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { getOtpProvider } from '../../_shared/otp-provider.ts'
import { isIpThrottled } from '../../_shared/ip-throttle.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Piloto sin WhatsApp: la cuenta de Meta es de prueba y solo entrega OTP a
// números pre-registrados, lo que bloquearía el registro masivo. Con este
// flag en 'false' (default), el registro omite el OTP y el usuario queda
// verificado y logueable de inmediato con su PIN. Poner OTP_VERIFICATION_REQUIRED=true
// en los secrets de Supabase cuando la cuenta de WhatsApp pase a producción.
const OTP_VERIFICATION_REQUIRED = Deno.env.get('OTP_VERIFICATION_REQUIRED') === 'true'

type UserRole = 'constructor' | 'proveedor' | 'maestro' | 'chofer'

interface RegisterBody {
  phone: string
  name: string
  email?: string
  city?: string
  pin: string
  initial_role: UserRole
  terms_accepted_at?: string
}

const VALID_ROLES: UserRole[] = ['constructor', 'proveedor', 'maestro', 'chofer']

/**
 * Busca un usuario de auth por su email sintético sin depender de la paginación
 * de listUsers() (50 por página): con la tabla ya crecida, un barrido de la
 * primera página no encuentra al huérfano y el número queda bloqueado para
 * registrarse con un error opaco. GoTrue soporta filtrar por email en la
 * query, así que el resultado es O(1) respecto al total de usuarios.
 */
// deno-lint-ignore no-explicit-any
async function findAuthUserByEmail(adminClient: any, email: string) {
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200, email })
  if (error) {
    console.error('[auth/register] listUsers by email failed:', error)
    return null
  }
  // El filtro `email` no está garantizado en todas las versiones de GoTrue;
  // comparamos igual para no borrar jamás un usuario distinto al buscado.
  // deno-lint-ignore no-explicit-any
  return data?.users?.find((u: any) => u.email === email) ?? null
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405, req)

  let body: RegisterBody
  try {
    body = await req.json() as RegisterBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400, req)
  }

  const { phone, name, email: userEmail, city, pin, initial_role } = body

  if (!phone || !/^\+591[678]\d{7}$/.test(phone)) {
    return errorResponse('INVALID_PHONE_FORMAT', 'Phone must be a valid Bolivian number (+591 + 8 digits)', 400, req)
  }
  if (!pin || !/^\d{6}$/.test(pin)) {
    return errorResponse('INVALID_PIN_FORMAT', 'PIN must be exactly 6 numeric digits', 400, req)
  }
  if (!name || name.trim().length < 2) {
    return errorResponse('INVALID_NAME', 'Name must be at least 2 characters', 400, req)
  }
  if (!initial_role || !VALID_ROLES.includes(initial_role)) {
    return errorResponse('INVALID_ROLE', `Role must be one of: ${VALID_ROLES.join(', ')}`, 400, req)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Rate-limit por IP: corta el bot que rota números para quemar saldo de SMS.
  if (await isIpThrottled(adminClient, req)) {
    return errorResponse('RATE_LIMITED', 'Too many requests from this network. Please try again later.', 429, req)
  }

  // Rate-limit via check_throttle RPC
  const { data: throttled, error: throttleErr } = await adminClient.rpc('check_throttle', {
    p_identifier: phone,
    p_max_attempts: 5,
    p_window_minutes: 15,
  })
  if (!throttleErr && throttled === true) {
    return errorResponse('RATE_LIMITED', 'Too many attempts. Please wait 15 minutes before trying again.', 429, req)
  }

  // Check if phone is already registered
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (existingProfile) {
    // Check if onboarding was ever completed — if so, block re-registration
    const { data: existingRole } = await adminClient
      .from('user_roles')
      .select('onboarding_completed')
      .eq('user_id', existingProfile.user_id)
      .maybeSingle()

    if (existingRole?.onboarding_completed === true) {
      return errorResponse('PHONE_ALREADY_REGISTERED', 'An account with this phone number already exists', 409, req)
    }

    // Incomplete registration — clean up so the user can retry
    await adminClient.from('otps').delete().eq('phone', phone)
    await adminClient.from('user_roles').delete().eq('user_id', existingProfile.user_id)
    await adminClient.from('profiles').delete().eq('user_id', existingProfile.user_id)
    await adminClient.auth.admin.deleteUser(existingProfile.user_id)
  }

  // Synthetic email for Supabase Auth (phone-only users)
  const syntheticEmail = `${phone.replace('+', '')}@phone.ziteo.bo`

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: syntheticEmail,
    password: pin,
    email_confirm: true,
    user_metadata: { phone, name: name.trim(), initial_role },
  })

  let authDataResult = authData
  let userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth createUser error:', authError)
    if (authError?.message?.toLowerCase().includes('already registered') || authError?.message?.toLowerCase().includes('already been registered')) {
      // Clean up orphaned auth user if profile doesn't exist.
      //
      // listUsers() es paginado (50 por defecto): buscar el huérfano ahí deja
      // de encontrarlo apenas la tabla crece, y el número queda inutilizable
      // para siempre con un REGISTRATION_FAILED opaco. Resolvemos el id por
      // email exacto, que no depende del tamaño de la tabla.
      const orphan = await findAuthUserByEmail(adminClient, syntheticEmail)
      if (orphan) {
        console.log(`[auth/register] Cleaning up orphaned auth user ${orphan.id} for ${phone}`)
        await adminClient.from('otps').delete().eq('phone', phone)
        await adminClient.from('user_roles').delete().eq('user_id', orphan.id)
        await adminClient.from('profiles').delete().eq('user_id', orphan.id)
        await adminClient.auth.admin.deleteUser(orphan.id)

        // Retry user creation once
        const { data: retryData, error: retryErr } = await adminClient.auth.admin.createUser({
          email: syntheticEmail,
          password: pin,
          email_confirm: true,
          user_metadata: { phone, name: name.trim(), initial_role },
        })

        if (!retryErr && retryData.user) {
          authDataResult = retryData
          userId = retryData.user.id
        } else {
          return errorResponse('REGISTRATION_FAILED', retryErr?.message ?? 'Failed to create account', 500, req)
        }
      } else {
        return errorResponse('REGISTRATION_FAILED', authError?.message ?? 'Failed to create account', 500, req)
      }
    } else {
      return errorResponse('REGISTRATION_FAILED', authError?.message ?? 'Failed to create account', 500, req)
    }
  }

  // Insert profile
  const profilePayload: Record<string, unknown> = {
    user_id: userId,
    name: name.trim(),
    phone,
    city: city ?? null,
    active_role: initial_role,
    pin_hash: 'managed_by_supabase_auth',
  }
  if (userEmail) profilePayload.email = userEmail

  const { error: profileError } = await adminClient.from('profiles').insert(profilePayload)
  if (profileError) {
    console.error('Profile insert error:', profileError)
    await adminClient.auth.admin.deleteUser(userId)
    return errorResponse('PROFILE_CREATION_FAILED', 'Failed to create user profile', 500, req)
  }

  // Insert role
  const { error: roleError } = await adminClient
    .from('user_roles')
    .insert({ user_id: userId, role: initial_role, onboarding_completed: !OTP_VERIFICATION_REQUIRED })
  if (roleError) {
    console.error('User role insert error:', roleError)
    await adminClient.from('profiles').delete().eq('user_id', userId)
    await adminClient.auth.admin.deleteUser(userId)
    return errorResponse('ROLE_CREATION_FAILED', 'Failed to assign role', 500, req)
  }

  if (!OTP_VERIFICATION_REQUIRED) {
    return jsonResponse({ user_id: userId, phone, requires_otp: false }, 201, {}, req)
  }

  const provider = getOtpProvider()
  let issueResult
  try {
    issueResult = await provider.issue(adminClient, phone, 'verify_phone', req)
  } catch (err) {
    console.error('OTP issue error:', err)
    // Rollback created user data on OTP issue failure so the phone isn't left in an incomplete broken state
    await adminClient.from('otps').delete().eq('phone', phone)
    await adminClient.from('user_roles').delete().eq('user_id', userId)
    await adminClient.from('profiles').delete().eq('user_id', userId)
    await adminClient.auth.admin.deleteUser(userId)

    const errStr = String(err)
    const code = errStr.includes('WHATSAPP_SEND_FAILED')
      ? 'WHATSAPP_SEND_FAILED'
      : errStr.includes('TWILIO_SEND_FAILED')
        ? 'SMS_SEND_FAILED'
        : 'OTP_CREATE_FAILED'
    return errorResponse(code, 'Failed to issue verification code', 500, req)
  }

  const payload: Record<string, unknown> = { user_id: userId, phone, requires_otp: true, otp_provider: provider.name }
  if (issueResult.debug_otp) payload.debug_otp = issueResult.debug_otp
  return jsonResponse(payload, 201, {}, req)
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse, isDevOrigin } from '../../_shared/cors.ts'
import { sendOtp } from '../../_shared/otp-sender.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

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

  if (authError || !authData.user) {
    console.error('Auth createUser error:', authError)
    return errorResponse('REGISTRATION_FAILED', authError?.message ?? 'Failed to create account', 500, req)
  }

  const userId = authData.user.id

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

  // Insert role (onboarding_completed stays false until OTP verified)
  const { error: roleError } = await adminClient
    .from('user_roles')
    .insert({ user_id: userId, role: initial_role, onboarding_completed: false })
  if (roleError) {
    console.error('User role insert error:', roleError)
    await adminClient.auth.admin.deleteUser(userId)
    return errorResponse('ROLE_CREATION_FAILED', 'Failed to assign role', 500, req)
  }

  // Generate OTP
  const otpCode = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error: otpError } = await adminClient
    .from('otps')
    .insert({ phone, code: otpCode, expires_at: expiresAt, used: false, purpose: 'verify_phone' })
  if (otpError) {
    console.error('OTP insert error:', otpError)
    return errorResponse('OTP_CREATE_FAILED', 'Failed to generate verification code', 500, req)
  }

  // Send OTP via WhatsApp (primary) with automatic SMS fallback
  try {
    await sendOtp(phone, otpCode)
  } catch (waErr) {
    const isNotConfigured = String(waErr).includes('OTP_NOT_CONFIGURED')
    if (!isNotConfigured) {
      console.error('OTP send error:', waErr)
      return errorResponse('WHATSAPP_SEND_FAILED', 'Failed to send verification code via WhatsApp', 500, req)
    }
    // Dev fallback: no transport configured — return debug_otp only to local origins
    const debugPayload: Record<string, unknown> = { user_id: userId, phone, requires_otp: true }
    if (isDevOrigin(req)) debugPayload.debug_otp = otpCode
    return jsonResponse(debugPayload, 201, {}, req)
  }

  const successPayload: Record<string, unknown> = { user_id: userId, phone, requires_otp: true }
  if (isDevOrigin(req)) successPayload.debug_otp = otpCode
  return jsonResponse(successPayload, 201, {}, req)
})

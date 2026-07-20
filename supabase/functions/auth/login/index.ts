import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

type UserRole = 'constructor' | 'proveedor' | 'maestro' | 'chofer'

interface LoginBody {
  phone: string
  pin: string
}

interface LoginResult {
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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405, req)

  let body: LoginBody
  try {
    body = await req.json() as LoginBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400, req)
  }

  const { phone, pin } = body
  if (!phone || !pin) {
    return errorResponse('MISSING_FIELDS', 'phone and pin are required', 400, req)
  }

  if (!/^\+591[678]\d{7}$/.test(phone)) {
    return errorResponse('INVALID_PHONE_FORMAT', 'Phone must be a valid Bolivian number', 400, req)
  }

  if (!/^\d{6}$/.test(pin)) {
    return errorResponse('INVALID_PIN_FORMAT', 'PIN must be exactly 6 digits', 400, req)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Rate-limit PIN guessing: max 5 attempts per phone per 15 minutes.
  // Fail-closed: an RPC error is treated as throttled.
  const { data: throttled, error: throttleErr } = await adminClient.rpc('check_throttle', {
    p_identifier: `login:${phone}`,
    p_max_attempts: 5,
    p_window_minutes: 15,
  })
  if (throttleErr || throttled === true) {
    return errorResponse('RATE_LIMITED', 'Too many attempts. Please wait 15 minutes before trying again.', 429, req)
  }

  // Synthetic email — new users registered via auth/register use @phone.ziteo.bo
  const syntheticEmail = `${phone.replace('+', '')}@phone.ziteo.bo`

  const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
    email: syntheticEmail,
    password: pin,
  })

  if (signInError || !signInData.user || !signInData.session) {
    const errorMessage = signInError?.message ?? ''
    if (errorMessage.includes('Invalid login credentials')) {
      const { data: profileCheck } = await adminClient
        .from('profiles')
        .select('user_id')
        .eq('phone', phone)
        .maybeSingle()

      if (!profileCheck) {
        return errorResponse('USER_NOT_FOUND', 'No account found for this phone number', 404, req)
      }
      return errorResponse('INVALID_PIN', 'Incorrect PIN', 401, req)
    }
    if (errorMessage.includes('Email not confirmed')) {
      return errorResponse('EMAIL_NOT_CONFIRMED', 'Phone number not yet verified via OTP', 403, req)
    }
    return errorResponse('AUTH_ERROR', errorMessage || 'Authentication failed', 401, req)
  }

  const userId = signInData.user.id

  const [profileResult, rolesResult] = await Promise.all([
    adminClient
      .from('profiles')
      .select('name, phone, city, active_role, avatar_url')
      .eq('user_id', userId)
      .single(),
    adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId),
  ])

  if (profileResult.error || !profileResult.data) {
    return errorResponse('PROFILE_NOT_FOUND', 'User profile not found', 404, req)
  }

  const profile = profileResult.data
  const roles = (rolesResult.data ?? []).map((r) => r.role as UserRole)

  const result: LoginResult = {
    user_id: userId,
    name: profile.name,
    phone: profile.phone,
    active_role: profile.active_role as UserRole,
    roles,
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
    avatar_url: profile.avatar_url ?? null,
    city: profile.city ?? null,
  }

  return jsonResponse(result, 200, {}, req)
})

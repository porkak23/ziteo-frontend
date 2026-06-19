import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

type UserRole = 'constructor' | 'proveedor' | 'maestro' | 'chofer'

interface RegisterBody {
  phone: string
  name: string
  email?: string
  city: string
  pin: string
  initial_role: UserRole
  plan?: string
  company_name?: string
}

interface RegisterResult {
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
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: RegisterBody
  try {
    body = await req.json() as RegisterBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const { phone, name, city, pin, initial_role, email } = body

  // Required field validation
  if (!phone || !name || !city || !pin || !initial_role) {
    return errorResponse('MISSING_FIELDS', 'phone, name, city, pin, and initial_role are required', 400)
  }

  // Validate Bolivian phone format
  if (!/^\+591[678]\d{7}$/.test(phone)) {
    return errorResponse('INVALID_PHONE_FORMAT', 'Phone must be a valid Bolivian number (+591 + 8 digits)', 400)
  }

  // PIN must be exactly 6 numeric digits
  if (!/^\d{6}$/.test(pin)) {
    return errorResponse('INVALID_PIN_FORMAT', 'PIN must be exactly 6 numeric digits', 400)
  }

  const validRoles: UserRole[] = ['constructor', 'proveedor', 'maestro', 'chofer']
  if (!validRoles.includes(initial_role)) {
    return errorResponse('INVALID_ROLE', `Role must be one of: ${validRoles.join(', ')}`, 400, req)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check if phone is already registered
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (existingProfile) {
    return errorResponse('PHONE_ALREADY_REGISTERED', 'An account with this phone number already exists', 409)
  }

  // Use a synthetic email for Supabase Auth (phone-only users have no real email)
  const syntheticEmail = `${phone.replace('+', '')}@ziteo.bo`

  // Create the auth user — phone was already verified by WhatsApp OTP before this call,
  // so we confirm the email immediately to allow login right after registration.
  const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
    email: syntheticEmail,
    password: pin,
    email_confirm: true,
    user_metadata: { phone, name, initial_role },
  })

  if (createError || !authData.user) {
    if (createError?.message.includes('already been registered')) {
      return errorResponse('PHONE_ALREADY_REGISTERED', 'An account with this phone number already exists', 409)
    }
    return errorResponse('REGISTER_FAILED', createError?.message ?? 'Failed to create account', 500)
  }

  const userId = authData.user.id

  // Create profile record — done here under service role to ensure atomicity
  const profilePayload: Record<string, unknown> = {
    user_id: userId,
    name,
    phone,
    city,
    active_role: initial_role,
  }
  if (email) profilePayload.email = email

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert(profilePayload)

  if (profileError) {
    // Roll back: delete the auth user so the phone is not orphaned
    await adminClient.auth.admin.deleteUser(userId)
    return errorResponse('REGISTER_FAILED', 'Failed to create user profile', 500)
  }

  // Create the initial user_role entry
  const { error: roleError } = await adminClient
    .from('user_roles')
    .insert({ user_id: userId, role: initial_role })

  if (roleError) {
    // Non-fatal: profile exists, role can be repaired. Log and continue.
    console.error('Failed to insert user_role:', roleError.message)
  }

  // Sign in immediately to return a full session — client does not need a separate login call
  const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
    email: syntheticEmail,
    password: pin,
  })

  if (signInError || !signInData.user || !signInData.session) {
    return errorResponse('REGISTER_FAILED', 'Account created but failed to start session', 500)
  }

  const result: RegisterResult = {
    user_id: userId,
    name,
    phone,
    active_role: initial_role,
    roles: [initial_role],
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
    avatar_url: null,
    city: city ?? null,
  }

  return jsonResponse(result, 201, {})
})

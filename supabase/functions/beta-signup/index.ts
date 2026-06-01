import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

type UserRole = 'constructor' | 'proveedor' | 'maestro' | 'chofer'

interface BetaSignupBody {
  name: string
  phone: string
  email?: string
  city: string
  role: UserRole
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: BetaSignupBody
  try {
    body = await req.json() as BetaSignupBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const { name, phone, email, city, role } = body

  if (!name || !phone || !city || !role) {
    return errorResponse('MISSING_FIELDS', 'name, phone, city, and role are required', 400)
  }

  if (!/^\+591[678]\d{7}$/.test(phone)) {
    return errorResponse('INVALID_PHONE', 'Phone must be a valid Bolivian number (+591 + 8 digits)', 400)
  }

  const validRoles: UserRole[] = ['constructor', 'proveedor', 'maestro', 'chofer']
  if (!validRoles.includes(role)) {
    return errorResponse('INVALID_ROLE', `Role must be one of: ${validRoles.join(', ')}`, 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Deterministic password for beta: allows return login without OTP
  const betaPassword = `beta_${phone.slice(-6)}_ziteo`
  const syntheticEmail = `${phone.replace('+', '')}@ziteo.bo`

  // Check if user already exists (return login)
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('user_id, name, phone, city, active_role, avatar_url')
    .eq('phone', phone)
    .maybeSingle()

  let userId: string
  let accessToken: string
  let refreshToken: string

  if (existingProfile) {
    // Returning beta user — sign them in
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '')
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: syntheticEmail,
      password: betaPassword,
    })
    if (signInError || !signInData.session) {
      return errorResponse('LOGIN_FAILED', 'Could not sign in existing user', 500)
    }
    userId = existingProfile.user_id
    accessToken = signInData.session.access_token
    refreshToken = signInData.session.refresh_token

    const { data: rolesData } = await adminClient
      .from('user_roles').select('role').eq('user_id', userId)

    return jsonResponse({
      user_id: userId,
      name: existingProfile.name,
      phone: existingProfile.phone,
      city: existingProfile.city,
      active_role: existingProfile.active_role,
      roles: (rolesData ?? []).map((r: { role: string }) => r.role),
      access_token: accessToken,
      refresh_token: refreshToken,
      is_returning: true,
    })
  }

  // New user — create account
  const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
    email: syntheticEmail,
    password: betaPassword,
    email_confirm: true,
    user_metadata: { phone, name, initial_role: role },
  })

  let createdUserId: string | null = null
  if (createError || !authData.user) {
    // Handle orphan: auth.users row exists from a prior failed attempt but no profile.
    // Try to find the existing auth user and reuse it.
    const msg = createError?.message ?? ''
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
      const { data: listed } = await adminClient.auth.admin.listUsers()
      const found = listed?.users?.find((u) => u.email === syntheticEmail)
      if (found) {
        // Reset password to known betaPassword so sign-in works downstream
        await adminClient.auth.admin.updateUserById(found.id, {
          password: betaPassword,
          email_confirm: true,
        })
        createdUserId = found.id
      }
    }
    if (!createdUserId) {
      return errorResponse('SIGNUP_FAILED', createError?.message ?? 'Failed to create account', 500)
    }
  } else {
    createdUserId = authData.user.id
  }

  userId = createdUserId

  // Create profile
  const profilePayload: Record<string, unknown> = { user_id: userId, name, phone, city, active_role: role }
  if (email) profilePayload.email = email

  const { error: profileError } = await adminClient.from('profiles').insert(profilePayload)
  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId)
    return errorResponse('SIGNUP_FAILED', 'Failed to create profile', 500)
  }

  // Create role entry
  await adminClient.from('user_roles').insert({ user_id: userId, role })

  // Insert into waitlist
  const waitlistPayload: Record<string, unknown> = { user_id: userId, name, phone, city, role }
  if (email) waitlistPayload.email = email
  await adminClient.from('waitlist').insert(waitlistPayload)

  // Sign in to get session tokens
  const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '')
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: syntheticEmail,
    password: betaPassword,
  })

  if (signInError || !signInData.session) {
    return errorResponse('SESSION_FAILED', 'Account created but could not create session', 500)
  }

  accessToken = signInData.session.access_token
  refreshToken = signInData.session.refresh_token

  return jsonResponse({
    user_id: userId,
    name,
    phone,
    city,
    active_role: role,
    roles: [role],
    access_token: accessToken,
    refresh_token: refreshToken,
    is_returning: false,
  }, 201)
})

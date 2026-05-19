import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

type UserRole = 'constructor' | 'proveedor' | 'maestro' | 'chofer'

interface OAuthSetupBody {
  name: string
  city: string
  initial_role: UserRole
}

// Called after Google/Apple OAuth sign-in to complete profile setup for new OAuth users.
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  // Verify the caller's JWT to get their user_id
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return errorResponse('UNAUTHORIZED', 'Missing Authorization header', 401)
  }
  const accessToken = authHeader.replace('Bearer ', '')

  // Use anon client to validate the user's JWT
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) {
    return errorResponse('UNAUTHORIZED', 'Invalid or expired token', 401)
  }

  let body: OAuthSetupBody
  try {
    body = await req.json() as OAuthSetupBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const { name, city, initial_role } = body
  if (!name || !city || !initial_role) {
    return errorResponse('MISSING_FIELDS', 'name, city, and initial_role are required', 400)
  }

  const validRoles: UserRole[] = ['constructor', 'proveedor', 'maestro', 'chofer']
  if (!validRoles.includes(initial_role)) {
    return errorResponse('INVALID_ROLE', `Role must be one of: ${validRoles.join(', ')}`, 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check if profile already exists (idempotent: allow re-setup)
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingProfile) {
    return errorResponse('ALREADY_SETUP', 'Profile already configured', 409)
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      user_id: user.id,
      name,
      city,
      active_role: initial_role,
      email: user.email ?? null,
      // phone will be null for pure OAuth users
      phone: user.phone ?? null,
    })

  if (profileError) {
    return errorResponse('SETUP_FAILED', 'Failed to create profile', 500)
  }

  const { error: roleError } = await adminClient
    .from('user_roles')
    .insert({ user_id: user.id, role: initial_role })

  if (roleError) {
    console.error('Failed to insert user_role for OAuth user:', roleError.message)
  }

  return jsonResponse({ setup: true }, 201)
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

type UserRole = 'constructor' | 'proveedor' | 'maestro' | 'chofer'

interface AddRoleBody {
  role: UserRole
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  // Validate caller's JWT
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return errorResponse('UNAUTHORIZED', 'Missing Authorization header', 401)
  }
  const accessToken = authHeader.replace('Bearer ', '')

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) {
    return errorResponse('UNAUTHORIZED', 'Invalid or expired token', 401)
  }

  let body: AddRoleBody
  try {
    body = await req.json() as AddRoleBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const { role } = body
  const validRoles: UserRole[] = ['constructor', 'proveedor', 'maestro', 'chofer']
  if (!role || !validRoles.includes(role)) {
    return errorResponse('INVALID_ROLE', `Role must be one of: ${validRoles.join(', ')}`, 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Upsert: silently succeed if the user already has this role
  const { error } = await adminClient
    .from('user_roles')
    .upsert(
      { user_id: user.id, role },
      { onConflict: 'user_id,role', ignoreDuplicates: true }
    )

  if (error) {
    return errorResponse('ADD_ROLE_FAILED', 'Failed to add role', 500)
  }

  return jsonResponse({ added: true, role }, 200)
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_ROLES = ['constructor', 'proveedor', 'maestro', 'chofer'] as const
type Role = typeof VALID_ROLES[number]

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return jsonResponse({ error: 'UNAUTHORIZED' }, 401)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify the caller's JWT to get their user_id
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return jsonResponse({ error: 'UNAUTHORIZED' }, 401)

    let body: { name?: string; city?: string; initial_role?: string }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'INVALID_JSON' }, 400)
    }

    const { name, city, initial_role } = body

    if (!name || name.trim().length < 2) {
      return jsonResponse({ error: 'INVALID_NAME' }, 400)
    }
    if (!initial_role || !VALID_ROLES.includes(initial_role as Role)) {
      return jsonResponse({ error: 'INVALID_ROLE' }, 400)
    }

    // Idempotency: skip if profile already exists
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) return jsonResponse({ error: 'PROFILE_ALREADY_EXISTS' }, 409)

    // Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      user_id: user.id,
      name: name.trim(),
      phone: '',
      email: user.email ?? null,
      city: city ?? null,
      active_role: initial_role,
      pin_hash: 'oauth_user',
    })

    if (profileError) {
      console.error('Profile insert error:', profileError)
      return jsonResponse({ error: 'PROFILE_CREATE_FAILED', details: profileError.message }, 500)
    }

    // Create user_role
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: user.id,
      role: initial_role,
      onboarding_completed: false,
    })

    if (roleError) {
      console.error('Role insert error:', roleError)
      await supabaseAdmin.from('profiles').delete().eq('user_id', user.id)
      return jsonResponse({ error: 'ROLE_CREATE_FAILED', details: roleError.message }, 500)
    }

    return jsonResponse({ success: true, user_id: user.id })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }
})

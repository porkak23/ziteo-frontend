import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PHONE_REGEX = /^\+591[678]\d{7}$/
const PIN_REGEX = /^\d{8}$/

function phoneToEmail(phone: string): string {
  return `${phone.replace('+', '')}@phone.ziteo.bo`
}

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let body: { phone?: string; pin?: string }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'INVALID_JSON' }, 400)
    }

    const { phone, pin } = body

    // Validate inputs
    if (!phone || !PHONE_REGEX.test(phone)) {
      return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
    }
    if (!pin || !PIN_REGEX.test(pin)) {
      return jsonResponse({ error: 'INVALID_PIN_FORMAT' }, 400)
    }

    // Check if user exists in profiles
    const { data: profileCheck } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle()

    if (!profileCheck) {
      return jsonResponse({ error: 'USER_NOT_FOUND' }, 404)
    }

    // Sign in using anon client with user credentials
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    const email = phoneToEmail(phone)
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password: pin,
    })

    if (signInError || !signInData.session || !signInData.user) {
      console.error('Sign in error:', signInError)
      return jsonResponse({ error: 'INVALID_PIN' }, 401)
    }

    const user_id = signInData.user.id
    const access_token = signInData.session.access_token
    const refresh_token = signInData.session.refresh_token

    // Fetch profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('name, phone, city, active_role, avatar_url')
      .eq('user_id', user_id)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return jsonResponse({ error: 'PROFILE_NOT_FOUND' }, 404)
    }

    // Fetch user roles
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)

    if (rolesError) {
      console.error('Roles fetch error:', rolesError)
      return jsonResponse({ error: 'ROLES_FETCH_FAILED' }, 500)
    }

    const roles = rolesData?.map((r) => r.role) ?? []

    return jsonResponse({
      user_id,
      name: profile.name,
      phone: profile.phone,
      city: profile.city ?? null,
      active_role: profile.active_role,
      roles,
      access_token,
      refresh_token,
      avatar_url: profile.avatar_url ?? null,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }
})

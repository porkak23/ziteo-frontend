import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PHONE_REGEX = /^\+591[678]\d{7}$/
const OTP_REGEX = /^\d{6}$/

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let body: { phone?: string; otp?: string }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'INVALID_JSON' }, 400)
    }

    const { phone, otp } = body

    // Validate inputs
    if (!phone || !PHONE_REGEX.test(phone)) {
      return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
    }
    if (!otp || !OTP_REGEX.test(otp)) {
      return jsonResponse({ error: 'INVALID_OTP_FORMAT' }, 400)
    }

    // Check if phone exists in profiles
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle()

    if (!profileCheck) {
      return jsonResponse({ error: 'PHONE_NOT_FOUND' }, 404)
    }

    const user_id = profileCheck.user_id

    // Find the most recent valid (unused, not expired) OTP for this phone
    const now = new Date().toISOString()
    const { data: otpRecord, error: otpFetchError } = await supabase
      .from('otps')
      .select('id, code, expires_at, used')
      .eq('phone', phone)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpFetchError) {
      console.error('OTP fetch error:', otpFetchError)
      return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
    }

    if (!otpRecord) {
      // Check if there's an expired OTP to differentiate the error
      const { data: expiredOtp } = await supabase
        .from('otps')
        .select('id')
        .eq('phone', phone)
        .eq('used', false)
        .lte('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (expiredOtp) {
        return jsonResponse({ error: 'OTP_EXPIRED' }, 410)
      }

      return jsonResponse({ error: 'INVALID_OTP' }, 400)
    }

    // Validate the OTP code
    if (otpRecord.code !== otp) {
      return jsonResponse({ error: 'INVALID_OTP' }, 400)
    }

    // Mark OTP as used
    const { error: otpUpdateError } = await supabase
      .from('otps')
      .update({ used: true })
      .eq('id', otpRecord.id)

    if (otpUpdateError) {
      console.error('OTP update error:', otpUpdateError)
      return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
    }

    // Confirm the phone in Supabase Auth
    const { error: confirmError } = await supabase.auth.admin.updateUserById(user_id, {
      phone_confirm: true,
    })

    if (confirmError) {
      console.error('Phone confirm error:', confirmError)
      return jsonResponse({ error: 'PHONE_CONFIRM_FAILED', details: confirmError.message }, 500)
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, phone, city, active_role, avatar_url')
      .eq('user_id', user_id)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return jsonResponse({ error: 'PROFILE_NOT_FOUND' }, 404)
    }

    // Fetch user roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)

    if (rolesError) {
      console.error('Roles fetch error:', rolesError)
      return jsonResponse({ error: 'ROLES_FETCH_FAILED' }, 500)
    }

    const roles = rolesData?.map((r) => r.role) ?? []

    // Create a session by generating a sign-in link (admin approach)
    // We use admin.generateLink for a one-time magic link to get a session token
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone.replace('+', '')}@phone.ziteo.bo`,
    })

    // If magic link generation fails (e.g., no email on user), fall back to returning user data without token
    let access_token: string | null = null
    if (!linkError && linkData?.properties?.hashed_token) {
      // The token is available but exchanging it requires a separate flow.
      // Instead, we use the admin API to create a session directly via a custom token approach.
      // Since Supabase Admin doesn't have a direct "create session" call, we note the limitation.
      // The client should call auth-login after OTP verification with their PIN to get the session.
      access_token = null
    }

    return jsonResponse({
      user_id,
      name: profile.name,
      phone: profile.phone,
      active_role: profile.active_role,
      roles,
      access_token,
      avatar_url: profile.avatar_url ?? null,
      phone_confirmed: true,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }
})

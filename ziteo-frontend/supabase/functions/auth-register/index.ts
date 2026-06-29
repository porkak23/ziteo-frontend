import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendWhatsAppOtp } from '../_shared/whatsapp.ts'
import { safeError } from '../_shared/safeError.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://ziteo-frontend.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PHONE_REGEX = /^\+591[678]\d{7}$/
const PIN_REGEX = /^\d{6}$/
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let body: { phone?: string; name?: string; email?: string; city?: string; pin?: string; initial_role?: string }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'INVALID_JSON' }, 400)
    }

    const { phone, name, email: userEmail, city, pin, initial_role } = body

    // Validate inputs
    if (!phone || !PHONE_REGEX.test(phone)) {
      return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
    }
    if (!pin || !PIN_REGEX.test(pin)) {
      return jsonResponse({ error: 'INVALID_PIN_FORMAT' }, 400)
    }
    if (!name || name.trim().length < 2) {
      return jsonResponse({ error: 'INVALID_NAME' }, 400)
    }
    if (!initial_role || !VALID_ROLES.includes(initial_role as Role)) {
      return jsonResponse({ error: 'INVALID_ROLE' }, 400)
    }

    // Rate-limit: max 5 registration attempts per phone per 15 min
    const { data: throttled, error: throttleErr } = await supabase.rpc('check_throttle', {
      p_identifier: phone,
      p_max_attempts: 5,
      p_window_minutes: 15,
    })
    if (!throttleErr && throttled === true) {
      return jsonResponse(safeError('RATE_LIMITED'), 429)
    }

    // Check if phone already registered
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle()

    if (existingProfile) {
      // Allow re-registration only if onboarding was never completed (incomplete prior attempt)
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('onboarding_completed')
        .eq('user_id', existingProfile.user_id)
        .maybeSingle()

      if (existingRole?.onboarding_completed === true) {
        return jsonResponse({ error: 'PHONE_ALREADY_REGISTERED' }, 409)
      }

      // Incomplete registration — clean up and allow retry
      await supabase.from('otps').delete().eq('phone', phone)
      await supabase.from('user_roles').delete().eq('user_id', existingProfile.user_id)
      await supabase.from('profiles').delete().eq('user_id', existingProfile.user_id)
      await supabase.auth.admin.deleteUser(existingProfile.user_id)
    }

    // Create user in Supabase Auth (use email derived from phone to avoid needing Phone provider)
    const email = `${phone.replace('+', '')}@phone.ziteo.bo`
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('Auth createUser error:', authError)
      return jsonResponse(safeError('REGISTRATION_FAILED'), 500)
    }

    const user_id = authData.user.id

    // Insert into profiles
    const profileData: Record<string, unknown> = {
      user_id,
      name: name.trim(),
      phone,
      city: city ?? null,
      active_role: initial_role,
      pin_hash: 'managed_by_supabase_auth',
    }
    if (userEmail) profileData.email = userEmail

    const { error: profileError } = await supabase.from('profiles').insert(profileData)

    if (profileError) {
      console.error('Profile insert error:', profileError)
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(user_id)
      return jsonResponse(safeError('PROFILE_CREATION_FAILED'), 500)
    }

    // Insert into user_roles
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id,
      role: initial_role,
      onboarding_completed: false,
    })

    if (roleError) {
      console.error('User role insert error:', roleError)
      await supabase.auth.admin.deleteUser(user_id)
      return jsonResponse(safeError('ROLE_CREATION_FAILED'), 500)
    }

    // Generate OTP
    const otp_code = String(Math.floor(100000 + Math.random() * 900000))
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { error: otpError } = await supabase.from('otps').insert({
      phone,
      code: otp_code,
      expires_at,
      used: false,
    })

    if (otpError) {
      console.error('OTP insert error:', otpError)
      return jsonResponse(safeError('OTP_CREATE_FAILED'), 500)
    }

    // Send OTP via WhatsApp
    try {
      await sendWhatsAppOtp(phone, otp_code)
    } catch (waErr) {
      console.error('WhatsApp send error:', waErr)
      // Return OTP in debug_otp only when WhatsApp is not configured (dev/local) OR debug OTP is enabled
      const isNotConfigured = String(waErr).includes('WHATSAPP_NOT_CONFIGURED')
      const isDebugEnabled = Deno.env.get('DEBUG_OTP_ENABLED') === 'true'
      if (!isNotConfigured && !isDebugEnabled) {
        return jsonResponse({ error: 'WHATSAPP_SEND_FAILED' }, 500)
      }
      return jsonResponse({ user_id, phone, requires_otp: true, debug_otp: otp_code }, 201)
    }

    const isDebugEnabled = Deno.env.get('DEBUG_OTP_ENABLED') === 'true'
    return jsonResponse({
      user_id,
      phone,
      requires_otp: true,
      ...(isDebugEnabled ? { debug_otp: otp_code } : {})
    }, 201)
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PHONE_REGEX = /^\+591[678]\d{7}$/
const OTP_REGEX = /^\d{6}$/
const PIN_REGEX = /^\d{8}$/

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

    let body: { phone?: string; otp?: string; new_pin?: string }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'INVALID_JSON' }, 400)
    }

    const { phone, otp, new_pin } = body

    if (!phone || !PHONE_REGEX.test(phone)) {
      return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
    }
    if (!otp || !OTP_REGEX.test(otp)) {
      return jsonResponse({ error: 'INVALID_OTP_FORMAT' }, 400)
    }
    if (!new_pin || !PIN_REGEX.test(new_pin)) {
      return jsonResponse({ error: 'INVALID_PIN_FORMAT' }, 400)
    }

    // Fetch the profile to get user_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle()

    if (!profile) {
      return jsonResponse({ error: 'USER_NOT_FOUND' }, 404)
    }

    // Validate OTP
    const now = new Date().toISOString()
    const { data: otpRecord } = await supabase
      .from('otps')
      .select('id, code, expires_at, used')
      .eq('phone', phone)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otpRecord) {
      // Distinguish expired vs invalid
      const { data: expiredOtp } = await supabase
        .from('otps')
        .select('id')
        .eq('phone', phone)
        .eq('used', false)
        .lte('expires_at', now)
        .limit(1)
        .maybeSingle()

      return jsonResponse({ error: expiredOtp ? 'OTP_EXPIRED' : 'INVALID_OTP' }, 400)
    }

    if (otpRecord.code !== otp) {
      return jsonResponse({ error: 'INVALID_OTP' }, 400)
    }

    // Mark OTP as used
    await supabase.from('otps').update({ used: true }).eq('id', otpRecord.id)

    // Update the password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.user_id, {
      password: new_pin,
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return jsonResponse({ error: 'RESET_FAILED', details: updateError.message }, 500)
    }

    return jsonResponse({ reset: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendWhatsAppOtp } from '../_shared/whatsapp.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PHONE_REGEX = /^\+591[678]\d{7}$/

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

    let body: { phone?: string }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'INVALID_JSON' }, 400)
    }

    const { phone } = body
    if (!phone || !PHONE_REGEX.test(phone)) {
      return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
    }

    // Verify the phone belongs to a registered account
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle()

    if (!profile) {
      return jsonResponse({ error: 'USER_NOT_FOUND' }, 404)
    }

    // Invalidate previous unused OTPs for this phone
    await supabase.from('otps').update({ used: true }).eq('phone', phone).eq('used', false)

    // Generate reset OTP
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
      return jsonResponse({ error: 'OTP_CREATE_FAILED', details: otpError.message }, 500)
    }

    try {
      await sendWhatsAppOtp(phone, otp_code)
    } catch (waErr) {
      console.error('WhatsApp send error:', waErr)
      const isNotConfigured = String(waErr).includes('WHATSAPP_NOT_CONFIGURED')
      if (!isNotConfigured) {
        return jsonResponse({ error: 'WHATSAPP_SEND_FAILED' }, 500)
      }
      return jsonResponse({ sent: true, debug_otp: otp_code })
    }

    return jsonResponse({ sent: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }
})

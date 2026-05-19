import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface ResendBody {
  phone: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: ResendBody
  try {
    body = await req.json() as ResendBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const { phone } = body
  if (!phone) {
    return errorResponse('MISSING_FIELDS', 'phone is required', 400)
  }

  if (!/^\+591[678]\d{7}$/.test(phone)) {
    return errorResponse('INVALID_PHONE_FORMAT', 'Invalid Bolivian phone number', 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Find the user_id linked to this phone
  const { data: profile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return errorResponse('USER_NOT_FOUND', 'No account found for this phone number', 404)
  }

  // Rate-limit: block if an unused, non-expired OTP was issued in the last 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
  const { data: recentOtp } = await adminClient
    .from('otps')
    .select('id')
    .eq('phone', phone)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .gt('created_at', oneMinuteAgo)
    .maybeSingle()

  if (recentOtp) {
    return errorResponse('RATE_LIMITED', 'Please wait at least 60 seconds before requesting a new code', 429)
  }

  // Invalidate all existing unused OTPs for this phone
  await adminClient
    .from('otps')
    .update({ used: true })
    .eq('phone', phone)
    .eq('used', false)

  // Issue a fresh OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error: insertError } = await adminClient
    .from('otps')
    .insert({ user_id: profile.user_id, phone, otp, expires_at: expiresAt })

  if (insertError) {
    return errorResponse('OTP_FAILED', 'Failed to generate verification code', 500)
  }

  // In production: send OTP via Firebase/Twilio SMS here.
  const isDev = Deno.env.get('SUPABASE_ENV') === 'local' ||
    Deno.env.get('NODE_ENV') === 'development'

  return jsonResponse(
    { sent: true, ...(isDev ? { debug_otp: otp } : {}) },
    200
  )
})

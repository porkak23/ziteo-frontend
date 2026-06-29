import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface OtpVerifyBody {
  phone: string
  otp: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405, req)

  let body: OtpVerifyBody
  try {
    body = await req.json() as OtpVerifyBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400, req)
  }

  const { phone, otp } = body
  if (!phone || !otp) {
    return errorResponse('MISSING_FIELDS', 'phone and otp are required', 400, req)
  }

  if (!/^\d{6}$/.test(otp)) {
    return errorResponse('INVALID_OTP', 'OTP must be exactly 6 digits', 400, req)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Rate-limit OTP guessing: max 5 attempts per phone per 15 minutes
  const { data: throttled } = await adminClient.rpc('check_throttle', {
    p_identifier: `otp_verify:${phone}`,
    p_max_attempts: 5,
    p_window_minutes: 15,
  })
  if (throttled === true) {
    return errorResponse('RATE_LIMITED', 'Too many attempts. Please wait 15 minutes before trying again.', 429, req)
  }

  const now = new Date().toISOString()

  // Find a valid, unexpired, unused OTP — column is `code` (not `otp`)
  const { data: otpRecord, error: otpError } = await adminClient
    .from('otps')
    .select('id, code, expires_at, used')
    .eq('phone', phone)
    .eq('used', false)
    .eq('purpose', 'verify_phone')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpError) {
    return errorResponse('OTP_LOOKUP_FAILED', 'Failed to verify OTP', 500, req)
  }

  if (!otpRecord) {
    // Distinguish expired vs never-sent
    const { data: expiredRecord } = await adminClient
      .from('otps')
      .select('id')
      .eq('phone', phone)
      .eq('used', false)
      .eq('purpose', 'verify_phone')
      .lte('expires_at', now)
      .maybeSingle()

    if (expiredRecord) {
      return errorResponse('OTP_EXPIRED', 'This code has expired. Please request a new one.', 410, req)
    }
    return errorResponse('INVALID_OTP', 'Invalid verification code', 400, req)
  }

  if (otpRecord.code !== otp) {
    return errorResponse('INVALID_OTP', 'Invalid verification code', 400, req)
  }

  // Mark as used
  await adminClient.from('otps').update({ used: true }).eq('id', otpRecord.id)

  // Look up user_id via profiles (otps table has no user_id column)
  const { data: profile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return errorResponse('PHONE_NOT_FOUND', 'No account found for this phone', 404, req)
  }

  // Mark onboarding as completed now that phone is verified
  await adminClient
    .from('user_roles')
    .update({ onboarding_completed: true })
    .eq('user_id', profile.user_id)

  return jsonResponse({ phone_confirmed: true, user_id: profile.user_id }, 200, {}, req)
})

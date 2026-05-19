import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface OtpVerifyBody {
  phone: string
  otp: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: OtpVerifyBody
  try {
    body = await req.json() as OtpVerifyBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const { phone, otp } = body
  if (!phone || !otp) {
    return errorResponse('MISSING_FIELDS', 'phone and otp are required', 400)
  }

  if (!/^\d{6}$/.test(otp)) {
    return errorResponse('INVALID_OTP', 'OTP must be exactly 6 digits', 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Find a valid, unexpired OTP record for this phone number
  const { data: otpRecord, error: otpError } = await adminClient
    .from('otps')
    .select('id, user_id, otp, expires_at, used')
    .eq('phone', phone)
    .eq('otp', otp)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpError) {
    return errorResponse('OTP_LOOKUP_FAILED', 'Failed to verify OTP', 500)
  }

  if (!otpRecord) {
    // Check if an OTP exists but is expired to give a better error
    const { data: expiredRecord } = await adminClient
      .from('otps')
      .select('id')
      .eq('phone', phone)
      .eq('otp', otp)
      .maybeSingle()

    if (expiredRecord) {
      return errorResponse('OTP_EXPIRED', 'This code has expired, please request a new one', 400)
    }
    return errorResponse('INVALID_OTP', 'Invalid verification code', 400)
  }

  // Mark OTP as used to prevent replay attacks
  await adminClient
    .from('otps')
    .update({ used: true })
    .eq('id', otpRecord.id)

  // Confirm the user's email in Supabase Auth so they can sign in
  const { error: confirmError } = await adminClient.auth.admin.updateUserById(
    otpRecord.user_id,
    { email_confirm: true }
  )

  if (confirmError) {
    return errorResponse('CONFIRM_FAILED', 'Failed to confirm phone number', 500)
  }

  return jsonResponse({ phone_confirmed: true, user_id: otpRecord.user_id }, 200)
})

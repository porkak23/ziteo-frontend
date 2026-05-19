import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface ResetPinBody {
  phone: string
  otp: string
  new_pin: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: ResetPinBody
  try {
    body = await req.json() as ResetPinBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const { phone, otp, new_pin } = body
  if (!phone || !otp || !new_pin) {
    return errorResponse('MISSING_FIELDS', 'phone, otp, and new_pin are required', 400)
  }

  if (!/^\d{6}$/.test(otp)) {
    return errorResponse('INVALID_OTP', 'OTP must be exactly 6 digits', 400)
  }

  if (!/^\d{8}$/.test(new_pin)) {
    return errorResponse('INVALID_PIN_FORMAT', 'New PIN must be exactly 8 numeric digits', 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Validate the OTP
  const { data: otpRecord } = await adminClient
    .from('otps')
    .select('id, user_id, expires_at, used')
    .eq('phone', phone)
    .eq('otp', otp)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!otpRecord) {
    return errorResponse('INVALID_OTP', 'Invalid or expired verification code', 400)
  }

  // Mark OTP as used immediately to prevent replay
  await adminClient
    .from('otps')
    .update({ used: true })
    .eq('id', otpRecord.id)

  // Update the auth user's password (PIN) via the admin API
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    otpRecord.user_id,
    { password: new_pin }
  )

  if (updateError) {
    return errorResponse('RESET_FAILED', 'Failed to update PIN', 500)
  }

  return jsonResponse({ reset: true }, 200)
})

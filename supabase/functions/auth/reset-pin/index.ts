import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { getOtpProvider } from '../../_shared/otp-provider.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface ResetPinBody {
  phone: string
  code: string
  new_pin: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405, req)

  let body: ResetPinBody
  try {
    body = await req.json() as ResetPinBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400, req)
  }

  const { phone, code, new_pin } = body
  if (!phone || !code || !new_pin) {
    return errorResponse('MISSING_FIELDS', 'phone, code, and new_pin are required', 400, req)
  }

  if (!/^\d{6}$/.test(new_pin)) {
    return errorResponse('INVALID_PIN_FORMAT', 'New PIN must be exactly 6 numeric digits', 400, req)
  }

  const provider = getOtpProvider()

  // Con Firebase, `code` es el ID token del cliente (no 6 dígitos).
  if (provider.name === 'whatsapp' && !/^\d{6}$/.test(code)) {
    return errorResponse('INVALID_CODE_FORMAT', 'Code must be exactly 6 numeric digits', 400, req)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Rate-limit code guessing: max 5 attempts per phone per 15 minutes.
  // Fail-closed: an RPC error is treated as throttled.
  const { data: throttled, error: throttleErr } = await adminClient.rpc('check_throttle', {
    p_identifier: `reset_pin:${phone}`,
    p_max_attempts: 5,
    p_window_minutes: 15,
  })
  if (throttleErr || throttled === true) {
    return errorResponse('RATE_LIMITED', 'Too many attempts. Please wait 15 minutes before trying again.', 429, req)
  }

  let verifyResult
  try {
    verifyResult = await provider.verify(adminClient, phone, code, 'reset_pin')
  } catch (err) {
    console.error('Reset-pin verify error:', err)
    return errorResponse('OTP_LOOKUP_FAILED', 'Failed to verify code', 500, req)
  }

  if (!verifyResult.ok) {
    if (verifyResult.reason === 'EXPIRED') {
      return errorResponse('OTP_EXPIRED', 'This code has expired. Please request a new one.', 410, req)
    }
    return errorResponse('INVALID_CODE', 'Invalid or unrecognized verification code', 400, req)
  }

  // Look up user by phone
  const { data: profile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return errorResponse('USER_NOT_FOUND', 'No account found for this phone number', 404, req)
  }

  // Update the auth user's password (PIN)
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    profile.user_id,
    { password: new_pin }
  )

  if (updateError) {
    return errorResponse('RESET_FAILED', 'Failed to update PIN', 500, req)
  }

  // Revoke all existing sessions so stolen refresh tokens can't be reused after a PIN reset
  await adminClient.auth.admin.signOut(profile.user_id, 'others')

  return jsonResponse({ reset: true }, 200, {}, req)
})

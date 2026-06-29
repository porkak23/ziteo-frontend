import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse, isDevOrigin } from '../../_shared/cors.ts'
import { sendOtp } from '../../_shared/otp-sender.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface ForgotPinBody {
  phone: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405, req)

  let body: ForgotPinBody
  try {
    body = await req.json() as ForgotPinBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400, req)
  }

  const { phone } = body
  if (!phone || !/^\+591[678]\d{7}$/.test(phone)) {
    return errorResponse('INVALID_PHONE_FORMAT', 'Phone must be a valid Bolivian number (+591 + 8 digits)', 400, req)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: profile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return errorResponse('USER_NOT_FOUND', 'No account found for this phone number', 404, req)
  }

  // Invalidate all existing unused OTPs for this phone
  await adminClient.from('otps').update({ used: true }).eq('phone', phone).eq('used', false)

  const otpCode = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error: otpError } = await adminClient
    .from('otps')
    .insert({ phone, code: otpCode, expires_at: expiresAt, used: false, purpose: 'reset_pin' })

  if (otpError) {
    console.error('OTP insert error:', otpError)
    return errorResponse('OTP_CREATE_FAILED', 'Failed to generate verification code', 500, req)
  }

  // Send via WhatsApp (primary) with automatic SMS fallback
  try {
    await sendOtp(phone, otpCode)
  } catch (waErr) {
    const isNotConfigured = String(waErr).includes('OTP_NOT_CONFIGURED')
    if (!isNotConfigured) {
      console.error('OTP send error:', waErr)
      return errorResponse('WHATSAPP_SEND_FAILED', 'Failed to send code via WhatsApp', 500, req)
    }
    const payload: Record<string, unknown> = { sent: true }
    if (isDevOrigin(req)) payload.debug_otp = otpCode
    return jsonResponse(payload, 200, {}, req)
  }

  const successPayload: Record<string, unknown> = { sent: true }
  if (isDevOrigin(req)) successPayload.debug_otp = otpCode
  return jsonResponse(successPayload, 200, {}, req)
})

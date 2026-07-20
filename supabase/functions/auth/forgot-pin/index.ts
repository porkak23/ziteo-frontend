import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { getOtpProvider } from '../../_shared/otp-provider.ts'

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

  // Rate-limit resend spam: max 5 requests per phone per 15 minutes.
  // Fail-closed: an RPC error is treated as throttled.
  const { data: throttled, error: throttleErr } = await adminClient.rpc('check_throttle', {
    p_identifier: `forgot_pin:${phone}`,
    p_max_attempts: 5,
    p_window_minutes: 15,
  })
  if (throttleErr || throttled === true) {
    return errorResponse('RATE_LIMITED', 'Too many attempts. Please wait 15 minutes before trying again.', 429, req)
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return errorResponse('USER_NOT_FOUND', 'No account found for this phone number', 404, req)
  }

  const provider = getOtpProvider()
  let issueResult
  try {
    issueResult = await provider.issue(adminClient, phone, 'reset_pin', req)
  } catch (err) {
    console.error('OTP issue error:', err)
    const code = String(err).includes('WHATSAPP_SEND_FAILED') ? 'WHATSAPP_SEND_FAILED' : 'OTP_CREATE_FAILED'
    return errorResponse(code, 'Failed to send verification code', 500, req)
  }

  const payload: Record<string, unknown> = { sent: issueResult.channel === 'server', otp_provider: provider.name }
  if (issueResult.debug_otp) payload.debug_otp = issueResult.debug_otp
  return jsonResponse(payload, 200, {}, req)
})

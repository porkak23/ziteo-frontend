import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { getOtpProvider } from '../../_shared/otp-provider.ts'
import { isIpThrottled } from '../../_shared/ip-throttle.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface ResendBody {
  phone: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405, req)

  let body: ResendBody
  try {
    body = await req.json() as ResendBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400, req)
  }

  const { phone } = body
  if (!phone) {
    return errorResponse('MISSING_FIELDS', 'phone is required', 400, req)
  }

  if (!/^\+591[678]\d{7}$/.test(phone)) {
    return errorResponse('INVALID_PHONE_FORMAT', 'Invalid Bolivian phone number', 400, req)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Rate-limit por IP: corta el bot que rota números para quemar saldo de SMS.
  if (await isIpThrottled(adminClient, req)) {
    return errorResponse('RATE_LIMITED', 'Too many requests from this network. Please try again later.', 429, req)
  }

  // Verify the phone belongs to a registered account
  const { data: profile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return errorResponse('USER_NOT_FOUND', 'No account found for this phone number', 404, req)
  }

  const provider = getOtpProvider()

  // El cooldown de reenvío solo aplica al canal servidor (WhatsApp/SMS ya
  // enviados desde aquí). Con Firebase, el reenvío lo dispara el cliente.
  if (provider.name === 'whatsapp') {
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
      return errorResponse('RATE_LIMITED', 'Please wait at least 60 seconds before requesting a new code', 429, req)
    }
  }

  let issueResult
  try {
    issueResult = await provider.issue(adminClient, phone, 'verify_phone', req)
  } catch (err) {
    console.error('OTP resend error:', err)
    const code = String(err).includes('WHATSAPP_SEND_FAILED') ? 'WHATSAPP_SEND_FAILED' : 'OTP_FAILED'
    return errorResponse(code, 'Failed to resend verification code', 500, req)
  }

  const payload: Record<string, unknown> = { sent: issueResult.channel === 'server', otp_provider: provider.name }
  if (issueResult.debug_otp) payload.debug_otp = issueResult.debug_otp
  return jsonResponse(payload, 200, {}, req)
})

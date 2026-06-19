import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID') ?? ''

interface ResetPinBody {
  phone: string
  code: string
  new_pin: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: ResetPinBody
  try {
    body = await req.json() as ResetPinBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const { phone, code, new_pin } = body
  if (!phone || !code || !new_pin) {
    return errorResponse('MISSING_FIELDS', 'phone, code, and new_pin are required', 400)
  }

  if (!/^\d{6}$/.test(new_pin)) {
    return errorResponse('INVALID_PIN_FORMAT', 'New PIN must be exactly 6 numeric digits', 400)
  }

  // Verify the WhatsApp OTP against Twilio server-side before changing the PIN
  const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationChecks`
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

  const params = new URLSearchParams()
  params.set('To', phone)
  params.set('Code', code)

  let twilioRes: Response
  try {
    twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error reaching Twilio'
    return errorResponse('TWILIO_ERROR', message, 502)
  }

  if (!twilioRes.ok) {
    let twilioMessage = `Twilio error ${twilioRes.status}`
    try {
      const errBody = await twilioRes.json() as { message?: string }
      if (errBody.message) twilioMessage = errBody.message
    } catch {
      // ignore parse errors
    }
    return errorResponse('TWILIO_ERROR', twilioMessage, 502)
  }

  const twilioData = await twilioRes.json() as { status: string }

  if (twilioData.status !== 'approved') {
    return errorResponse('INVALID_CODE', 'Invalid or expired verification code', 400)
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Look up the user by phone to get the auth user ID
  const { data: profile } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return errorResponse('USER_NOT_FOUND', 'No account found for this phone number', 404)
  }

  // Update the auth user's password (PIN) via the admin API
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    profile.user_id,
    { password: new_pin }
  )

  if (updateError) {
    return errorResponse('RESET_FAILED', 'Failed to update PIN', 500)
  }

  return jsonResponse({ reset: true }, 200, {}, req)
})

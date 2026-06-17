import { handleOptions, jsonResponse, errorResponse } from '../../../_shared/cors.ts'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID') ?? ''

interface VerifyStartBody {
  phone: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405, req)

  let body: VerifyStartBody
  try {
    body = await req.json() as VerifyStartBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400, req)
  }

  const { phone } = body

  if (!phone) {
    return errorResponse('MISSING_FIELDS', 'phone is required', 400, req)
  }

  // Validate Bolivian phone format
  if (!/^\+591[678]\d{7}$/.test(phone)) {
    return errorResponse('INVALID_PHONE_FORMAT', 'Phone must be a valid Bolivian number (+591 + 8 digits)', 400, req)
  }

  const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

  const params = new URLSearchParams()
  params.set('To', phone)
  params.set('Channel', 'whatsapp')

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
    return errorResponse('TWILIO_ERROR', message, 502, req)
  }

  if (!twilioRes.ok) {
    if (twilioRes.status === 429) {
      return errorResponse('RATE_LIMIT', 'Demasiados intentos, espera antes de reenviar.', 429, req)
    }
    let twilioMessage = `Twilio error ${twilioRes.status}`
    try {
      const errBody = await twilioRes.json() as { message?: string }
      if (errBody.message) twilioMessage = errBody.message
    } catch {
      // ignore parse errors
    }
    return errorResponse('TWILIO_ERROR', twilioMessage, 502, req)
  }

  return jsonResponse({ sent: true, channel: 'whatsapp' }, 200, {}, req)
})

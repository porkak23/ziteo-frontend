import { handleOptions, jsonResponse, errorResponse } from '../../../_shared/cors.ts'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID') ?? ''

interface VerifyCheckBody {
  phone: string
  code: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: VerifyCheckBody
  try {
    body = await req.json() as VerifyCheckBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400)
  }

  const { phone, code } = body

  if (!phone || !code) {
    return errorResponse('MISSING_FIELDS', 'phone and code are required', 400)
  }

  // Validate Bolivian phone format
  if (!/^\+591[678]\d{7}$/.test(phone)) {
    return errorResponse('INVALID_PHONE_FORMAT', 'Phone must be a valid Bolivian number (+591 + 8 digits)', 400)
  }

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

  if (twilioData.status === 'approved') {
    return jsonResponse({ verified: true }, 200, {}, req)
  }

  // status === 'pending' means wrong code
  return errorResponse('INVALID_CODE', 'Codigo incorrecto', 400)
})

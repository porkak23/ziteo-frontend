// Twilio SMS fallback for OTP delivery.
// Mirrors the signature of sendWhatsAppOtp (_shared/whatsapp.ts) so the OTP
// orchestrator can swap transports transparently. Uses the Messages API:
// Twilio only carries the code that the backend already generated and stored
// in the `otps` table — verification logic is unchanged.

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01'

export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')
  const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER')

  // Need credentials and at least one sender identity.
  if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
    throw new Error('TWILIO_NOT_CONFIGURED')
  }

  const params = new URLSearchParams()
  params.set('To', phone)
  if (messagingServiceSid) {
    params.set('MessagingServiceSid', messagingServiceSid)
  } else {
    params.set('From', fromNumber as string)
  }
  params.set('Body', `Tu codigo Ziteoo es ${otp}. Vence en 5 minutos.`)

  const credentials = btoa(`${accountSid}:${authToken}`)

  const res = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.error('Twilio API error:', body)
    throw new Error(`TWILIO_SEND_FAILED: ${JSON.stringify(body)}`)
  }
}

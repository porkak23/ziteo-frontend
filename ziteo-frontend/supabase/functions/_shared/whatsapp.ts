const GRAPH_API_VERSION = 'v19.0'

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  const templateName = Deno.env.get('WHATSAPP_TEMPLATE_NAME') ?? 'ziteo_otp'

  if (!accessToken || !phoneNumberId) {
    throw new Error('WHATSAPP_NOT_CONFIGURED')
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otp }],
            },
          ],
        },
      }),
    }
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.error('WhatsApp API error:', body)
    throw new Error(`WHATSAPP_SEND_FAILED: ${JSON.stringify(body)}`)
  }
}

import type { ClientOtpProvider } from './types'

// El servidor ya generó y envió el código (WhatsApp/SMS) al invocar
// register/resend/forgot-pin — no hay nada que hacer del lado del cliente.
export const whatsappClientProvider: ClientOtpProvider = {
  name: 'whatsapp',
  requestCode: async () => {},
  getProof: async (code: string) => code,
}

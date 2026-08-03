import type { ClientOtpProvider } from './types'
import { whatsappClientProvider } from './whatsappProvider'

export { RECAPTCHA_CONTAINER_ID } from './constants'
export type { ClientOtpProvider } from './types'

// Literal-foldable: Vite elimina en build time la rama del import dinámico no
// alcanzable, así que el SDK de Firebase (y firebaseClient.ts) nunca entra al
// bundle cuando el proveedor activo es whatsapp.
const OTP_PROVIDER = import.meta.env.VITE_OTP_PROVIDER === 'whatsapp' ? 'whatsapp' : 'firebase'

let cached: ClientOtpProvider | null = null

export async function getClientOtpProvider(): Promise<ClientOtpProvider> {
  if (cached) return cached
  if (OTP_PROVIDER === 'firebase') {
    const { firebaseClientProvider } = await import('./firebaseProvider')
    cached = firebaseClientProvider
  } else {
    cached = whatsappClientProvider
  }
  return cached
}

// _shared/otp-provider.ts — Puerto (arquitectura hexagonal) para el envío y
// verificación de OTP. El proveedor activo se elige por el secret
// OTP_PROVIDER ('whatsapp' | 'firebase'), default 'whatsapp' (cero cambio de
// comportamiento si el secret no está seteado).
//
// issue():  emite el código. channel='server' significa que este backend ya
//           generó y envió el código (WhatsApp/SMS); channel='client' significa
//           que el frontend debe emitirlo por su cuenta (Firebase Phone Auth).
// verify(): valida la prueba entregada por el cliente. Para 'whatsapp' la
//           prueba es el código de 6 dígitos; para 'firebase' es el ID token.
//
// Para volver a WhatsApp: quitar/vaciar el secret OTP_PROVIDER. Cero cambios
// de código.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { whatsappOtpAdapter } from './otp-whatsapp-adapter.ts'
import { firebaseOtpAdapter } from './otp-firebase-adapter.ts'

export type OtpPurpose = 'verify_phone' | 'reset_pin'

export interface OtpIssueResult {
  channel: 'server' | 'client'
  debug_otp?: string
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'EXPIRED' | 'INVALID' }

export interface OtpProvider {
  readonly name: 'whatsapp' | 'firebase'
  issue(admin: SupabaseClient, phone: string, purpose: OtpPurpose, req: Request): Promise<OtpIssueResult>
  verify(admin: SupabaseClient, phone: string, proof: string, purpose: OtpPurpose): Promise<OtpVerifyResult>
}

export function getOtpProvider(): OtpProvider {
  const name = Deno.env.get('OTP_PROVIDER') === 'firebase' ? 'firebase' : 'whatsapp'
  return name === 'firebase' ? firebaseOtpAdapter : whatsappOtpAdapter
}

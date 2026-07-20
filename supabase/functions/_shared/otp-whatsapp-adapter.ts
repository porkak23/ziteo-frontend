// _shared/otp-whatsapp-adapter.ts — Adaptador que envuelve la lógica OTP
// actual (server-side: genera el código de 6 dígitos, lo guarda en `otps`,
// lo entrega vía sendOtp() que ya orquesta WhatsApp Meta → Twilio SMS).
//
// Este archivo NO reescribe la lógica: la mueve tal cual estaba duplicada en
// register/otp-resend/forgot-pin (issue) y otp-verify/reset-pin (verify), para
// que el switch de proveedor no cambie el comportamiento de WhatsApp en nada.
// whatsapp.ts, twilio.ts y otp-sender.ts permanecen intocados.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendOtp } from './otp-sender.ts'
import { isDevOrigin } from './cors.ts'
import type { OtpIssueResult, OtpProvider, OtpPurpose, OtpVerifyResult } from './otp-provider.ts'

async function issue(
  admin: SupabaseClient,
  phone: string,
  purpose: OtpPurpose,
  req: Request
): Promise<OtpIssueResult> {
  // Invalida cualquier OTP previo no usado para este teléfono+propósito.
  await admin.from('otps').update({ used: true }).eq('phone', phone).eq('used', false).eq('purpose', purpose)

  const otpCode = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error: otpError } = await admin
    .from('otps')
    .insert({ phone, code: otpCode, expires_at: expiresAt, used: false, purpose })

  if (otpError) {
    console.error('[otp-whatsapp-adapter] OTP insert error:', otpError)
    throw new Error('OTP_CREATE_FAILED')
  }

  try {
    await sendOtp(phone, otpCode)
  } catch (err) {
    const notConfigured = String(err).includes('OTP_NOT_CONFIGURED')
    if (!notConfigured) {
      console.error('[otp-whatsapp-adapter] send error:', err)
      throw new Error('WHATSAPP_SEND_FAILED')
    }
    // Ningún transporte configurado: rama debug_otp solo en orígenes dev.
    return { channel: 'server', debug_otp: isDevOrigin(req) ? otpCode : undefined }
  }

  return { channel: 'server', debug_otp: isDevOrigin(req) ? otpCode : undefined }
}

async function verify(
  admin: SupabaseClient,
  phone: string,
  proof: string,
  purpose: OtpPurpose
): Promise<OtpVerifyResult> {
  const now = new Date().toISOString()

  const { data: otpRecord, error: otpError } = await admin
    .from('otps')
    .select('id, code, expires_at, used')
    .eq('phone', phone)
    .eq('used', false)
    .eq('purpose', purpose)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpError) {
    throw new Error('OTP_LOOKUP_FAILED')
  }

  if (!otpRecord) {
    const { data: expiredRecord } = await admin
      .from('otps')
      .select('id')
      .eq('phone', phone)
      .eq('used', false)
      .eq('purpose', purpose)
      .lte('expires_at', now)
      .maybeSingle()

    return { ok: false, reason: expiredRecord ? 'EXPIRED' : 'INVALID' }
  }

  if (otpRecord.code !== proof) {
    return { ok: false, reason: 'INVALID' }
  }

  await admin.from('otps').update({ used: true }).eq('id', otpRecord.id)
  return { ok: true }
}

export const whatsappOtpAdapter: OtpProvider = {
  name: 'whatsapp',
  issue,
  verify,
}

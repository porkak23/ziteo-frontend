// OTP delivery orchestrator.
// Strategy (confirmed with product): WhatsApp via Meta is the FIXED primary
// transport. If Meta fails for any reason (template not yet approved by Meta,
// send error, or not configured), the same code is automatically retried over
// SMS via Twilio. The Meta path (_shared/whatsapp.ts) is never modified.
//
// Error contract for callers:
//   - throws Error containing 'OTP_NOT_CONFIGURED' when NEITHER transport is
//     configured (callers use this to enable the dev-only debug_otp branch).
//   - throws Error containing 'OTP_SEND_FAILED' when a configured transport
//     actually failed to deliver.

import { sendWhatsAppOtp } from './whatsapp.ts'
import { sendSmsOtp } from './twilio.ts'

function isNotConfigured(err: unknown): boolean {
  const msg = String(err)
  return msg.includes('WHATSAPP_NOT_CONFIGURED') || msg.includes('TWILIO_NOT_CONFIGURED')
}

export async function sendOtp(phone: string, otp: string): Promise<void> {
  // 1. Primary: WhatsApp via Meta.
  try {
    await sendWhatsAppOtp(phone, otp)
    return
  } catch (waErr) {
    console.error('[sendOtp] WhatsApp transport failed, attempting SMS fallback:', String(waErr))

    // 2. Fallback: SMS via Twilio.
    try {
      await sendSmsOtp(phone, otp)
      return
    } catch (smsErr) {
      console.error('[sendOtp] SMS fallback failed:', String(smsErr))

      // Both transports unavailable because nothing is configured -> let the
      // caller fall through to the dev-only debug_otp branch.
      if (isNotConfigured(waErr) && isNotConfigured(smsErr)) {
        throw new Error('OTP_NOT_CONFIGURED')
      }

      // At least one transport was configured but delivery failed.
      throw new Error(
        `OTP_SEND_FAILED: whatsapp=${String(waErr)} sms=${String(smsErr)}`
      )
    }
  }
}

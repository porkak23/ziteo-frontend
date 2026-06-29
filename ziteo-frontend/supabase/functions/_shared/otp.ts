// Shared OTP helpers.

/**
 * Generate a 6-digit OTP using a CSPRNG (crypto.getRandomValues).
 * Math.random() is NOT cryptographically secure and must not be used for OTPs.
 */
export function generateOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return String(n).padStart(6, '0')
}

/**
 * Whether the OTP code may be echoed back in the HTTP response.
 * This is a development-only escape hatch for when WhatsApp delivery is not
 * configured. It MUST be false in production — set ALLOW_DEBUG_OTP=true only
 * in local/staging Edge Function secrets.
 */
export function debugOtpEnabled(): boolean {
  return Deno.env.get('ALLOW_DEBUG_OTP') === 'true'
}

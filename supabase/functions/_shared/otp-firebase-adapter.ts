// _shared/otp-firebase-adapter.ts — Adaptador Firebase Phone Auth.
//
// Firebase NO permite que el servidor genere/envíe un código arbitrario: el
// SDK del cliente (signInWithPhoneNumber + reCAPTCHA) es quien emite y valida
// el código, entregando al frontend un ID token firmado por Google. Por eso:
//   - issue()  es un no-op del servidor: retorna channel:'client' para que el
//              frontend sepa que debe invocar Firebase directamente.
//   - verify() recibe el ID token como `proof` y lo valida sin Admin SDK
//              (verificación JWT contra el JWKS público de Google), evitando
//              cargar el SDK Admin completo en el Edge Function.
//
// Requiere el secret FIREBASE_PROJECT_ID.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jwtVerify, createRemoteJWKSet } from 'https://esm.sh/jose@5'
import type { OtpIssueResult, OtpProvider, OtpPurpose, OtpVerifyResult } from './otp-provider.ts'

const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') ?? ''

// JWKS de Google cacheado a nivel de módulo (createRemoteJWKSet ya cachea
// internamente las claves entre invocaciones dentro del mismo proceso).
const GOOGLE_SECURE_TOKEN_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com')
)

function issue(): Promise<OtpIssueResult> {
  return Promise.resolve({ channel: 'client' })
}

async function verify(
  admin: SupabaseClient,
  phone: string,
  proof: string,
  purpose: OtpPurpose
): Promise<OtpVerifyResult> {
  if (!FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_NOT_CONFIGURED')
  }
  if (!proof) {
    return { ok: false, reason: 'INVALID' }
  }

  let payload: Record<string, unknown>
  try {
    const result = await jwtVerify(proof, GOOGLE_SECURE_TOKEN_JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    })
    payload = result.payload as Record<string, unknown>
  } catch (err) {
    const msg = String(err)
    // jose lanza JWTExpired específicamente cuando `exp` ya pasó.
    if (msg.includes('exp') || msg.toLowerCase().includes('expired')) {
      return { ok: false, reason: 'EXPIRED' }
    }
    return { ok: false, reason: 'INVALID' }
  }

  // Anti-suplantación: el número verificado por Firebase debe coincidir con
  // el teléfono que el endpoint está procesando.
  if (payload.phone_number !== phone) {
    return { ok: false, reason: 'INVALID' }
  }

  // Anti-replay: un mismo ID token no debe poder reutilizarse. Usamos el
  // claim `auth_time` (segundos, momento en que el usuario completó el SMS)
  // — si es mayor a 10 minutos de antigüedad lo tratamos como expirado, y
  // registramos el jti consumido en `otps` para bloquear reintentos exactos.
  const authTime = typeof payload.auth_time === 'number' ? payload.auth_time : 0
  const ageSeconds = Date.now() / 1000 - authTime
  if (ageSeconds > 600) {
    return { ok: false, reason: 'EXPIRED' }
  }

  const jti = String(payload.sub ?? '') + ':' + String(payload.auth_time ?? '')
  const { data: alreadyUsed } = await admin
    .from('otps')
    .select('id')
    .eq('phone', phone)
    .eq('code', jti)
    .eq('purpose', purpose)
    .eq('used', true)
    .maybeSingle()

  if (alreadyUsed) {
    return { ok: false, reason: 'INVALID' }
  }

  // Registrar el token como consumido (fila ya `used:true`, no se verifica
  // por expires_at — el anti-replay depende de auth_time arriba).
  // Fail-closed: si no podemos dejar constancia del jti, no hay garantía de
  // anti-replay, así que rechazamos en vez de aceptar a ciegas.
  const { error: insertError } = await admin.from('otps').insert({
    phone,
    code: jti,
    purpose,
    used: true,
    expires_at: new Date(Date.now() + 600 * 1000).toISOString(),
  })

  if (insertError) {
    console.error('[otp-firebase-adapter] no se pudo registrar el jti consumido:', insertError)
    return { ok: false, reason: 'INVALID' }
  }

  return { ok: true }
}

export const firebaseOtpAdapter: OtpProvider = {
  name: 'firebase',
  issue,
  verify,
}

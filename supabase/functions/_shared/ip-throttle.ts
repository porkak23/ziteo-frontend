// _shared/ip-throttle.ts — Límite por IP para los endpoints que disparan el
// envío de un SMS (register / otp-resend / forgot-pin).
//
// El throttle que ya existía es por teléfono: frena a quien insiste con el
// mismo número, pero no a un bot que rota números para quemar saldo de SMS
// (toll fraud). Con Firebase Phone Auth cada envío cuesta dinero, así que la
// dimensión IP importa tanto como la de teléfono.
//
// Reusa el RPC check_throttle (SECURITY DEFINER) — no hay tabla ni función
// nueva; solo un identificador distinto en la misma tabla auth_throttle.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 20/hora tolera a un usuario real que se equivoca y reintenta, e incluso a
// una oficina detrás de NAT, pero corta el envío masivo automatizado.
const MAX_SMS_PER_IP_PER_HOUR = 20
const WINDOW_MINUTES = 60

/**
 * Extrae la IP del cliente. En Supabase Edge Functions el proxy antepone la IP
 * real en x-forwarded-for; el primer elemento es el cliente.
 */
export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || req.headers.get('x-real-ip') || null
}

/**
 * True si esta IP ya superó su cuota de SMS por hora.
 *
 * Fail-closed ante un error del RPC, igual que los throttles por teléfono que
 * ya estaban en estos endpoints. Si no hay IP disponible no bloqueamos: el
 * throttle por teléfono sigue cubriendo ese caso.
 */
export async function isIpThrottled(admin: SupabaseClient, req: Request): Promise<boolean> {
  const ip = clientIp(req)
  if (!ip) return false

  const { data, error } = await admin.rpc('check_throttle', {
    p_identifier: `sms_ip:${ip}`,
    p_max_attempts: MAX_SMS_PER_IP_PER_HOUR,
    p_window_minutes: WINDOW_MINUTES,
  })

  return Boolean(error) || data === true
}

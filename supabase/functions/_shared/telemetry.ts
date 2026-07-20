// _shared/telemetry.ts — reporta la salud de cada request a
// edge_function_health (ver 20260719000006_admin_edge_health.sql), para
// que el Command Center admin sepa qué funciones están fallando o lentas.
//
// Adopción incremental: envolver el handler existente con withTelemetry()
// sin cambiar su lógica. Fire-and-forget — nunca bloquea ni afecta la
// respuesta real si el insert falla.
//
// Uso:
//   Deno.serve(withTelemetry('notifications-send-push', handler))

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function reportHealth(functionName: string, statusCode: number, durationMs: number, errorMessage?: string) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  db.from('edge_function_health')
    .insert({
      function_name: functionName,
      status_code: statusCode,
      duration_ms: durationMs,
      error_message: errorMessage ?? null,
    })
    .then(() => {}, () => {})
}

export function withTelemetry(
  functionName: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const start = Date.now()
    try {
      const res = await handler(req)
      reportHealth(functionName, res.status, Date.now() - start)
      return res
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      reportHealth(functionName, 500, Date.now() - start, message)
      throw err
    }
  }
}

// _shared/require-admin.ts — guard reutilizable para Edge Functions
// invocadas por un humano admin (no por cron ni por cualquier usuario
// autenticado). Extrae el patrón que ya vivía duplicado en
// admin-telemetry/index.ts y auth/add-role/index.ts: leer el JWT del
// caller, resolver el usuario, y verificar el rol admin en Postgres.
//
// Detalle crítico: el cliente devuelto usa ANON_KEY + el JWT del
// caller, nunca SERVICE_ROLE_KEY. is_admin()/is_admin_mfa() dependen
// de auth.uid(), que solo resuelve corriendo en contexto del usuario
// — con service_role auth.uid() es null y el chequeo pasaría siempre
// (o fallaría siempre), da igual: sería la validación incorrecta.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { errorResponse } from './cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

export interface RequireAdminOk {
  ok: true
  // deno-lint-ignore no-explicit-any
  user: any
  client: SupabaseClient
}

export interface RequireAdminFail {
  ok: false
  response: Response
}

/**
 * Valida que el request trae un JWT válido de un usuario admin.
 * Con { mfa: true } exige además que la sesión haya verificado un
 * segundo factor (aal2) — usar en cualquier escritura sensible
 * (reset de PIN, cambios de rol, etc.), nunca solo en lecturas.
 */
export async function requireAdmin(
  req: Request,
  opts: { mfa?: boolean } = {}
): Promise<RequireAdminOk | RequireAdminFail> {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, response: errorResponse('UNAUTHORIZED', 'Missing Authorization header', 401, req) }
  }
  const accessToken = authHeader.replace('Bearer ', '')

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) {
    return { ok: false, response: errorResponse('UNAUTHORIZED', 'Invalid or expired token', 401, req) }
  }

  const rpcName = opts.mfa ? 'is_admin_mfa' : 'is_admin'
  const { data: isAdmin, error: roleError } = await client.rpc(rpcName)
  if (roleError || !isAdmin) {
    const message = opts.mfa
      ? 'Admin role with verified second factor (aal2) required'
      : 'Admin role required'
    return { ok: false, response: errorResponse('FORBIDDEN', message, 403, req) }
  }

  return { ok: true, user, client }
}

// _shared/require-user.ts — guard para Edge Functions invocadas por un
// usuario autenticado cualquiera (no necesariamente admin). Complementa a
// require-admin.ts: mismo patrón de validación de JWT, sin el chequeo de rol.
//
// Existe porque las funciones de push las dispara el flujo normal de la app
// (un constructor que hace un pedido, un maestro que envía una oferta), así
// que exigir admin las rompería. Pero sin ningún guard corrían con
// SERVICE_ROLE_KEY sobre un body sin autenticar: cualquiera podía enviar
// notificaciones arbitrarias a cualquier user_id — phishing directo al
// usuario final.
//
// Mismo detalle crítico que en require-admin.ts: el cliente devuelto usa
// ANON_KEY + el JWT del caller, nunca SERVICE_ROLE_KEY, para que auth.uid()
// y las políticas RLS se evalúen en contexto del usuario real.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { errorResponse } from './cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

export interface RequireUserOk {
  ok: true
  // deno-lint-ignore no-explicit-any
  user: any
  client: SupabaseClient
}

export interface RequireUserFail {
  ok: false
  response: Response
}

/**
 * Valida que el request trae un JWT válido de un usuario autenticado.
 * El anon key NO sirve como credencial: es público (va en el bundle del
 * frontend), así que se rechaza explícitamente cualquier token que no
 * resuelva a un usuario real.
 */
export async function requireUser(req: Request): Promise<RequireUserOk | RequireUserFail> {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, response: errorResponse('UNAUTHORIZED', 'Missing Authorization header', 401, req) }
  }
  const accessToken = authHeader.replace('Bearer ', '')

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  // getUser() con el anon key devuelve error: el anon no representa a nadie.
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) {
    return { ok: false, response: errorResponse('UNAUTHORIZED', 'Invalid or expired token', 401, req) }
  }

  return { ok: true, user, client }
}

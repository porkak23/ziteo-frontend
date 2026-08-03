// admin-user-actions/index.ts — acciones administrativas sobre usuarios,
// empezando por el reset de PIN.
//
// Por qué existe: hasta hoy el único procedimiento de reset era manual
// (docs/RESET_PIN_ADMIN.md) usando el SERVICE_ROLE_KEY pegado a mano en una
// terminal — la llave maestra del proyecto circulando por manos y
// portapapeles humanos cada vez que alguien olvida su PIN. Esta función
// mueve esa llave detrás de un guard verificado en Postgres y dentro de un
// proceso auditado, sin que salga nunca del entorno de la Edge Function.
//
// Exige aal2 (segundo factor ya verificado en la sesión): resetear la
// credencial de cualquier usuario del sistema es una de las acciones de
// mayor impacto posibles en el panel, no puede depender solo del PIN de
// 6 dígitos del propio admin (ver 20260801000002_admin_role_hardening.sql).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/require-admin.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface ResetPinBody {
  action: 'reset_pin'
  target_user_id: string
  new_pin: string
}

type ActionBody = ResetPinBody

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405, req)

  const guard = await requireAdmin(req, { mfa: true })
  if (!guard.ok) return guard.response

  let body: ActionBody
  try {
    body = await req.json() as ActionBody
  } catch {
    return errorResponse('INVALID_JSON', 'Request body must be valid JSON', 400, req)
  }

  if (body.action !== 'reset_pin') {
    return errorResponse('INVALID_ACTION', 'action must be "reset_pin"', 400, req)
  }

  const { target_user_id, new_pin } = body
  if (!target_user_id || !new_pin) {
    return errorResponse('MISSING_FIELDS', 'target_user_id and new_pin are required', 400, req)
  }
  if (!/^\d{6}$/.test(new_pin)) {
    return errorResponse('INVALID_PIN_FORMAT', 'new_pin must be exactly 6 numeric digits', 400, req)
  }

  // service_role solo se usa aquí, después del guard, y nunca sale de la
  // función — ni en la respuesta ni en logs.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('user_id, phone, name')
    .eq('user_id', target_user_id)
    .maybeSingle()

  if (!targetProfile) {
    return errorResponse('USER_NOT_FOUND', 'No profile found for target_user_id', 404, req)
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    target_user_id,
    { password: new_pin }
  )
  if (updateError) {
    return errorResponse('RESET_FAILED', 'Failed to update PIN', 500, req)
  }

  // Mismo patrón que auth/reset-pin: invalidar sesiones existentes tras el
  // reset, para que un token robado antes del reset no siga sirviendo.
  await adminClient.auth.admin.signOut(target_user_id, 'others')

  // log_admin_action() usa auth.uid() para actor_user_id — debe llamarse con
  // el cliente del admin (guard.client, que trae su JWT), no con
  // adminClient/service_role (donde auth.uid() sería null y violaría el
  // NOT NULL de la columna).
  await guard.client.rpc('log_admin_action', {
    p_action: 'reset_pin',
    p_target_type: 'profiles',
    p_target_id: target_user_id,
    p_metadata: { target_phone: targetProfile.phone },
  })

  return jsonResponse({ reset: true, user_id: target_user_id }, 200, {}, req)
})

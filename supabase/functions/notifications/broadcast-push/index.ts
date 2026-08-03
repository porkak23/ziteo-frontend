// notifications/broadcast-push/index.ts — Web Push masivo para licitaciones de material/equipo
// Body: { licitacion_id: string, title: string, city: string | null }
// Consulta push_subscriptions de todos los proveedores de la ciudad y entrega el push.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { requireUser } from '../../_shared/require-user.ts'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@ziteo.bo'

// Exporta un handler (no llama a Deno.serve) porque notifications/index.ts
// enruta las sub-rutas importando el `default` de cada módulo. Con Deno.serve
// aquí, el router recibía `undefined` e invocarlo lanzaba — el broadcast
// nunca llegaba a ejecutarse.
async function rawHandler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST is accepted', 405, req)
  }

  const auth = await requireUser(req)
  if (!auth.ok) return auth.response

  let payload: { licitacion_id: string; title: string; city: string | null }
  try {
    payload = await req.json()
  } catch {
    return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400, req)
  }

  const { licitacion_id, title, city } = payload
  if (!licitacion_id || !title) {
    return errorResponse('MISSING_FIELDS', 'licitacion_id and title are required', 400, req)
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // Esta función entrega push a TODOS los proveedores de una ciudad. Sin
  // guard, cualquiera podía usarla como vector de phishing masivo. Se exige
  // sesión válida y, además, ser el dueño de la licitación: un usuario
  // autenticado no puede disparar un broadcast sobre una licitación ajena.
  const { data: licitacion, error: licErr } = await db
    .from('licitaciones')
    .select('constructor_id')
    .eq('id', licitacion_id)
    .maybeSingle()

  if (licErr) {
    console.error('[broadcast-push] licitacion lookup error:', licErr.message)
    return errorResponse('DB_ERROR', licErr.message, 500, req)
  }
  if (!licitacion) {
    return errorResponse('NOT_FOUND', 'Licitación not found', 404, req)
  }
  if (licitacion.constructor_id !== auth.user.id) {
    return errorResponse('FORBIDDEN', 'Only the owner of the licitación can broadcast it', 403, req)
  }

  // Buscar user_ids de proveedores en la ciudad (o todos si city es null)
  let rolesQuery = db
    .from('user_roles')
    .select('user_id, profiles!inner(city)')
    .eq('role', 'proveedor')

  if (city) {
    rolesQuery = rolesQuery.eq('profiles.city', city)
  }

  const { data: roleRows, error: rolesErr } = await rolesQuery
  if (rolesErr) {
    console.error('[broadcast-push] roles query error:', rolesErr.message)
    return errorResponse('DB_ERROR', rolesErr.message, 500, req)
  }

  if (!roleRows || roleRows.length === 0) {
    return jsonResponse({ sent: 0, total: 0, message: 'No providers found for city' }, 200, {}, req)
  }

  const providerIds = roleRows.map((r: { user_id: string }) => r.user_id)

  // Obtener todas las suscripciones push de esos proveedores
  const { data: subscriptions, error: subsErr } = await db
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
    .in('user_id', providerIds)

  if (subsErr) {
    console.error('[broadcast-push] subscriptions query error:', subsErr.message)
    return errorResponse('DB_ERROR', subsErr.message, 500, req)
  }

  if (!subscriptions || subscriptions.length === 0) {
    return jsonResponse({ sent: 0, total: 0, message: 'No push subscriptions found' }, 200, {}, req)
  }

  const notification = JSON.stringify({
    title,
    body: `Nueva solicitud de materiales${city ? ` en ${city}` : ''}`,
    url: '/',
    licitacion_id,
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      )
    )
  )

  // Limpiar suscripciones caducadas (410 Gone)
  const staleEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410) {
        staleEndpoints.push(subscriptions[i].endpoint)
      } else {
        console.error('[broadcast-push] push error:', result.reason)
      }
    }
  })

  if (staleEndpoints.length > 0) {
    await db.from('push_subscriptions').delete().in('endpoint', staleEndpoints)
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return jsonResponse({ sent, total: subscriptions.length }, 200, {}, req)
}

export default rawHandler

// notifications/send-push/index.ts — Web Push a un único usuario
// Body: { user_id: string, title: string, body: string, url?: string }
// Invocado via supabase.functions.invoke('notifications/send-push', ...)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'
import { handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'
import { withTelemetry } from '../../_shared/telemetry.ts'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@ziteo.bo'

async function rawHandler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST is accepted', 405, req)
  }

  let payload: { user_id: string; title: string; body: string; url?: string }
  try {
    payload = await req.json()
  } catch {
    return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400, req)
  }

  const { user_id, title, body, url = '/' } = payload
  if (!user_id || !title || !body) {
    return errorResponse('MISSING_FIELDS', 'user_id, title, and body are required', 400, req)
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { data: subscriptions, error: dbError } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user_id)

  if (dbError) {
    console.error('[send-push] DB error:', dbError.message)
    return errorResponse('DB_ERROR', dbError.message, 500, req)
  }

  if (!subscriptions || subscriptions.length === 0) {
    return jsonResponse({ sent: 0, message: 'No subscriptions found for user' }, 200, {}, req)
  }

  const notification = JSON.stringify({ title, body, url })
  const results = await Promise.allSettled(
    subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      )
    )
  )

  const staleEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410) {
        staleEndpoints.push(subscriptions[i].endpoint)
      } else {
        console.error('[send-push] Push error:', result.reason)
      }
    }
  })

  if (staleEndpoints.length > 0) {
    await db.from('push_subscriptions').delete().in('endpoint', staleEndpoints)
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return jsonResponse({ sent, total: subscriptions.length }, 200, {}, req)
}

export default withTelemetry('notifications-send-push', rawHandler)

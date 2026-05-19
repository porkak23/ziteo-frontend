// send-push/index.ts — Edge Function to send Web Push notifications
// MANUAL SETUP REQUIRED:
//   supabase secrets set VAPID_PRIVATE_KEY="<your_private_key>"
//   supabase secrets set VAPID_SUBJECT="mailto:admin@ziteo.bo"
//   The VAPID_PUBLIC_KEY is embedded in .env (VITE_VAPID_PUBLIC_KEY) and must also be
//   set as a Supabase secret: supabase secrets set VAPID_PUBLIC_KEY="<your_public_key>"
//
// Expected request body: { user_id: string, title: string, body: string, url?: string }
// This function is meant to be called from other Edge Functions or from DB triggers
// via supabase.functions.invoke('notifications/send-push', ...) with the service-role key.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'
import { CORS_HEADERS, handleOptions, jsonResponse, errorResponse } from '../../_shared/cors.ts'

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY   = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY  = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT      = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@ziteo.bo'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions()

  if (req.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST is accepted', 405)
  }

  let payload: { user_id: string; title: string; body: string; url?: string }
  try {
    payload = await req.json()
  } catch {
    return errorResponse('INVALID_BODY', 'Request body must be valid JSON', 400)
  }

  const { user_id, title, body, url = '/' } = payload
  if (!user_id || !title || !body) {
    return errorResponse('MISSING_FIELDS', 'user_id, title, and body are required', 400)
  }

  // Configure web-push VAPID details
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  // Fetch all subscriptions for this user (service-role bypasses RLS)
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { data: subscriptions, error: dbError } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user_id)

  if (dbError) {
    console.error('[send-push] DB error:', dbError.message)
    return errorResponse('DB_ERROR', dbError.message, 500)
  }

  if (!subscriptions || subscriptions.length === 0) {
    return jsonResponse({ sent: 0, message: 'No subscriptions found for user' })
  }

  const notification = JSON.stringify({ title, body, url })
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      )
    )
  )

  // Remove stale subscriptions (410 Gone = browser unsubscribed)
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
    await db
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints)
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return jsonResponse({ sent, total: subscriptions.length })
})

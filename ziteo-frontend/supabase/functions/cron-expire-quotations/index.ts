import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { log } from '../_shared/logger.ts'

// Called by Supabase scheduled invocations (Edge Function Schedules or
// pg_cron via net.http_post). Expires pending quotations past their
// expires_at date by calling the expire_old_quotations() SQL function.
serve(async (req) => {
  // Guard against accidental public invocations via a shared cron secret.
  // Set CRON_SECRET in the project's Edge Function secrets.
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = Deno.env.get('CRON_SECRET') ?? ''
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    log('warn', 'cron.expire_quotations.unauthorized')
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error } = await supabase.rpc('expire_old_quotations')

  if (error) {
    log('error', 'cron.expire_quotations.failed', { message: error.message })
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  log('info', 'cron.expire_quotations.ok')
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

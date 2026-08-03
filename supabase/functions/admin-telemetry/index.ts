// admin-telemetry/index.ts — proxy de solo lectura hacia las APIs de
// Sentry y PostHog para el panel Salud del Command Center admin.
//
// Por qué un proxy y no llamar Sentry/PostHog directo desde el navegador:
// las API keys de consulta (Sentry Auth Token, PostHog Personal API Key)
// son credenciales de alto privilegio (leen TODO el proyecto Sentry/
// PostHog) — nunca deben llegar al bundle del cliente. Esta función las
// mantiene solo en Supabase Secrets y solo responde a admins verificados.
//
// GET /admin-telemetry?source=sentry   → errores últimas 24h
// GET /admin-telemetry?source=posthog  → resumen de eventos recientes
//
// Si las keys no están configuradas, responde 200 con configured:false
// (no es un error — el panel debe poder renderizar "no configurado" sin
// que la request completa falle).

import { handleOptions, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { withTelemetry } from '../_shared/telemetry.ts'
import { requireAdmin } from '../_shared/require-admin.ts'

const SENTRY_AUTH_TOKEN = Deno.env.get('SENTRY_AUTH_TOKEN') ?? ''
const SENTRY_ORG = Deno.env.get('SENTRY_ORG') ?? ''
const SENTRY_PROJECT = Deno.env.get('SENTRY_PROJECT') ?? ''

const POSTHOG_API_KEY = Deno.env.get('POSTHOG_PERSONAL_API_KEY') ?? ''
const POSTHOG_PROJECT_ID = Deno.env.get('POSTHOG_PROJECT_ID') ?? ''
const POSTHOG_HOST = Deno.env.get('POSTHOG_HOST') ?? 'https://app.posthog.com'

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, { data: unknown; expiresAt: number }>()

function getCached(key: string): unknown | undefined {
  const entry = cache.get(key)
  if (!entry || entry.expiresAt < Date.now()) return undefined
  return entry.data
}
function setCached(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

async function fetchSentryErrors(): Promise<unknown> {
  if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG || !SENTRY_PROJECT) {
    return { configured: false }
  }
  const cached = getCached('sentry')
  if (cached) return cached

  const res = await fetch(
    `https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?statsPeriod=24h&query=is:unresolved`,
    { headers: { Authorization: `Bearer ${SENTRY_AUTH_TOKEN}` } }
  )
  if (!res.ok) {
    return { configured: true, error: `Sentry API ${res.status}` }
  }
  const issues = await res.json()
  const result = { configured: true, issues }
  setCached('sentry', result)
  return result
}

async function fetchPostHogSummary(): Promise<unknown> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    return { configured: false }
  }
  const cached = getCached('posthog')
  if (cached) return cached

  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/events/?limit=20`,
    { headers: { Authorization: `Bearer ${POSTHOG_API_KEY}` } }
  )
  if (!res.ok) {
    return { configured: true, error: `PostHog API ${res.status}` }
  }
  const events = await res.json()
  const result = { configured: true, events }
  setCached('posthog', result)
  return result
}

async function rawHandler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'GET') return errorResponse('METHOD_NOT_ALLOWED', 'Only GET is accepted', 405, req)

  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const source = new URL(req.url).searchParams.get('source')

  if (source === 'sentry') {
    return jsonResponse(await fetchSentryErrors(), 200, {}, req)
  }
  if (source === 'posthog') {
    return jsonResponse(await fetchPostHogSummary(), 200, {}, req)
  }
  return errorResponse('INVALID_SOURCE', 'source must be "sentry" or "posthog"', 400, req)
}

Deno.serve(withTelemetry('admin-telemetry', rawHandler))

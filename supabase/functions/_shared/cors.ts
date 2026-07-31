// _shared/cors.ts — CORS con whitelist de orígenes (auditoría 2026-06-11).
//
// Antes: 'Access-Control-Allow-Origin: *' en todas las funciones. Cualquier
// sitio externo podía lanzar requests cross-origin desde el navegador de un
// usuario (CSRF/abuso de endpoints de auth). Ahora se refleja el origen solo
// si está en la whitelist; un origen desconocido recibe el origen primario y
// el navegador bloquea la lectura de la respuesta.
//
// Orígenes adicionales sin tocar código:
//   supabase secrets set ALLOWED_ORIGINS="https://otro.dominio"
// OJO: el secret se llama ALLOWED_ORIGINS (plural). Existe uno viejo llamado
// ALLOWED_ORIGIN (singular) en prod que este código NO lee — es de la
// generación previa de las funciones y no tiene efecto.
//
// 2026-07-30: prod corre con ALLOWED_ORIGINS="https://www.ziteo.company,https://ziteo.company"
// porque el CLI de Supabase subió una versión cacheada de este archivo y la
// lista estática de abajo no llegó a desplegarse. Al redesplegar estas
// funciones, verificar con:
//   curl -si -X OPTIONS <fn-url> -H "Origin: https://www.ziteo.company" \
//     -H "Access-Control-Request-Method: POST" | grep -i allow-origin
// Si el header refleja el origen, el código nuevo ya está activo y el secret
// pasa a ser redundante (se puede quitar).

const STATIC_ALLOWED_ORIGINS = [
  'https://www.ziteo.company',         // PWA producción (dominio propio) — también PRIMARY_ORIGIN
  'https://ziteo.company',             // apex (hace 307 a www, pero por si un cliente pega directo)
  'https://localhost',                 // Capacitor WebView (Android, androidScheme https / iOS)
  'capacitor://localhost',             // Capacitor iOS (scheme nativo)
  'http://localhost:5173',             // Vite dev
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',             // Vite dev
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
]

const envOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const ALLOWED_ORIGINS = new Set([...STATIC_ALLOWED_ORIGINS, ...envOrigins])

const PRIMARY_ORIGIN = STATIC_ALLOWED_ORIGINS[0]

export function corsHeadersFor(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin') ?? ''
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : PRIMARY_ORIGIN
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  }
}

// Compat con call-sites antiguos que esparcen CORS_HEADERS directamente:
// ya no es '*', sino el origen primario (no refleja; preferir corsHeadersFor).
export const CORS_HEADERS: Record<string, string> = corsHeadersFor()

export function handleOptions(req?: Request): Response {
  return new Response(null, { status: 204, headers: corsHeadersFor(req) })
}

const DEV_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
])

/**
 * True when both conditions hold:
 * 1. The env var DEBUG_OTP_ENABLED === 'true' (must be set in Supabase secrets for staging only).
 * 2. The Origin header is a known local-dev origin.
 *
 * Gating by server-side env var prevents curl/Postman from faking the Origin header
 * to extract debug_otp on production (where DEBUG_OTP_ENABLED is absent/false).
 */
export function isDevOrigin(req?: Request): boolean {
  if (Deno.env.get('DEBUG_OTP_ENABLED') !== 'true') return false
  const origin = req?.headers.get('origin') ?? ''
  return DEV_ORIGINS.has(origin)
}

export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
  req?: Request
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeadersFor(req), ...extraHeaders },
  })
}

export function errorResponse(code: string, message: string, status: number, req?: Request): Response {
  return jsonResponse({ error: code, message }, status, {}, req)
}

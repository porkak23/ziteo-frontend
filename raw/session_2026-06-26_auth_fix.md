# Sesión 2026-06-26: Fix completo de registro auth en Ziteo MVP

Proyecto Supabase: ziteo-mvp (ID: yvqbubjfhmuztknmhyvd, región: sa-east-1)

## Problemas raíz identificados y corregidos

### 1. CORS roto en Edge Functions desplegadas
Las funciones desplegadas hardcodeaban un solo origen (`ALLOWED_ORIGIN ?? 'https://ziteo-frontend.vercel.app'`), bloqueando localhost:5173. La whitelist correcta en `_shared/cors.ts` nunca había sido desplegada. Además, `handleOptions()` y `errorResponse()` se llamaban sin pasar `req`, rompiendo CORS dinámico.

**Fix:** Todas las funciones ahora usan `corsHeadersFor(req)` con whitelist dinámica. Añadido `isDevOrigin(req)` para gatear `debug_otp` solo a localhost.

### 2. Dos sistemas OTP divergentes
- **En repo:** Twilio Verify (nunca desplegado), columnas `otp` y `user_id` en tabla otps (no existen en producción)
- **En producción:** Meta WhatsApp Cloud API (`_shared/whatsapp.ts`), tabla `otps` con columnas reales: `id, phone, code, expires_at, used, created_at`

**Decisión:** Se adopta el sistema desplegado como canónico. Twilio eliminado del repo.

### 3. Email sintético inconsistente
- `auth/register` usaba `@phone.ziteo.bo`
- `auth/login` usaba `@ziteo.bo`
Esto causaba que el login fallara para usuarios registrados con la nueva función.

**Fix:** Unificado a `{phone_sin_plus}@phone.ziteo.bo` en ambas funciones. Ejemplo: `59176543210@phone.ziteo.bo`.

### 4. UI bloqueante ante errores
Sin mensajes claros ni botones de salida/soporte. `extractEdgeError` no se usaba en todas las funciones.

**Fix:** `extractEdgeError()` en todas las llamadas, mensajes en español mapeados por código de error, botones "Contactar soporte" y "Volver" en OtpVerificationSheet.

## Sistema de auth canónico (post-fix)

### Tabla otps
Columnas: `id, phone, code, expires_at, used, created_at`
- `code` es el campo del OTP (6 dígitos)
- `used` booleano, `expires_at` timestamp (5 minutos)
- NO tiene `user_id` ni columna `otp`

### Flujo de registro
1. `auth-register`: validar → `check_throttle` RPC → limpiar registro incompleto (`onboarding_completed=false`) → `createUser(email_confirm:true)` → insert `profiles` → insert `user_roles(onboarding_completed:false)` → generar OTP → insert `otps{phone,code,expires_at,used}` → `sendWhatsAppOtp`
2. Si `WHATSAPP_NOT_CONFIGURED`: devolver `debug_otp` SOLO si `isDevOrigin(req)` (localhost)
3. Respuesta: `{ user_id, phone, requires_otp: true }`

### Flujo de verificación OTP
`auth-otp-verify`: busca en `otps` por `phone` + `code` + `used=false` + `expires_at>now` → marca `used=true` → lookup `user_id` via `profiles.phone` → actualiza `user_roles.onboarding_completed=true`

### Flujo de login
`auth-login`: `signInWithPassword(email: phone@phone.ziteo.bo, password: pin)` → fetch profile + roles → `setSession` → devuelve `AuthUser`

### Flujo forgot-PIN / reset-PIN
`auth-forgot-pin`: invalida OTPs viejos → genera nuevo → `sendWhatsAppOtp` + `debug_otp` gateado
`auth-reset-pin`: verifica `otps.code` → marca `used` → `auth.admin.updateUserById(password: new_pin)`

## Archivos modificados/creados en el repo

### Backend (Supabase Edge Functions)
- `supabase/functions/_shared/cors.ts` — whitelist dinámica + `isDevOrigin()` + helpers con `req`
- `supabase/functions/_shared/whatsapp.ts` — CREADO: `sendWhatsAppOtp()` vía Meta Graph API v19.0
- `supabase/functions/auth/register/index.ts` — reescrito completo
- `supabase/functions/auth/otp-verify/index.ts` — reescrito: usa `code`, lookup via `profiles.phone`
- `supabase/functions/auth/otp-resend/index.ts` — reescrito: usa `code`, WhatsApp, `debug_otp` gateado
- `supabase/functions/auth/login/index.ts` — reescrito: email `@phone.ziteo.bo`, CORS con `req`
- `supabase/functions/auth/forgot-pin/index.ts` — CREADO en repo (solo existía desplegado)
- `supabase/functions/auth/reset-pin/index.ts` — reescrito: quita Twilio, usa `otps.code`
- `supabase/config.toml` — añadidos `entrypoint` para 6 funciones auth
- ELIMINADOS: `auth/whatsapp-verify-start/` y `auth/whatsapp-verify-check/` (Twilio)

### Frontend
- `ziteo-frontend/src/features/auth/services/authService.ts` — `extractEdgeError()`, `resendOtp()`, `registerWithPin` devuelve `debug_otp?`, `resetPin` envía `{phone,code,new_pin}`
- `ziteo-frontend/src/features/auth/components/RegisterForm.tsx` — `mapRegisterError()`, `resendCooldown` 60s, `debugOtp` state auto-fill
- `ziteo-frontend/src/features/auth/components/OtpVerificationSheet.tsx` — prop `debugOtp` con auto-fill, botones "Contactar soporte" + "Volver"

## Deploy a producción completado

| Función | Versión | Estado |
|---|---|---|
| auth-register | v20 | ACTIVE |
| auth-login | v15 | ACTIVE |
| auth-otp-verify | v9 | ACTIVE |
| auth-otp-resend | v8 | ACTIVE |
| auth-forgot-pin | v8 | ACTIVE |
| auth-reset-pin | v2 | ACTIVE |

## Pendiente (acción del usuario)

Para que el OTP llegue por WhatsApp en producción, configurar en Supabase → Settings → Edge Functions → Secrets:
- `WHATSAPP_ACCESS_TOKEN` — token permanente de System User en Meta Business
- `WHATSAPP_PHONE_NUMBER_ID` — ID del número (no el número en sí)
- `WHATSAPP_TEMPLATE_NAME` — valor: `ziteo_otp`

La plantilla `ziteo_otp` debe estar aprobada en Meta, idioma `es`, con parámetro `{{1}}` en el body.

En localhost el flujo funciona sin WhatsApp: `debug_otp` se devuelve y autocompleta en la UI.

## Relaciones con otros componentes

- `check_throttle` RPC: usada en `auth-register` para rate limiting (5 intentos / 15 min)
- `profiles` tabla: relacionada por `user_id` (FK a auth.users) y `phone` (usado para lookup en OTP verify)
- `user_roles` tabla: `onboarding_completed` flag cambia de `false` (post-register) a `true` (post-OTP)
- `isDevOrigin()`: cierra pendiente F1 de la auditoría 2026-06-11 (gateo de debug_otp a solo-dev)
- Biometric login: no afectado, usa `Preferences` de Capacitor con phone+PIN almacenados localmente

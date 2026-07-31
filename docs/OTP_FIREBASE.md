# OTP con Firebase Phone Auth — estado, arreglos y bloqueo abierto

**Última actualización:** 2026-07-31
**Proyecto Firebase:** `ziteo-a08f4` · **Supabase:** `yvqbubjfhmuztknmhyvd` · **Dominio:** https://www.ziteo.company

---

## TL;DR

El registro por SMS **todavía no funciona para usuarios reales**. La cadena está completa y verificada de punta a punta con números de prueba, pero el envío de SMS real falla con `503 Service Unavailable` desde Firebase.

| Capa | Estado |
|---|---|
| Frontend (proveedor firebase activo, chunk servido) | ✅ Verificado |
| CORS Edge Functions desde dominio propio | ✅ Verificado |
| Validación de ID token server-side (JWKS de Google) | ✅ Verificado |
| Anti-replay (jti en `otps`) | ✅ Verificado con datos reales |
| Throttle por IP | ✅ Verificado (20 pasan, el 21 → 429) |
| Login con PIN posterior | ✅ Verificado |
| **Emisión de SMS real** | ❌ **503 — bloqueo abierto** |

---

## Aciertos — qué quedó funcionando

### 1. Bug de seguridad: anti-replay roto en silencio

**Problema.** `otps.code` era `varchar(6)` (diseñado para códigos WhatsApp de 6 dígitos), pero el adaptador Firebase guarda ahí el jti (`sub:auth_time`, ~39 chars) para impedir que un mismo ID token se reutilice. El insert fallaba, **el error no se chequeaba**, y la verificación seguía adelante como si nada. Resultado: un ID token de Firebase podía reverificarse indefinidamente dentro de su ventana de 10 minutos, sin dejar rastro.

**Cómo se detectó.** Tras una verificación exitosa, `select count(*) from otps where phone=... and used=true` devolvía **0 filas**. Debía haber una.

**Fix.**
- Migración `20260729000001_widen_otps_code_for_firebase_jti.sql` → `code` a `varchar(128)`.
- `_shared/otp-firebase-adapter.ts` ahora chequea el error del insert y devuelve `{ok:false}` (fail-closed): si no se puede registrar el jti, no hay garantía anti-replay, así que se rechaza.

**Verificación.** Fila real en prod tras un reset-pin: `jti_len=39`, `used=true`. Antes quedaba vacío.

### 2. Throttle por IP contra fraude de peaje SMS

Con SMS pagados, el throttle por teléfono no alcanza: un bot rota números para quemar saldo. Se agregó `_shared/ip-throttle.ts`, que **reusa el RPC `check_throttle` existente** con identificador `sms_ip:<ip>` (20/hora, lee `x-forwarded-for`). Aplicado en `auth/register`, `auth/otp-resend`, `auth/forgot-pin`.

**Verificación.** 23 requests seguidos: los 20 primeros pasan, del 21 en adelante `429 RATE_LIMITED`. Fila en `auth_throttle` con `attempts=20` e IP correcta.

### 3. CORS para el dominio propio

Al migrar a `ziteo.company` **toda la app quedó rota** (registro, login y push), no solo el OTP: la whitelist de `_shared/cors.ts` solo tenía `ziteo-frontend.vercel.app`, así que el preflight devolvía el origen equivocado y el navegador bloqueaba todo.

**Fix.** Dominio propio agregado a la whitelist. En prod está activo vía el secret `ALLOWED_ORIGINS` (ver *Deuda técnica*).

**Verificación.** Las 7 funciones reflejan `https://www.ziteo.company`; el apex también; un origen desconocido sigue recibiendo el origen primario (bloqueado). O sea, se arregló sin abrir la whitelist.

### 4. Limpieza de copy

La pantalla de verificación decía *"Enviando por WhatsApp"* y el error *"No pudimos enviar el código por WhatsApp"* cuando el proveedor activo es Firebase. Corregido y desplegado.

---

## Errores — qué salió mal y por qué

### 1. `VITE_OTP_PROVIDER` con un `\n` invisible (causa raíz original)

`echo "firebase" | vercel env add ...` guardó literalmente `"firebase\n"`. La comparación en código es `=== 'firebase'` exacta, así que **nunca matcheaba**: Vite plegaba el bundle a la rama `whatsapp` y el deploy salía verde. El dashboard de Vercel mostraba `firebase` sin revelar el newline.

- **Fix:** `printf 'firebase'` (no `echo`) y verificar con `vercel env pull`.
- **Lección:** si algo "debería estar activo" pero prod dice lo contrario, sospechar del valor de la env var **antes** que del código.

### 2. Dos listas de dominios y dos API keys

Un dominio nuevo necesita estar en **dos lugares distintos**, y fallar solo en el segundo produce un error que ni menciona Firebase Auth:

1. Firebase Console → Authentication → Settings → **Authorized domains**.
2. Google Cloud → Credenciales → la API key → **Restricciones de sitios web**. Si falta acá: `403 Requests from referer ... are blocked` en `recaptchaParams`, y la UI queda colgada en "Enviando código" para siempre.

El proyecto tiene **dos** API keys y es fácil editar la equivocada:

| Key | Uso | Síntoma si es la equivocada |
|---|---|---|
| `AIza...ezAahWas` | **La que usa el frontend** (está en `VITE_FIREBASE_API_KEY` y en el chunk `firebaseClient-*.js`) | — |
| `AIza...W8TK1Y` | Solo Maps/Places/Geocoding | `Requests to this API identitytoolkit... are blocked` |

Se perdió tiempo editando la key de Maps creyendo que era la de Auth.

### 3. El CLI de Supabase desplegó un `cors.ts` cacheado

`supabase functions deploy` subió de versión las funciones (v40, v28…) pero el `ezbr_sha256` **no cambió** y el `cors.ts` en prod seguía siendo el viejo — aunque otros archivos editados en la misma sesión sí subieron. Ver *Deuda técnica*.

### 4. Diagnósticos míos que resultaron equivocados

Vale registrarlos para no repetirlos:

- **Culpé a reCAPTCHA Enterprise.** El mensaje `Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification` es **ruido normal**: siempre cae a v2 y funciona. No era la causa.
- **Di por resuelto el billing prematuramente.** Al probar con `recaptchaToken:"x"` (basura), Google valida captcha y billing **en orden variable**: a veces devuelve `CAPTCHA_CHECK_FAILED` enmascarando un `BILLING_NOT_ENABLED` de fondo, y viceversa. Un solo curl con token inválido **no es concluyente** para el estado del billing.
- **Pasé el link de producción sin probar el registro desde ese dominio.** Verifiqué que el bundle era correcto, pero no que las Edge Functions aceptaran el origen nuevo — y no lo aceptaban. El usuario encontró el fallo, no yo.

### 5. Residuos de pruebas en prod

Al limpiar usuarios de prueba se borró `profiles`/`user_roles` pero **no** `auth.users`, dejando usuarios huérfanos. Efecto: ese número queda **bloqueado permanentemente** para registrarse, con el error opaco `REGISTRATION_FAILED: A user with this email address has already been registered`.

> ⚠️ **Riesgo real en producción, no solo de pruebas.** `auth-register` limpia el usuario de auth solo si encuentra un `profiles` incompleto. Si el insert de `profiles` falla y el `deleteUser` de rollback también falla, el número queda inutilizable sin ninguna vía de recuperación desde la app. **Vale la pena atacarlo aparte.**

Limpieza correcta:
```sql
delete from user_roles where user_id = '<id>';
delete from profiles   where user_id = '<id>';
delete from otps       where phone   = '<phone>';
delete from auth.users where id      = '<id>';  -- este es el que se olvida
```

---

## Bloqueo abierto: `503 Service Unavailable`

**Síntoma.** Desde el navegador real del usuario, con un token de reCAPTCHA válido:
```
POST identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode → 503 (Service Unavailable)
→ la app muestra [OTP_CLIENT_ERROR]
```
Persistente en varios intentos, no transitorio.

**Qué ya está descartado:**

| Hipótesis | Cómo se descartó |
|---|---|
| CORS | Preflight refleja `www.ziteo.company` en las 7 funciones |
| Authorized domains | La API devuelve `www.ziteo.company` en `authorizedDomains` |
| Restricción de referer de la API key | `recaptchaParams` responde `recaptchaStoken` OK |
| Billing / Blaze | Proyecto ZITEO vinculado a `014E6B-9CA270-CAB8B2`; `BILLING_NOT_ENABLED` ya no aparece |
| Identity Platform deshabilitado | Habilitado, Phone provider activo |
| reCAPTCHA Enterprise | Ruido; el fallback a v2 es el comportamiento normal |
| Bug de la app | Con número de prueba la cadena completa funciona |

**Dónde cae exactamente.** El captcha pasa y el billing pasa; falla al **emitir el SMS**. Es la última capa.

**Sospecha principal: SMS region policy.** Es la capa exacta que decide si el envío procede, y es lo último que se configuró. Un allowlist mal guardado (vacío, o sin Bolivia efectivamente seleccionada) bloquea todo.

### Próximos pasos

1. **Revisar** Firebase Console → Authentication → Settings → **SMS region policy**. Confirmar *Allow* con **Bolivia realmente en la lista**.
2. **Descartarla en 10 segundos:** cambiar temporalmente a *Deny* con lista vacía (= permite todos los países) y reintentar. Si el SMS sale, era la policy; se reconfigura bien después. Reversible.
3. **Obtener el body del 503** — es el dato que falta para dejar de adivinar: DevTools → **Network** → filtro `sendVerificationCode` → click en la fila → **Response**. Google mete ahí un mensaje que la consola no muestra.
4. Si nada de lo anterior: abrir soporte de Firebase con el project ID y el timestamp del 503.

---

## Deuda técnica

**`cors.ts` difiere entre repo y prod.** Prod corre con el secret `ALLOWED_ORIGINS="https://www.ziteo.company,https://ziteo.company"` porque el CLI subió una versión cacheada del archivo. Funcionalmente equivalente, pero la lista estática del repo no está activa.

Al redesplegar estas funciones, verificar si el código nuevo ya tomó efecto:
```bash
curl -si -X OPTIONS <fn-url> -H "Origin: https://www.ziteo.company" \
  -H "Access-Control-Request-Method: POST" | grep -i allow-origin
```
Si refleja el origen **sin** el secret, este pasa a ser redundante y se puede quitar.

**Secret muerto.** Existe `ALLOWED_ORIGIN` (singular) en prod; el código lee `ALLOWED_ORIGINS` (plural). Nunca tuvo efecto. Es de la generación previa de las funciones.

---

## Cómo verificar de nuevo

### Diagnóstico rápido sin navegador
```bash
KEY="AIzaSyClRQwdvbkehMZscVgb13GGVH1ezAahWas"

# Referer de la API key + estado general
curl -s "https://identitytoolkit.googleapis.com/v1/recaptchaParams?key=$KEY" \
  -H "Referer: https://www.ziteo.company/"
# recaptchaStoken en la respuesta = OK

# Dominios autorizados
curl -s "https://identitytoolkit.googleapis.com/v1/projects?key=$KEY" \
  -H "Referer: https://www.ziteo.company/"

# CORS de una Edge Function
curl -si -X OPTIONS "https://yvqbubjfhmuztknmhyvd.supabase.co/functions/v1/auth-register" \
  -H "Origin: https://www.ziteo.company" -H "Access-Control-Request-Method: POST" \
  | grep -i access-control-allow-origin
```

> No usar `sendVerificationCode` con `recaptchaToken:"x"` para juzgar el billing — el orden de validación es variable y da falsos negativos en ambos sentidos.

### Driver end-to-end (Playwright)

El reCAPTCHA **no completa en headless**: usar `chromium.launch({ headless: false })`, donde resuelve el challenge visual solo. Dos detalles que cuestan tiempo si se asumen:

- Tras `sendVerificationCode`, el iframe del captcha **queda visible tapando el sheet** y los inputs del código tardan hasta ~30 s. No usar `waitForTimeout` fijo — hacer poll de `input[maxlength="1"]` hasta que haya 6.
- En el flujo de PIN, el botón de la segunda ronda dice **"CONFIRMAR PIN"**, no "CONTINUAR". Sin ese click, `auth-reset-pin` nunca se llama y el flujo parece colgado sin error.

Selectores útiles: `welcome-register-btn`, `welcome-login-btn`, `login-phone-input`, `login-submit-btn`, placeholders `Ej: Juan Carlos Mamani` y `7XX XXX XX`.

---

## Archivos tocados

| Archivo | Cambio |
|---|---|
| `supabase/migrations/20260729000001_widen_otps_code_for_firebase_jti.sql` | Nueva — `otps.code` a `varchar(128)` |
| `supabase/functions/_shared/otp-firebase-adapter.ts` | Fail-closed si el insert del jti falla |
| `supabase/functions/_shared/ip-throttle.ts` | Nueva — throttle por IP |
| `supabase/functions/_shared/cors.ts` | Dominio propio en la whitelist |
| `supabase/functions/auth/{register,otp-resend,forgot-pin}/index.ts` | Llamada a `isIpThrottled()` |
| `ziteo-frontend/src/features/auth/components/OtpVerificationSheet.tsx` | Copy sin "WhatsApp" |
| `ziteo-frontend/src/features/auth/components/RegisterForm.tsx` | Mensaje de error sin "WhatsApp" |
| `ziteo-frontend/CLAUDE.md` | URLs de prod + las dos listas de dominios + trampas del driver |

**Commits:** `40c2320` (anti-replay + throttle IP) · `01c945a` (CORS dominio propio)

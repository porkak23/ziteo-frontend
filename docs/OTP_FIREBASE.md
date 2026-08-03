# OTP con Firebase Phone Auth — estado, arreglos y causa raíz resuelta

**Última actualización:** 2026-08-01
**Proyecto Firebase:** `ziteo-a08f4` · **Supabase:** `yvqbubjfhmuztknmhyvd` · **Dominio:** https://www.ziteo.company

---

## ⚠️ 2026-08-01 — OTP DESACTIVADO en el registro

Tras quitar el número de la lista de prueba, el SMS **siguió sin llegar**. Como el
OTP bloqueaba por completo el alta de usuarios nuevos (0 de 4 usuarios en prod
tenían `onboarding_completed=true`), se desactivó la verificación de teléfono:

```bash
npx supabase secrets set OTP_VERIFICATION_REQUIRED=false --project-ref yvqbubjfhmuztknmhyvd
```

**No hubo cambios de código ni redeploy** — `auth-register` v44 ya traía el flag
(`register/index.ts:14`) y el frontend ya maneja `requires_otp:false` haciendo
login directo (`RegisterForm.tsx:254`). Verificado end-to-end contra prod: el
registro devuelve `requires_otp:false` y el login con PIN devuelve `access_token`.

**Qué significa:** el teléfono no se verifica. El PIN es la única credencial, y
cualquiera puede registrar un número que no le pertenece. Es una decisión de
producto para desbloquear el MVP, no un estado final.

**Consecuencia operativa:** no hay autoservicio de "olvidé mi PIN" —
`auth-forgot-pin` depende del OTP. El reset lo hace un admin a mano:
ver [`RESET_PIN_ADMIN.md`](RESET_PIN_ADMIN.md).

**Para revertir** cuando el SMS funcione: `OTP_VERIFICATION_REQUIRED=true` (el
secret se lee en runtime, tampoco necesita redeploy). Todo lo de abajo sigue
vigente y verificado — la cadena Firebase está entera salvo la emisión del SMS.

---

## TL;DR

**Causa raíz encontrada: el número estaba en la lista de *números de prueba* de Firebase.**

El SMS "no llegaba" porque los números ficticios (Authentication → Sign-in method → Phone → *Phone numbers for testing*) **nunca reciben un SMS real**: Firebase devuelve un `sessionInfo` válido y espera un código fijo definido en la consola. Desde la API todo parecía exitoso; simplemente no existía ningún SMS.

> ⚠️ **El diagnóstico anterior (`503` → SMS region policy) era incorrecto.** El `503` no se reproduce. Ver *Errores* §6 antes de volver a sospechar de la region policy.

| Capa | Estado |
|---|---|
| Frontend (proveedor firebase activo, chunk servido) | ✅ Verificado |
| Envs de Firebase en el bundle de prod | ✅ Verificado (API key y `ziteo-a08f4` correctos) |
| CORS Edge Functions desde dominio propio | ✅ Verificado |
| Validación de ID token server-side (JWKS de Google) | ✅ Verificado |
| Anti-replay (jti en `otps`) | ✅ Verificado con datos reales |
| Throttle por IP | ✅ Verificado (20 pasan, el 21 → 429) |
| Login con PIN posterior | ✅ Verificado |
| **Emisión de SMS real** | ⚠️ **Desbloqueado — pendiente de confirmar con un envío real** |

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
- **Culpé a la SMS region policy por un `503`, sin leer el body de la respuesta.** La causa real era que el número estaba en *Phone numbers for testing* (ver sección de causa raíz). Dos lecciones: (a) nunca declarar un culpable sin el cuerpo del error a la vista — "es la última capa que toqué" no es evidencia; (b) un envío que la API reporta como exitoso **no prueba** que se haya enviado un SMS. Con números ficticios el éxito es indistinguible del real salvo por el bypass del captcha.

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

## Causa raíz: el número era un *número de prueba* de Firebase

**Síntoma.** El usuario se registra, la pantalla queda en "Ingresa el código" y **no llega ningún SMS** — ni en el envío inicial ni al pulsar "Reenviar código". Sin error visible: desde la app todo parece haber salido bien.

**Por qué.** `+59173401469` estaba cargado en Firebase Console → Authentication → Sign-in method → Phone → **Phone numbers for testing**. Los números ficticios **nunca reciben SMS**: Firebase devuelve un `sessionInfo` válido y espera el código fijo configurado en la consola para ese número.

### Cómo detectarlo en 10 segundos

Un número ficticio **saltea la validación de reCAPTCHA**. Mandando un token basura, el ficticio responde `200`; cualquier número real responde `400`:

```bash
KEY="AIzaSyClRQwdvbkehMZscVgb13GGVH1ezAahWas"
curl -s "https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=$KEY" \
  -H "Referer: https://www.ziteo.company/" -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+591XXXXXXXX","recaptchaToken":"x"}'
```

| Respuesta | Significa |
|---|---|
| `200` + `sessionInfo` | **Número de prueba** — nunca recibirá SMS real |
| `400 CAPTCHA_CHECK_FAILED` | Número normal (el captcha se está evaluando de verdad) |

Medición del 2026-07-31: `+59173401469` → `200`; `+59169163386`, `+59171234567`, `+59176543210` → `400`.

**Fix.** Quitar el número de esa lista. Dejar ahí sólo números ficticios reservados para QA, nunca un número real de una persona.

### Qué está descartado (con evidencia, no por intuición)

| Hipótesis | Cómo se descartó |
|---|---|
| CORS | Preflight refleja `www.ziteo.company` en las 7 funciones |
| Authorized domains | La API devuelve `www.ziteo.company` y `ziteo.company` |
| Restricción de referer de la API key | `recaptchaParams` responde `recaptchaStoken` (HTTP 200) |
| Envs de Firebase ausentes en prod | El chunk `firebaseClient-*.js` servido trae la API key y `ziteo-a08f4` |
| Proveedor plegado a `whatsapp` | `firebaseProvider-*.js` está en el bundle con `signInWithPhoneNumber` |
| Billing / Blaze | Proyecto ZITEO vinculado a `014E6B-9CA270-CAB8B2` |
| Identity Platform deshabilitado | Habilitado, Phone provider activo |
| CSP / headers | `git grep -il "content-security-policy"` → 0 resultados en el repo |
| reCAPTCHA Enterprise | Ruido; el fallback a v2 es el comportamiento normal |

### Si el SMS real vuelve a fallar

Recién entonces sospechar de la **SMS region policy** (Authentication → Settings): confirmar *Allow* con **Bolivia (BO)** efectivamente en la lista. Para descartarla, cambiar temporalmente a *Deny* con lista vacía (= permite todos los países) y reintentar; es reversible.

Y **capturar el body de la respuesta** antes de teorizar: DevTools → Network → `sendVerificationCode` → Response. Google mete ahí un mensaje que la consola no muestra. Ese dato faltó durante todo el diagnóstico anterior y fue la razón de perseguir la hipótesis equivocada.

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

### Segunda ronda (2026-07-31) — causa raíz del "no llega el código"

| Archivo | Cambio |
|---|---|
| `ziteo-frontend/src/features/auth/otp/firebaseProvider.ts` | Ancla del reCAPTCHA reutilizable (sin `.remove()`) + aviso en dev sobre números de prueba |
| `ziteo-frontend/src/features/auth/components/OtpVerificationSheet.tsx` | Quitado el `<div>` duplicado del reCAPTCHA; aviso "¿No te llegó?" a los 25 s |
| `ziteo-frontend/src/lib/analytics.ts` | `log_event` sólo con sesión activa (elimina el 401 de la consola) |
| `supabase/functions/auth/register/index.ts` | Búsqueda del huérfano por email en vez de la primera página de `listUsers()` |

**Además, fuera del repo:** se quitó `+59173401469` de *Phone numbers for testing* y se borró su usuario huérfano en prod (`auth.users` + `profiles` + `user_roles`).

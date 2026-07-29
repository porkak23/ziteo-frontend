# Ziteoo Frontend — Claude Instructions

## Project
Ziteoo es un marketplace de construcción para Bolivia (operando inicialmente solo en Sucre, Potosí y Santa Cruz; las demás ciudades están desactivadas hasta llegar a ellas). PWA mobile-first con React 19 + TypeScript + Tailwind CSS 3.4 + Supabase. 4 roles de usuario: Constructor, Proveedor, Maestro, Chofer.

## Design Context

### Users
Empresarios y contratistas independientes del rubro de la construcción en Bolivia. Usan la app tanto en oficina (revisando proyectos, pedidos, estadísticas) como en campo (consultando contratos, buscando maestros, haciendo pedidos rápidos). Son profesionales acostumbrados a herramientas de trabajo, no consumidores casuales. Esperan eficiencia, confiabilidad y que la app respete su tiempo.

### Brand Personality
**Moderno · Ágil · Ambicioso.** Ziteoo es una startup de tecnología que quiere transformar una industria tradicional. La interfaz debe sentirse como una herramienta profesional de alto calibre — no un marketplace genérico, no una app de delivery colorida. Más cercano al espíritu de Linear o Notion: pulido, directo, con personalidad visual clara.

### Aesthetic Direction
- **Referente**: Linear / Notion — clean, tipografía fuerte, alta densidad de información sin ruido visual.
- **Tema**: Soporte completo light + dark, siguiendo preferencia del sistema. Ambos modos deben estar igualmente pulidos.
- **Tono visual**: Tool-first, no marketplace-first. Menos colores, más jerarquía. El naranja como acento de marca, no como decoración: **#A43700** (orangeDark) para CTAs/botones rellenos y **#E8733A** (orange) para acentos, estados activos e inicio de gradiente. Fuente de verdad: tokens `Z` del handoff de Claude Design. (#D94F00 quedó deprecado y eliminado.)
- **Anti-referentes**: Rappi, PedidosYa (demasiado ruidoso), Mercado Libre (sin carácter).

### Design Principles
1. **Información primero**: Los datos son el producto. La UI es el envase.
2. **Confianza a través de la precisión**: Espaciado consistente, tipografía clara, estados predecibles.
3. **El naranja es una herramienta, no decoración**: Solo donde la atención importa: CTAs, estados activos, datos clave.
4. **Adaptable al contexto**: Light en oficina, dark en obra. Ambos modos first-class.
5. **Bolivia primero**: UX auténticamente local (restringido a Sucre, Potosí y Santa Cruz por ahora), no una traducción de Silicon Valley.

## Lecciones Aprendidas — Deploy a Vercel (2026-06-30)

### Receta limpia (funcionó sin errores)
El proyecto **ya está enlazado** (`ziteo-frontend/.vercel/project.json` → project `ziteo-frontend`, org `team_VpGlbcRAfVePpyVudZPlOv7y`). Para desplegar a producción, **desde `ziteo-frontend/`**:
```bash
vercel --prod --yes
```
Build remoto corre `npm run build` → `dist` (config en `vercel.json`: framework `vite`, rewrites SPA `/(.*)→/index.html`). Alias de producción: **https://ziteo-frontend.vercel.app**. Verificar con `curl -sI https://ziteo-frontend.vercel.app` → `200` + `<title>Ziteoo</title>`.

### Requisitos que NO se deben romper
- **`.npmrc` con `legacy-peer-deps=true`** es obligatorio (React 19 genera conflictos de peer deps). Sin esto, `npm install` en Vercel falla.
- **Sanity local antes de subir:** `npm run build` local atrapa errores de TS (`tsc -b`) más rápido que esperar el build remoto.
- El deploy es **solo frontend**. Las Edge Functions de Supabase (`auth-*`, etc.) se despliegan aparte con `npx supabase functions deploy` y NO se tocan en el deploy de Vercel.

### Env vars en Vercel (producción) — estado 2026-07-29
- **Configuradas (lo crítico):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Sin estas dos la app no arranca.
- **`VITE_OTP_PROVIDER=firebase`** activo — junto con `VITE_FIREBASE_API_KEY`/`AUTH_DOMAIN`/`PROJECT_ID`/`APP_ID`, son **requeridas**, ya NO son legacy. Sin ellas el registro/login no puede verificar el teléfono.
- **Faltantes (no bloquean el boot, pero degradan features):** `VITE_GOOGLE_MAPS_KEY` (mapas en fallback de solo-texto), `VITE_SENTRY_DSN` (sin reporte de errores), `VITE_VAPID_PUBLIC_KEY` (sin web push), `VITE_POSTHOG_KEY`/`VITE_CLARITY_ID`/`VITE_GA4_ID` (sin analytics).
- Agregar una env var: `vercel env add VITE_GOOGLE_MAPS_KEY production` y luego re-desplegar (`vercel --prod`) para que entre al bundle — las `VITE_*` se inyectan en **build time**, no en runtime.

### Trampa — `vercel env add` vía stdin agrega un `\n` final (2026-07-29)
`echo "firebase" | vercel env add VITE_OTP_PROVIDER production` guarda literalmente `"firebase\n"`. Como la comparación en código es `=== 'firebase'` exacta, el valor con newline nunca matchea y Vite pliega el bundle a la rama `whatsapp` — **sin ningún error visible**, el build pasa limpio y el deploy "funciona", solo que con el proveedor equivocado. Pasó en producción: la env decía `firebase` en el dashboard pero el bundle servido usaba `whatsapp`.
- Usar `printf 'firebase'` (sin `echo`, que sí agrega `\n`) al pipear a `vercel env add`.
- Verificar el valor real con `vercel env pull <archivo> --environment=production` y mirar el `.env` resultante — el dashboard de Vercel no muestra si hay un `\n` colado.
- Si algo "debería estar activo" pero el comportamiento en prod dice lo contrario, sospechar esto antes que del código.

### Notas
- `CRLF will be replaced by LF` y advertencias de Sentry sourcemap durante el build son ruido, no errores.
- Rutas case-sensitive: el build remoto corre en Linux; un import con mayúsculas/minúsculas incorrectas pasa en Windows local pero rompe en Vercel. Si el build local pasa y el remoto falla, sospechar de esto primero.

---

## Lecciones Aprendidas — Pool unificado del Chofer (2026-06-26)

### La regla
El rol Chofer muestra un **pool unificado** de `deliveries` + `transport_requests` en `useUnifiedPool`. El dispatch al RPC correcto se hace por `job.kind` ('delivery' → `accept_delivery`, 'transport' → `accept_transport_request`). Nunca añadir un selector de modo Entregas/Transporte — una sola decisión por pantalla.

### Notificación al solicitante de transporte
El trigger `trg_notify_requester_on_transport` (función `notify_requester_on_transport`, SECURITY DEFINER) inserta en `notifications` automáticamente cuando `status` cambia a `accepted` o `completed`. No llamar a `send_notification` desde el cliente para transportes.

### Avanzar estado de transporte
Usar RPC `advance_transport_request(p_request_id, p_new_status)` con GRANT a `authenticated`. El hook del cliente es `useAdvanceTransportRequest` en `transporte/hooks/useTransportRequests.ts`. El RPC valida ownership (`driver_id = auth.uid()`) y transiciones.

### Si agregas un tercer tipo de trabajo
Añadir variante al tipo discriminado `UnifiedJob` en `transportista/types/jobTypes.ts` y una rama al método `accept()` de `useUnifiedPool.ts`.

---

## Lecciones Aprendidas — Dirección de Entrega en Checkout (2026-06-26)

### La regla
El checkout de la Tienda pasa `delivery_method`, `delivery_address`, `delivery_lat`, `delivery_lng` y `cargo_type` **directamente al RPC `place_order`** en una sola llamada atómica. Nunca hacer un `UPDATE orders SET delivery_address = ...` post-insert.

### Por qué
Hacer el patch post-insert con UPDATE viola las reglas del proyecto (genera `console.warn` en ruta crítica) y es propenso a race conditions. El trigger `auto_create_delivery_on_processing` copia `orders.delivery_lat/lng` → `deliveries.dropoff_lat/lng` al momento del cambio de estado; si los coords llegan tarde (vía UPDATE posterior), el trigger ya corrió con `NULL`.

### Componentes clave
- `CartDrawer.tsx` — estado local `deliveryMethod` + `deliveryLoc: MapPickerValue | null`; botón "Confirmar" bloqueado si `deliveryMethod='delivery'` y `!deliveryLoc?.address`.
- `DeliverySection.tsx` — toggle método + `MapPicker` cuando es delivery.
- `CargoSelector.tsx` — selector de tipo de carga (light/heavy).
- `usePlaceOrder` en `useOrders.ts` — vars: `{deliveryMethod, deliveryAddress, deliveryLat, deliveryLng}`; todos van al RPC.

### Si agregas un nuevo camino de checkout
Sigue el mismo patrón: captura `MapPickerValue` con `MapPicker`, pásalo a `usePlaceOrder`. No hagas patches post-insert.

---

## Lecciones Aprendidas — Notificación de Pedidos al Vendedor

### El problema (2026-06-25)
Existían **dos caminos de checkout** que divergieron:
- `tienda/hooks/useOrders.ts` → `usePlaceOrder` hook (camino de la Tienda general)
- `constructor/ConstructorTiendaTab.tsx` → `handleConfirm` (camino del Constructor)

El camino del Constructor creaba la orden con `place_order` RPC pero nunca notificaba al Vendedor (provider). La tabla `notifications` no recibía ninguna fila para las órdenes reales, por lo que el Vendedor solo se enteraba si estaba online con la suscripción realtime activa.

### Reglas para cualquier nuevo camino de checkout

1. **Notificación in-app → responsabilidad del trigger de BD, no del frontend.**
   El trigger `trg_notify_provider_on_new_order` (función `notify_provider_on_new_order`, `SECURITY DEFINER`) crea automáticamente una fila en `notifications` al insertar cualquier orden. **No llamar** a `send_notification` RPC desde el cliente para pedidos — generaría duplicados.

2. **Web Push → responsabilidad del frontend** en cada camino de checkout.
   Llamar a `supabase.functions.invoke('notifications/send-push', { body: { user_id: providerId, ... } })` con `.catch` silencioso (no debe romper el flujo). Ver patrón en `useOrders.ts:124-133` y `ConstructorTiendaTab.tsx:299-309`.

3. **Por qué `notifications` usa SECURITY DEFINER y no RLS directo:**
   La tabla `notifications` tiene `WITH CHECK (false)` en INSERT para usuarios autenticados. Los inserts válidos solo pueden ir por rutas SECURITY DEFINER (trigger de BD o RPC `send_notification`). El trigger es el mecanismo preferido porque cubre todos los caminos sin depender del frontend.

4. **Si agregas un nuevo camino de checkout** (nueva pantalla, nuevo rol comprando):
   - La notificación in-app queda cubierta automáticamente por el trigger.
   - Solo debes agregar la llamada al push de Web.
   - Verifica con: `INSERT INTO orders(...) RETURNING id;` → `SELECT * FROM notifications WHERE type='order' ORDER BY created_at DESC LIMIT 1;`

---

## Lecciones Aprendidas — OTP WhatsApp (2026-06-28)

> **Superado (2026-07-29):** el proveedor OTP activo en prod es **Firebase Phone Auth** (secret `OTP_PROVIDER=firebase`), no WhatsApp. El código WhatsApp sigue intacto como fallback — ver sección "OTP Firebase" más abajo para el estado vigente. Esta sección queda como referencia histórica del sistema WhatsApp.

### La regla
El sistema OTP usa Meta WhatsApp como canal primario (plantilla `ziteoo_otp` / `es_MX`), con fallback automático a Twilio SMS. Las 6 funciones de auth (`auth-register`, `auth-otp-resend`, `auth-forgot-pin`, `auth-otp-verify`, `auth-reset-pin`, `auth-login`) todas tienen `verify_jwt: false` y viven en `supabase/functions/auth/<slug>/index.ts` con dependencias compartidas en `supabase/functions/_shared/`.

### Errores comunes y cómo identificarlos

**Error Meta 190 — OAuthException: Authentication Error**
- El token configurado en `WHATSAPP_ACCESS_TOKEN` es el temporal de 24h del panel API Setup, no el permanente.
- Fix: Meta Business Settings → System Users → Generate New Token → permisos `whatsapp_business_messaging` + `whatsapp_business_management` → Token Expiry = **Never**.

**Error Meta 132001 — Template name/language mismatch**
- La función envía `language: 'es'` o template `ziteo_otp` pero Meta tiene `es_MX` + `ziteoo_otp`.
- Fix: asegurarse de que el deploy usa `_shared/whatsapp.ts` del repo local (que ya tiene `es_MX` y default `ziteoo_otp`).

### Diagnóstico rápido
Para ver el error real de Meta (no el genérico `WHATSAPP_SEND_FAILED`), temporalmente cambiar en `auth-otp-resend`:
```ts
return errorResponse('WHATSAPP_SEND_FAILED', String(waErr), 500, req)
```
Revertir después del diagnóstico.

### Cuenta de prueba Meta
La cuenta WhatsApp Business de Ziteoo es de prueba — solo envía a números pre-registrados como destinatarios en el panel de Meta. Números registrados conocidos: `+59173401469`, `+59169163386`. Para enviar a usuarios reales hay que migrar a una cuenta de producción verificada.

### CRÍTICO — Verificar expiración del token ANTES de confiar en él (2026-06-30)
La causa raíz recurrente del Error 190 es un **token temporal**. Antes de configurar `WHATSAPP_ACCESS_TOKEN`, validar SIEMPRE con:
```bash
curl -s "https://graph.facebook.com/v19.0/debug_token?input_token=$TOKEN&access_token=$TOKEN"
```
- `type: USER` + `expires_at` con valor → **token temporal**, expira pronto. NO sirve para producción.
- `type: SYSTEM_USER` + `expires_at: 0` → **permanente** (Token Expiry = Never). El correcto para el lanzamiento.

El token recibido el 2026-06-30 (app_id `1751365125904282`) era `type: USER` con `expires_at` ≈ 2026-07-01 (~18h de vida) — sirvió para pruebas pero **se debe reemplazar por un token de System User permanente antes del lanzamiento masivo**, o el registro se romperá con Error 190 al expirar.

Datos vigentes de la cuenta (2026-06-30): `WHATSAPP_PHONE_NUMBER_ID=1180697468467996`, `WABA_ID=27364225239893891`, plantilla `ziteoo_otp`/`es_MX` APPROVED. El WABA ID solo se usa para gestionar/listar plantillas (`GET /{WABA_ID}/message_templates`), no para enviar.

### Procedimiento para actualizar el token (sin redeploy de funciones)
Los secrets se leen en runtime; basta con setearlos, no hace falta redesplegar las Edge Functions:
```bash
npx supabase secrets set WHATSAPP_ACCESS_TOKEN='...' WHATSAPP_PHONE_NUMBER_ID='1180697468467996' WHATSAPP_TEMPLATE_NAME='ziteoo_otp' --project-ref yvqbubjfhmuztknmhyvd
```
Verificar entrega con un envío directo de la plantilla antes de depender del flujo de la app:
```bash
curl -s "https://graph.facebook.com/v19.0/$PHONE_NUMBER_ID/messages" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"<sin +>","type":"template","template":{"name":"ziteoo_otp","language":{"code":"es_MX"},"components":[{"type":"body","parameters":[{"type":"text","text":"123456"}]}]}}'
```
`message_status: accepted` = número entregable. Error 131030 = número no está en la allow-list de la cuenta de prueba.

### Error opaco PROFILE_CREATION_FAILED en el registro = `city` inválida (2026-06-30)
`auth-register` devuelve `500 PROFILE_CREATION_FAILED` (mensaje genérico "Failed to create user profile") cuando el insert en `profiles` viola un constraint. La causa más común es **`city`**:
- `profiles.city` es **NOT NULL** y tiene check `profiles_city_check`: solo acepta **`Sucre`, `Potosí`, `Santa Cruz`** (o NULL, pero el NOT NULL lo impide) — más `valid_city` (no vacío).
- Si el cliente no manda `city`, o manda una ciudad fuera de esas 3, el registro falla con ese error opaco.
- El detalle real solo aparece en los **logs de Postgres** (`get_logs service=postgres`): `null value in column "city" ... violates not-null constraint` o `violates check constraint "profiles_city_check"`. Los logs de edge-function solo muestran el `500`, no la causa.
- Al probar el endpoint con curl, **siempre incluir `"city":"Santa Cruz"`** (o Sucre/Potosí). La app real ya manda `selectedCity`, por eso solo se rompe en pruebas crudas o si se agrega una ciudad nueva sin actualizar el check.

### Probar registro end-to-end contra prod (con OTP real)
Con `DEBUG_OTP_ENABLED=true`, mandar header `Origin: http://localhost:5173` hace que `auth-register`/`auth-otp-verify` devuelvan `debug_otp` además de enviar el WhatsApp real. Flujo de prueba:
```bash
ANON=$(grep -E '^VITE_SUPABASE_ANON_KEY=' .env.production | cut -d= -f2-)
# 1) register → devuelve debug_otp y envía WhatsApp
curl -s .../functions/v1/auth-register -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Origin: http://localhost:5173" \
  -d '{"phone":"+591XXXXXXXX","name":"...","pin":"NNNNNN","initial_role":"constructor","city":"Santa Cruz"}'
# 2) verify con ese código → onboarding_completed=true
curl -s .../functions/v1/auth-otp-verify ... -d '{"phone":"+591XXXXXXXX","otp":"NNNNNN"}'
# 3) login con el PIN → access_token
curl -s .../functions/v1/auth-login ... -d '{"phone":"+591XXXXXXXX","pin":"NNNNNN"}'
```
El cuerpo de `otp-verify` usa la clave **`otp`** (no `code`); el de register/login usa `pin`.

### Nota sobre el flag OTP_VERIFICATION_REQUIRED (divergencia local-vs-prod)
El `register/index.ts` **local** tiene un flag `OTP_VERIFICATION_REQUIRED` (default `false` → omite OTP). La versión **desplegada en prod (v34) NO tiene ese flag** y siempre exige OTP. NO redesplegar el register local sin antes setear el secret `OTP_VERIFICATION_REQUIRED=true`, o se desactivaría el OTP de WhatsApp sin querer.

---

## Lecciones Aprendidas — God Mode Admin (2026-07-19)

### Vistas Administrativas y Seguridad
- **Vistas nuevas DEBEN llevar explícitamente `WITH (security_invoker = true)`**: El owner de las tablas (`postgres`) posee la propiedad `BYPASSRLS` en Supabase. Si una vista se define de manera ordinaria, no evaluará políticas RLS y expondrá datos privados a cualquier rol. Forzar `security_invoker = true` en cada declaración de vista.

### Realtime y Sockets
- **Límite estricto de 3 canales realtime activos en AdminApp**: Para no agotar sockets y cuotas, AdminApp solo debe suscribirse a los canales `events`, `admin_alerts` y `driver_locations`. Cualquier otra actualización periódica o de datos dinámicos debe resolverse vía **polling clásico**.

### Gestión de Roles y Credenciales
- **Rol admin nunca auto-asignable**: El rol `admin` no puede asignarse mediante flujos de frontend/UI (está excluido de `ASSIGNABLE_ROLES`). Sólo se otorga manualmente mediante sentencias SQL en la BD.
- **Sincronización manual de secretos de Ingesta**: El secreto para invocar la Edge Function de cronjob `market-prices-ingest` se encuentra tanto en el manejador de Postgres (`Vault`) como en el manejador de Edge Secrets de Supabase (`MARKET_INGEST_SECRET`). Al rotar o crear uno, ambos deben actualizarse manualmente.

### Generación de Tipos de Supabase
- **npm run gen:types**: Tras aplicar migraciones, regenerar tipos de TS. Redirigir siempre solo el stdout (`npm run gen:types > src/types/supabase.ts`) para evitar que logs redundantes de stderr ensucien el archivo generado.

---

## Lecciones Aprendidas — OTP Firebase activo en producción (2026-07-29)

### La regla
`OTP_PROVIDER=firebase` (secret Supabase) + `VITE_OTP_PROVIDER=firebase` (env Vercel) están **activos en prod**. El teléfono se verifica con Firebase Phone Auth (proyecto `ziteo-a08f4`): el cliente dispara `signInWithPhoneNumber` con reCAPTCHA invisible, y `auth-otp-verify`/`auth-reset-pin` validan el ID token contra el JWKS de Google (`_shared/otp-firebase-adapter.ts`), sin Admin SDK. El código WhatsApp sigue intacto — volver es solo cambiar el secret `OTP_PROVIDER`, cero cambios de código (ver comentario en `_shared/otp-provider.ts`).

### Bug corregido — anti-replay roto en silencio
`otps.code` era `varchar(6)` (pensado para códigos WhatsApp de 6 dígitos), pero el adaptador Firebase guarda ahí el jti (`sub:auth_time`, ~39 chars) para bloquear reuso del mismo ID token. El insert fallaba y el error no se chequeaba → un mismo ID token de Firebase se podía reverificar indefinidamente dentro de su ventana de 10 min, sin dejar rastro. Fix: migración `20260729000001_widen_otps_code_for_firebase_jti.sql` (columna a `varchar(128)`) + el adaptador ahora chequea el error del insert y devuelve `{ok:false, reason:'INVALID'}` si falla (fail-closed).

### Throttle por IP (`_shared/ip-throttle.ts`)
Con SMS pagados (Firebase Blaze), el throttle por teléfono no alcanza — un bot rota números para quemar saldo (toll fraud). Se agregó `isIpThrottled()`, que reusa el RPC `check_throttle` ya existente con identificador `sms_ip:<ip>` (20/hora, lee `x-forwarded-for`). Aplicado en `auth/register`, `auth/otp-resend`, `auth/forgot-pin` — los tres puntos que disparan `provider.issue()`/`requestCode()`.

### Firebase Console — requisitos para SMS real
- **Blaze (Cloud Billing) obligatorio** desde sept-2024 para enviar SMS reales; sin eso solo responden los números de prueba configurados en Authentication → Sign-in method → Phone → *Phone numbers for testing*.
- **SMS region policy**: restringir a Bolivia (BO) — mitigación principal contra fraude de peaje, la mayoría de los ataques apuntan a rangos premium de otros países.
- **Authorized domains**: `ziteo-frontend.vercel.app` + `localhost`.
- Costo por SMS a Bolivia no está en las tablas públicas de Google (Phone Number Verification pricing solo lista 8 países); se ve recién en la consola al activar Blaze.

### Verificar con navegador real, no headless
El reCAPTCHA invisible de Firebase no completa su handshake en Playwright headless contra prod (se cuelga en `requestStorageAccess`/`getProjectConfig`). Usar el Browser pane (`mcp__Claude_Browser__*`) con compositing real, o un headed run. Un intento con Playwright headless simple también reveló un 403 real (`Requests from referer ... are blocked`) que resultó ser ruido del entorno headless, no del código — no confundir con un problema de Authorized domains.


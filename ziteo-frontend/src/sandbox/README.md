# Entorno de Simulación (Sandbox)

Prueba la cadena Comprador → Vendedor → Transportista sin pasarela de pago real ni API key de Google Maps, apuntando a un **proyecto Supabase separado y aislado** (`ziteoo-sandbox`, ref `bvesxfyvzjzqvswtflau`) — nunca al proyecto real. El código de mocks vive en `src/sandbox/` + un puente en `src/shared/config/simulation.ts` y `src/shared/geo/` (GeoService).

## Activar

1. `ziteo-frontend/.env.development.local` (no commiteado) con las credenciales del proyecto sandbox:
   ```
   VITE_SUPABASE_URL=https://bvesxfyvzjzqvswtflau.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key del proyecto ziteoo-sandbox>
   VITE_SIMULATION_MODE=true
   ```
   (valores de referencia en `.env.sandbox.local`, no commiteado).
2. El esquema del proyecto `ziteoo-sandbox` ya está replicado del proyecto real (tablas, RLS, funciones, triggers) más `20260710_provider_store_location.sql` y los RPCs `sim_force_payment` / `sim_force_dispatch` / `sim_force_pickup` / `sim_reset_chain` (sin guardas `is_sandbox` — innecesarias porque el proyecto entero es de pruebas).
3. Usuarios de prueba ya sembrados ahí: `constructor@sandbox.ziteoo.test`, `vendedor@sandbox.ziteoo.test`, `chofer@sandbox.ziteoo.test` (password `Sandbox123!`), con el vendedor con tienda geolocalizada (`STORE` en `src/sandbox/fixtures/coords.ts`) y 2 productos `[SIM]`.
4. `npm run dev` con esas env vars.

## Qué se simula

- **Mapas**: `GeoService` en modo `mock` (sin necesidad de `VITE_GOOGLE_MAPS_KEY`) — `MapPicker`/`LiveMap` degradan a `MockMapPicker`/`MockLiveMap` (SVG propio, sin dependencias). Coordenadas fijas en Santa Cruz (`fixtures/coords.ts`).
- **Pago**: `SimulatedPaymentPanel` reemplaza el paso QR de `QrPagoModal` con un QR SVG ficticio y un botón "Simular Pago Exitoso" que llama al RPC real `upload_payment_evidence` con una URL `sandbox://...` (no sube nada a Storage), disparando el trigger real de notificación al vendedor.
- **Resto de la cadena** (RPCs `place_order`, `confirm_payment_by_provider`, `accept_delivery`, `update_delivery_status`, triggers de notificación, Realtime) es el código real, sin mocks — se ejerce contra el proyecto sandbox tal cual corre en producción.

## Verificación E2E manual (3 perfiles de navegador)

1. **Constructor**: carrito → delivery → `MockMapPicker` (botones "Tienda"/"Obra") → pago QR → Confirmar. QR ficticio + "Simular Pago Exitoso".
2. **Vendedor**: campana suena en tiempo real ("Nuevo pedido").
3. **Constructor**: pulsa "Simular Pago Exitoso".
4. **Vendedor**: notificación "Pago por verificar" → "Validar Pago e Iniciar Envío".
5. **Chofer**: delivery en el pool con recogida/entrega `[SIM]` y `MockMap` con markers.
6. **Chofer**: Aceptar → en tránsito → entregado.
7. **Constructor**: ve el camión moviéndose en `MockLiveMap` (GPS simulado con jitter).

Para forzar transiciones sin las 3 sesiones, usar los RPCs `sim_force_payment(order_id)` / `sim_force_dispatch(order_id)` / `sim_force_pickup(order_id, driver_id)` / `sim_reset_chain()` directamente vía SQL editor del proyecto `ziteoo-sandbox` — no hay panel de UI para esto (se descartó; ver nota abajo).

## Apagar

Quitar `VITE_SIMULATION_MODE` o apuntar las env vars al proyecto real de nuevo. El código de `src/sandbox/` solo se importa (y por tanto solo entra al bundle) cuando `SIMULATION` es `true` en build time — en producción los `import()` dinámicos nunca se resuelven en runtime (verificado: `grep -c sandbox dist/index.html` → 0, ningún chunk raíz referencia los nombres de archivo del sandbox).

## Nota de diseño: no hay overlay de forzado en la app

La versión inicial incluía un "Developer Sandbox Overlay" (panel flotante con botones Forzar Pago/Despacho/Recogida) diseñado para correr con guardas `is_sandbox`/`sandbox_config` en la **misma** base de datos que la app real. Se descartó ese enfoque en favor de un proyecto Supabase completamente separado (más seguro: cero riesgo de tocar datos reales), y con eso las guardas dejaron de tener sentido — los RPCs `sim_*` del sandbox no las llevan. El overlay de UI no se portó; para forzar transiciones se usa el SQL editor directamente contra `ziteoo-sandbox`.

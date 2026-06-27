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

# Fix P0 checkout Tienda — captura dirección de entrega atómica (2026-06-26)

## Qué se hizo
Corregido el bug P0 donde el checkout de la Tienda generaba órdenes con delivery_address/lat/lng NULL.

## Causa raíz
CartDrawer.handleConfirm llamaba placeOrder({}) con vars vacías. El RPC place_order insertaba delivery_method='delivery' pero address/lat/lng = NULL. El trigger auto_create_delivery_on_processing no podía propagar coords nulas al chofer.

## Solución (commit e33ecf2)
- RPC place_order ampliado con p_cargo_type text DEFAULT NULL. Migración 20260626_place_order_cargo_type.sql aplicada en prod. Overload viejo eliminado (20260626_drop_place_order_old_overload.sql).
- usePlaceOrder en useOrders.ts: vars extendidas a {deliveryMethod, deliveryAddress, deliveryLat, deliveryLng}. Todo pasa atómicamente al RPC en una sola llamada. Eliminados 2 parches post-insert con console.warn.
- Nuevo componente DeliverySection.tsx: toggle delivery/pickup + MapPicker cuando es delivery.
- Nuevo componente CargoSelector.tsx: selector light/heavy extraído de CartDrawer.
- CartDrawer.tsx refactorizado: integra DeliverySection + CargoSelector, bloquea Confirmar si no hay dirección, 348 líneas.
- CheckoutScreen.tsx eliminado (código muerto, cero imports).

## Archivos clave
- ziteo-frontend/src/features/tienda/hooks/useOrders.ts
- ziteo-frontend/src/features/tienda/components/CartDrawer.tsx
- ziteo-frontend/src/features/tienda/components/DeliverySection.tsx
- ziteo-frontend/src/features/tienda/components/CargoSelector.tsx
- supabase/migrations/20260626_place_order_cargo_type.sql

## Patrón establecido
El checkout SIEMPRE pasa delivery_method/address/lat/lng/cargo_type al RPC place_order en una sola llamada. Nunca UPDATE post-insert. Documentado en ziteo-frontend/CLAUDE.md.

## Componentes del sistema afectados

### Frontend
- **CartDrawer** (Tienda): estado deliveryMethod + deliveryLoc, integra DeliverySection y CargoSelector
- **DeliverySection**: toggle delivery/pickup + MapPicker condicional
- **CargoSelector**: selector light/heavy con detección automática por peso
- **usePlaceOrder** (useOrders.ts): hook de mutación con vars de entrega completas

### Backend
- **RPC place_order**: función PostgreSQL SECURITY DEFINER, ahora acepta p_cargo_type
- **Tabla orders**: columnas delivery_method, delivery_address, delivery_lat, delivery_lng, cargo_type todas pobladas en el INSERT inicial
- **Trigger auto_create_delivery_on_processing**: hereda coords de orders al crear delivery para el chofer

## Relaciones con otros sistemas
- MapPicker (shared component) — ya existía, usado también en ConstructorTiendaTab
- trigger trg_notify_provider_on_new_order — no modificado, sigue funcionando
- Web Push fire-and-forget — silenciado correctamente con .catch(() => {})

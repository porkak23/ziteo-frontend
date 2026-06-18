-- Fix CRITICAL: orders_status_check no incluía 'processing' ni 'expired'.
-- Sin 'processing', el proveedor no podía avanzar la orden y el trigger
-- auto_create_delivery_on_processing nunca disparaba -> nunca se creaban
-- entregas y el radar del transportista quedaba vacío (Flujo A y D rotos).
-- Sin 'expired', el cron de expiración tampoco podía marcar órdenes vencidas.
-- El constraint quedó desincronizado con validate_order_status_transition,
-- que sí contempla ambos estados.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'expired'
  ));

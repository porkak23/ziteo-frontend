-- Fix: el vendedor no tenía ubicación de tienda persistida, así que el trigger
-- auto_create_delivery_on_processing solo llenaba dropoff_* (destino) y nunca
-- pickup_* (recogida). El transportista veía "Pendiente" como origen en TODAS
-- las entregas de Tienda. Este fix es independiente del sandbox de simulación.

ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS store_address text,
  ADD COLUMN IF NOT EXISTS store_lat numeric,
  ADD COLUMN IF NOT EXISTS store_lng numeric;

CREATE OR REPLACE FUNCTION auto_create_delivery_on_processing()
RETURNS TRIGGER AS $$
DECLARE
  v_pickup_address text;
  v_pickup_lat numeric;
  v_pickup_lng numeric;
BEGIN
  IF OLD.status <> 'processing' AND NEW.status = 'processing' THEN
    SELECT store_address, store_lat, store_lng
      INTO v_pickup_address, v_pickup_lat, v_pickup_lng
      FROM user_roles
      WHERE user_id = NEW.provider_id AND role = 'proveedor'
      LIMIT 1;

    INSERT INTO deliveries (
      order_id,
      status,
      cargo_type,
      pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address,
      dropoff_lat,
      dropoff_lng
    )
    VALUES (
      NEW.id,
      'pending',
      COALESCE(NEW.cargo_type, 'light'),
      v_pickup_address,
      v_pickup_lat,
      v_pickup_lng,
      NEW.delivery_address,
      NEW.delivery_lat,
      NEW.delivery_lng
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

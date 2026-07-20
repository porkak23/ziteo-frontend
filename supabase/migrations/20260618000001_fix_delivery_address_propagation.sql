-- Fix: auto_create_delivery_on_processing no propagaba delivery_address desde orders.
-- El trigger ahora copia delivery_address → dropoff_address y las coordenadas,
-- para que el transportista vea la dirección de entrega en el radar.

CREATE OR REPLACE FUNCTION auto_create_delivery_on_processing()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> 'processing' AND NEW.status = 'processing' THEN
    INSERT INTO deliveries (
      order_id,
      status,
      cargo_type,
      dropoff_address,
      dropoff_lat,
      dropoff_lng
    )
    VALUES (
      NEW.id,
      'pending',
      COALESCE(NEW.cargo_type, 'light'),
      NEW.delivery_address,
      NEW.delivery_lat,
      NEW.delivery_lng
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

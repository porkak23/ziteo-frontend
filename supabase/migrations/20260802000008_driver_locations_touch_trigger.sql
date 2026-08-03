-- ============================================================
-- MIGRATION: 20260802000008_driver_locations_touch_trigger.sql
-- Fix P3: driver_locations.updated_at no se refrescaba en un UPDATE
-- directo (solo el RPC upsert_driver_location lo seteaba a mano). La
-- policy driver_can_upsert_own_location es FOR ALL, así que un UPDATE
-- directo a la tabla es posible y no dejaba rastro de frescura.
-- Impacto: el mapa admin usa updated_at para marcar choferes "sin
-- señal" (>5min), y un chofer inactivo con updated_at viejo por UPDATE
-- directo se veía "activo".
-- ============================================================
--
-- update_updated_at_column() ya existe en prod (la usa orders_updated_at)
-- — no se crea de nuevo, solo se referencia.

DROP TRIGGER IF EXISTS trg_driver_locations_updated_at ON public.driver_locations;
CREATE TRIGGER trg_driver_locations_updated_at
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

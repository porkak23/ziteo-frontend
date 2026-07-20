-- Remove the legacy overload of place_order that lacked p_cargo_type.
-- The new overload (added in 20260626_place_order_cargo_type.sql) is a superset.
DROP FUNCTION IF EXISTS public.place_order(uuid, uuid, numeric, jsonb, text, text, double precision, double precision);

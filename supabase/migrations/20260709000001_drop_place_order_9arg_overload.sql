-- ============================================================
-- MIGRATION: 20260709_drop_place_order_9arg_overload.sql
-- Fixes PGRST203 / HTTP 300 "Multiple Choices" on checkout:
-- place_order() has two coexisting overloads in prod (9-arg and
-- 10-arg with p_project_id). PostgREST cannot disambiguate which
-- one to call via RPC, so every checkout confirmation fails.
-- The 10-arg version (with p_project_id) is the correct/current
-- one used by the frontend. Drop the stale 9-arg overload only.
-- ============================================================

DROP FUNCTION IF EXISTS public.place_order(
  uuid, uuid, numeric, jsonb, text, text, double precision, double precision, text
);

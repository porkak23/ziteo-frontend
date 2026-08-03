-- ============================================================
-- MIGRATION: 20260802000003_public_role_profiles_view.sql
-- Fix P1: user_roles exponía la fila completa de un tercero a
-- cualquier autenticado, incluidas coordenadas exactas de tienda y
-- datos del chofer de flota. Verificado en prod: un maestro leyó
-- store_lat/store_lng/vehicle_plate/fleet_driver_name de un proveedor.
-- ============================================================
--
-- Las policies culpables ("Public read maestro roles", "Public read
-- proveedor roles") NO están en ninguna migración de este repo — son
-- drift creado a mano en el dashboard. Las columnas sensibles se
-- agregaron DESPUÉS de escribirlas (20260529, 20260629, 20260710) y
-- un SELECT con policy amplia hereda automáticamente toda columna
-- nueva.
--
-- Qué queda público y por qué (verificado contra el frontend, no
-- supuesto): payment_cash, payment_bank_transfer y payment_qr_url SÍ
-- se renderizan hoy a cualquier visitante en VendedorPublicProfile.tsx
-- y MaestroPublicProfile.tsx (línea ~479-482 y ~161-163 respectivamente)
-- — son la ficha de cobro pública del vendedor/maestro, intencional en
-- este producto. store_lat, store_lng, vehicle_plate y
-- fleet_driver_name en cambio se traían con select('*') pero NUNCA se
-- renderizan en ninguna pantalla pública (grep confirmó cero
-- coincidencias) — esas sí salen de la vista. payment_qr_hash no lo
-- trae ningún hook de perfil público (es interno, usado solo por
-- getProviderQrForDelivery con guard) y tampoco entra.

CREATE OR REPLACE VIEW public.public_role_profiles
WITH (security_barrier = true)
AS
SELECT
  user_id,
  role,
  company_name,
  store_name,
  store_description,
  store_logo_url,
  store_address,
  specialty,
  years_experience,
  hourly_rate,
  is_available,
  is_verified,
  min_order_amount,
  delivery_time_hours,
  free_shipping_threshold,
  service_zones,
  payment_cash,
  payment_bank_transfer,
  payment_qr_url,
  vehicle_available,
  onboarding_completed,
  created_at,
  updated_at
FROM public.user_roles
WHERE onboarding_completed = true
  AND role IN ('maestro', 'proveedor');

COMMENT ON VIEW public.public_role_profiles IS
  'Ficha pública de maestro/proveedor: mismas columnas que hoy se '
  'renderizan a terceros en MaestroPublicProfile/VendedorPublicProfile. '
  'Excluye store_lat/lng, vehicle_plate, fleet_driver_name y '
  'payment_qr_hash — ninguna se muestra en pantalla pública hoy.';

-- security_barrier (no security_invoker): esta vista ES la frontera de
-- autorización para lectura pública de terceros — su WHERE es la
-- policy. Dueño postgres, GRANT explícito a authenticated. Distinto
-- del patrón de 20260801000001 (esas vistas heredan RLS del invocante
-- porque exponen datos ya cubiertos por policies existentes; acá la
-- policy pública se está retirando de user_roles en este mismo archivo,
-- así que la vista reemplaza esa función en vez de heredarla).
GRANT SELECT ON public.public_role_profiles TO authenticated;
REVOKE SELECT ON public.public_role_profiles FROM anon;

-- Retirar las dos policies de lectura pública amplia de user_roles.
-- Queda: "Users view own roles" (dueño, todas las columnas — correcto,
-- el dueño necesita sus propios store_lat/vehicle_plate para editar) y
-- "admin_select_all_user_roles". La vista de arriba cubre el caso
-- público que estas dos cubrían.
DROP POLICY IF EXISTS "Public read maestro roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public read proveedor roles" ON public.user_roles;

-- ────────────────────────────────────────────────────────────────
-- payment_qr_url y payment_qr_hash NO entran a la vista pública (son
-- sensibles) pero dos flujos legítimos los leen de un tercero con su
-- propio guard en JS, apoyados hasta ahora en la policy pública amplia
-- que se acaba de retirar: usePaymentQr.ts:getSignedQrUrl (comprador
-- con ≥1 orden con ese proveedor) y getProviderQrForDelivery (chofer
-- con una entrega asignada a esa orden). Se convierten en RPC
-- SECURITY DEFINER que replican el mismo guard en SQL — no relajan
-- nada, solo mueven la verificación de JS a la base.
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_provider_qr_path(
  p_provider_user_id uuid,
  p_role text DEFAULT 'proveedor'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_order boolean;
  v_qr_path   text;
BEGIN
  IF p_role <> 'maestro' THEN
    SELECT EXISTS (
      SELECT 1 FROM orders
       WHERE provider_id = p_provider_user_id
         AND constructor_id = auth.uid()
       LIMIT 1
    ) INTO v_has_order;

    IF NOT v_has_order THEN
      RETURN NULL;
    END IF;
  END IF;

  SELECT payment_qr_url INTO v_qr_path
    FROM user_roles
   WHERE user_id = p_provider_user_id AND role = p_role
   LIMIT 1;

  RETURN v_qr_path;
END;
$$;

REVOKE ALL ON FUNCTION public.get_provider_qr_path(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_qr_path(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_provider_qr_path(uuid, text) FROM anon;

CREATE OR REPLACE FUNCTION public.get_provider_qr_for_delivery(p_delivery_id uuid)
RETURNS TABLE(qr_path text, qr_hash text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id    uuid;
  v_provider_id uuid;
BEGIN
  SELECT order_id INTO v_order_id
    FROM deliveries
   WHERE id = p_delivery_id
     AND driver_id = auth.uid();

  IF v_order_id IS NULL THEN
    RETURN;
  END IF;

  SELECT provider_id INTO v_provider_id FROM orders WHERE id = v_order_id;
  IF v_provider_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT payment_qr_url, payment_qr_hash
      FROM user_roles
     WHERE user_id = v_provider_id AND role = 'proveedor'
     LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_provider_qr_for_delivery(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_qr_for_delivery(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_provider_qr_for_delivery(uuid) FROM anon;

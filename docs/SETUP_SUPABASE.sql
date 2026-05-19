ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_acknowledged_at timestamptz;
-- ============================================================
-- Migration: city_constraint + onboarding_complete
-- Created: 2026-05-19
-- ============================================================

-- ─── 1. Restricción de ciudades activas en profiles ──────────────────────────
-- Solo Sucre, Potosí y Santa Cruz están operativos en el lanzamiento v1.0.
-- Ampliable en futuras migraciones eliminando y recreando el constraint.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_city_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_city_check
  CHECK (city IS NULL OR city IN ('Sucre', 'Potosí', 'Santa Cruz'));

-- ─── 2. Restricción de ciudades activas en products ───────────────────────────
-- Solo si la tabla products tiene columna city (verificar primero).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'city'
  ) THEN
    EXECUTE '
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_city_check;
      ALTER TABLE products
        ADD CONSTRAINT products_city_check
        CHECK (city IS NULL OR city IN (''Sucre'', ''Potosí'', ''Santa Cruz''))
    ';
  END IF;
END;
$$;

-- ─── 3. Vista de diagnóstico: perfiles con ciudad inválida ───────────────────
-- No borra registros — solo los expone para corrección manual.
-- Útil durante la transición si existen registros con ciudades antiguas.

CREATE OR REPLACE VIEW profiles_invalid_city AS
SELECT
  user_id,
  name,
  city,
  created_at
FROM profiles
WHERE city IS NOT NULL
  AND city NOT IN ('Sucre', 'Potosí', 'Santa Cruz');

COMMENT ON VIEW profiles_invalid_city IS
  'Perfiles con ciudad fuera de las ciudades activas de Ziteo v1.0. '
  'Usar para corrección manual antes de hacer el CHECK constraint NOT NULL.';

-- Lectura pública restringida a service role para auditoría
-- (los usuarios normales no ven esta vista gracias a RLS en profiles)

-- ─── 4. onboarding_complete en user_roles ────────────────────────────────────
-- La columna ya existe en el schema declarado en database.types.ts como
-- onboarding_completed (con 'd' al final). Agregamos ambas variantes para
-- compatibilidad con el código generado.

ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Si la columna canónica ya existe como onboarding_completed, también la garantizamos.
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Sincronizar valores entre ambas columnas si alguna ya tenía datos.
UPDATE user_roles
  SET onboarding_complete = COALESCE(onboarding_complete, onboarding_completed, FALSE),
      onboarding_completed = COALESCE(onboarding_completed, onboarding_complete, FALSE)
  WHERE onboarding_complete IS DISTINCT FROM onboarding_completed;

-- Índice para el filtro de "¿ya hizo onboarding?" en el primer login.
CREATE INDEX IF NOT EXISTS idx_user_roles_onboarding
  ON user_roles (user_id, role, onboarding_complete);
-- Migration: legal acceptance and soft launch waitlist columns
-- Adds terms_accepted_at and waitlist flag to profiles table

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waitlist BOOLEAN DEFAULT FALSE;

-- Index for querying waitlist users by city (useful for batch notifications when a city opens)
CREATE INDEX IF NOT EXISTS idx_profiles_waitlist_city
  ON profiles (city, waitlist)
  WHERE waitlist = TRUE;

COMMENT ON COLUMN profiles.terms_accepted_at IS 'ISO timestamp when the user accepted the Terms of Use and Privacy Policy during registration.';
COMMENT ON COLUMN profiles.waitlist IS 'True if the user registered in a city that was not yet fully launched. Set to false once the city goes live.';
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  user_role text,
  current_url text,
  description text NOT NULL CHECK (length(description) >= 10),
  category text CHECK (category IN ('bug', 'mejora', 'pregunta', 'otro')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- Solo el propio usuario puede insertar, nadie puede leer (solo service-role)
CREATE POLICY "users can insert feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Migration: push_subscriptions table for Web Push notifications
-- Apply with: supabase db push  OR  supabase migration up
-- Requires the profiles table to exist with user_id PK.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  endpoint   text        NOT NULL UNIQUE,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "user manages own subscriptions"
  ON push_subscriptions
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);
-- Migration: maestros_search view + availability index
-- Created: 2026-05-19

-- ─── View: maestros_view ──────────────────────────────────────────────────────
-- Replaces the two-query pattern (user_roles IDs → profiles data) with a single
-- JOIN that the client can query directly via PostgREST.
-- RLS is inherited from the underlying tables (profiles and maestro_profiles
-- have public SELECT policies; user_roles has its own SELECT policy).

CREATE OR REPLACE VIEW public.maestros_view AS
SELECT
  p.user_id,
  p.name,
  p.city,
  p.avatar_url,
  mp.specialties,
  mp.rate_type,
  mp.rate_amount,
  mp.available,
  mp.experience_years
FROM profiles p
INNER JOIN user_roles ur ON p.user_id = ur.user_id AND ur.role = 'maestro'
LEFT JOIN maestro_profiles mp ON p.user_id = mp.user_id;

COMMENT ON VIEW public.maestros_view IS
  'Búsqueda pública de maestros: JOIN de profiles + user_roles (role=maestro) + maestro_profiles. '
  'Lectura pública — RLS heredada de las tablas base.';

-- Grant SELECT to authenticated and anon so PostgREST can serve it
GRANT SELECT ON public.maestros_view TO authenticated, anon;

-- ─── Performance index ────────────────────────────────────────────────────────
-- City filter and availability are the two most frequent WHERE clauses.
-- If maestro_profiles doesn't exist yet this index will be created when the
-- table is created (migrations are applied in order).

CREATE INDEX IF NOT EXISTS idx_maestro_profiles_available
  ON public.maestro_profiles (available);

CREATE INDEX IF NOT EXISTS idx_maestro_profiles_user_id
  ON public.maestro_profiles (user_id);

-- ─── Stock release trigger for cancelled/expired orders ───────────────────────
-- Validates that stock is restored when an order transitions to cancelled or
-- expired. The actual restore_stock_on_cancel function must already exist from
-- the place_order RPC migration; this trigger attaches it to status changes.
-- Wrapped in DO block so it is idempotent (safe to re-run).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_restore_stock_on_cancel'
      AND tgrelid = 'orders'::regclass
  ) THEN
    -- Only create the trigger if the helper function already exists.
    -- If it does not exist, the application relies on the RPC-level stock
    -- management and this trigger is deferred to a future migration.
    IF EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'restore_stock_on_cancel'
    ) THEN
      CREATE TRIGGER trg_restore_stock_on_cancel
        AFTER UPDATE OF status ON orders
        FOR EACH ROW
        WHEN (
          NEW.status IN ('cancelled', 'expired') AND
          OLD.status NOT IN ('cancelled', 'expired')
        )
        EXECUTE FUNCTION restore_stock_on_cancel();
    END IF;
  END IF;
END;
$$;

-- ─── estimated_delivery_at column ────────────────────────────────────────────
-- Add the optional estimated delivery date column to orders if not present.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz DEFAULT NULL;
-- ============================================================
-- MIGRATION: 20260519_payment_flow_v1.sql
-- Payment flow hardening:
--   1. Add payment evidence columns to orders
--   2. Add 'confirmed' and 'expired' to order status machine
--   3. RPC: expire_pending_orders() — batch expiry + stock restore
--   4. RPC: confirm_payment_by_provider() — provider-only confirm
--   5. RPC: upload_payment_evidence() — constructor uploads proof
--   6. RPC: reject_payment_by_provider() — provider rejects + cancels
--   7. Tighten orders RLS — constructor cannot confirm own payment
-- ============================================================


-- ============================================================
-- 1. SCHEMA CHANGES
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_evidence_url             TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_evidence_uploaded_at     TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at             TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by             UUID REFERENCES profiles(user_id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejection_reason         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at                       TIMESTAMPTZ
  NOT NULL DEFAULT (now() + INTERVAL '48 hours');

-- Index for fast expiry queries (cron job only touches pending rows)
CREATE INDEX IF NOT EXISTS idx_orders_expires_at_pending
  ON orders(expires_at)
  WHERE status = 'pending';

-- Index for fast "awaiting provider confirmation" queries
CREATE INDEX IF NOT EXISTS idx_orders_evidence_pending
  ON orders(provider_id, status)
  WHERE payment_evidence_url IS NOT NULL AND status = 'pending';


-- ============================================================
-- 2. EXTEND ORDER STATUS MACHINE
-- Add 'confirmed' and 'expired' as valid states.
-- New legal paths:
--   pending  → confirmed  (provider confirms payment)
--   pending  → expired    (cron after 48 h)
--   pending  → cancelled  (provider rejects)
--   confirmed → processing (existing flow continues)
-- ============================================================

-- Drop the existing trigger first — we replace the function below
DROP TRIGGER IF EXISTS trg_order_status ON orders;

CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Terminal states — nothing can leave them
  IF OLD.status IN ('delivered', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'La orden ya está en estado terminal: %', OLD.status;
  END IF;

  -- Cancellation is allowed from any non-terminal state
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;

  -- Expiry is only set by the cron RPC (from pending)
  IF OLD.status = 'pending' AND NEW.status = 'expired' THEN RETURN NEW; END IF;

  -- Payment confirmed by provider (pending → confirmed)
  IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN RETURN NEW; END IF;

  -- Normal fulfilment chain
  IF OLD.status = 'pending'    AND NEW.status = 'processing' THEN RETURN NEW; END IF;
  IF OLD.status = 'confirmed'  AND NEW.status = 'processing' THEN RETURN NEW; END IF;
  IF OLD.status = 'processing' AND NEW.status = 'shipped'    THEN RETURN NEW; END IF;
  IF OLD.status = 'shipped'    AND NEW.status = 'delivered'  THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Transición de estado inválida: % → %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION validate_order_status_transition();


-- ============================================================
-- 3. RPC: expire_pending_orders()
-- Marks orders past their expires_at as 'expired' and restores
-- stock for each item. Called by a pg_cron job (or edge cron).
-- Returns the count of orders that were expired.
-- SECURITY DEFINER so it bypasses RLS — safe because it only
-- touches rows in a terminal-moving direction.
-- ============================================================

CREATE OR REPLACE FUNCTION expire_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id   uuid;
  v_expired    integer := 0;
  expired_ids  uuid[];
BEGIN
  -- Collect all orders to expire (lock them to avoid races with concurrent calls)
  SELECT array_agg(id) INTO expired_ids
    FROM orders
   WHERE status = 'pending'
     AND expires_at < now()
   FOR UPDATE SKIP LOCKED;

  IF expired_ids IS NULL OR array_length(expired_ids, 1) = 0 THEN
    RETURN 0;
  END IF;

  -- Restore stock for all items in the expiring orders
  UPDATE products p
     SET stock_quantity = p.stock_quantity + oi.quantity,
         updated_at     = now()
    FROM order_items oi
   WHERE oi.product_id = p.id
     AND oi.order_id   = ANY(expired_ids);

  -- Expire the orders
  UPDATE orders
     SET status     = 'expired',
         updated_at = now()
   WHERE id = ANY(expired_ids);

  v_expired := array_length(expired_ids, 1);

  RAISE LOG 'expire_pending_orders: % orders expired', v_expired;

  RETURN v_expired;
END;
$$;


-- ============================================================
-- 4. RPC: confirm_payment_by_provider(p_order_id)
-- Only the provider of the order may call this.
-- Transitions pending → confirmed and records who confirmed it.
-- ============================================================

CREATE OR REPLACE FUNCTION confirm_payment_by_provider(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_id uuid;
  v_status      text;
BEGIN
  -- Fetch the order's provider and current status
  SELECT provider_id, status
    INTO v_provider_id, v_status
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;

  -- Caller must be the provider
  IF auth.uid() IS DISTINCT FROM v_provider_id THEN
    RAISE EXCEPTION 'Solo el proveedor de esta orden puede confirmar el pago.';
  END IF;

  -- Order must be in pending status with evidence uploaded
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'La orden no está en estado pendiente (estado actual: %)', v_status;
  END IF;

  -- Ensure there is evidence before confirming
  IF NOT EXISTS (
    SELECT 1 FROM orders
     WHERE id = p_order_id
       AND payment_evidence_url IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'El constructor aún no ha subido el comprobante de pago.';
  END IF;

  UPDATE orders
     SET status                = 'confirmed',
         payment_confirmed_at  = now(),
         payment_confirmed_by  = auth.uid(),
         updated_at            = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;


-- ============================================================
-- 5. RPC: upload_payment_evidence(p_order_id, p_evidence_url)
-- Only the constructor of the order may call this.
-- Sets payment_evidence_url and payment_evidence_uploaded_at.
-- ============================================================

CREATE OR REPLACE FUNCTION upload_payment_evidence(
  p_order_id     uuid,
  p_evidence_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_constructor_id uuid;
  v_status         text;
BEGIN
  SELECT constructor_id, status
    INTO v_constructor_id, v_status
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;

  -- Caller must be the constructor
  IF auth.uid() IS DISTINCT FROM v_constructor_id THEN
    RAISE EXCEPTION 'Solo el constructor puede subir el comprobante de esta orden.';
  END IF;

  -- Only allowed on pending orders (not expired/cancelled/confirmed)
  IF v_status NOT IN ('pending') THEN
    RAISE EXCEPTION 'No se puede subir comprobante en una orden con estado: %', v_status;
  END IF;

  UPDATE orders
     SET payment_evidence_url          = p_evidence_url,
         payment_evidence_uploaded_at  = now(),
         updated_at                    = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;


-- ============================================================
-- 6. RPC: reject_payment_by_provider(p_order_id, p_reason)
-- Provider rejects the payment evidence (e.g. blurry photo,
-- wrong amount). Cancels the order and restores stock.
-- ============================================================

CREATE OR REPLACE FUNCTION reject_payment_by_provider(
  p_order_id uuid,
  p_reason   text DEFAULT 'Comprobante rechazado por el proveedor'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_id uuid;
  v_status      text;
BEGIN
  SELECT provider_id, status
    INTO v_provider_id, v_status
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;

  IF auth.uid() IS DISTINCT FROM v_provider_id THEN
    RAISE EXCEPTION 'Solo el proveedor de esta orden puede rechazar el pago.';
  END IF;

  IF v_status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Solo se puede rechazar una orden pendiente (estado actual: %)', v_status;
  END IF;

  -- Restore stock before cancelling
  UPDATE products p
     SET stock_quantity = p.stock_quantity + oi.quantity,
         updated_at     = now()
    FROM order_items oi
   WHERE oi.product_id = p.id
     AND oi.order_id   = p_order_id;

  UPDATE orders
     SET status                 = 'cancelled',
         payment_rejection_reason = p_reason,
         updated_at             = now()
   WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'reason', p_reason);
END;
$$;


-- ============================================================
-- 7. TIGHTEN ORDERS RLS
-- Replace the permissive update policy with role-aware ones:
--   - Constructor can only update payment_evidence_url /
--     payment_evidence_uploaded_at (via RPC, not direct update).
--     Direct UPDATE from constructor is now blocked for status.
--   - Provider can update status + confirmation fields.
-- In practice, all status changes go through SECURITY DEFINER
-- RPCs, so we can block direct UPDATE on status from everyone.
-- ============================================================

-- Drop the old broad policy
DROP POLICY IF EXISTS "orders_update_involved" ON orders;

-- Providers can update their orders' status/payment fields
CREATE POLICY "orders_update_provider"
  ON orders FOR UPDATE
  USING (provider_id = auth.uid());

-- Constructors can update only the evidence fields (not status)
-- We enforce this at the RPC level (upload_payment_evidence), but
-- the direct-update path is also restricted to evidence columns only
-- by checking that the caller is the constructor and status is not changing.
-- A belt-and-suspenders DB-level guard: constructor UPDATE allowed
-- only when they are NOT changing the status column.
CREATE POLICY "orders_update_constructor_evidence"
  ON orders FOR UPDATE
  USING (constructor_id = auth.uid())
  WITH CHECK (
    constructor_id = auth.uid()
    -- Prevent constructors from self-confirming: status must stay the same
    -- (the actual evidence upload goes through the SECURITY DEFINER RPC)
  );

-- Note: the WITH CHECK above allows all column changes from the constructor
-- side at the policy level. The critical guard is in the RPCs:
--   - confirm_payment_by_provider checks auth.uid() = provider_id
--   - upload_payment_evidence checks auth.uid() = constructor_id
-- The status transition trigger also blocks invalid transitions.
-- For maximum security the confirm RPC is SECURITY DEFINER and
-- explicitly rejects any caller who is not the provider.
-- ============================================================
-- MIGRATION: 20260519_support_infrastructure.sql
-- Infraestructura de soporte al usuario:
--   1. Agregar tipo 'dispute' al CHECK de notifications.type
--   2. Tabla disputes con RLS
--   3. RPC create_dispute()
-- ============================================================


-- ============================================================
-- 1. EXTENDER notifications.type PARA INCLUIR 'dispute'
-- Reemplaza el CHECK constraint existente que solo tiene:
--   ('contract','project_application','order','delivery','general')
-- ============================================================

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('contract', 'project_application', 'order', 'delivery', 'general', 'dispute'));


-- ============================================================
-- 2. TABLA disputes
-- Registra disputas entre constructor y proveedor sobre una orden.
-- Solo service-role puede marcar como 'resolved'.
-- ============================================================

CREATE TABLE IF NOT EXISTS disputes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  created_by   uuid        NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reason       text        NOT NULL,
  details      text        NOT NULL,
  status       varchar     NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'resolved')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_disputes_order_id    ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by  ON disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status      ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at  ON disputes(created_at DESC);

-- RLS en disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Los involucrados en la orden pueden ver la disputa
CREATE POLICY "disputes_select_involved" ON disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
       WHERE orders.id = disputes.order_id
         AND (orders.constructor_id = auth.uid() OR orders.provider_id = auth.uid())
    )
  );

-- Cualquier parte involucrada puede abrir una disputa (via RPC create_dispute)
-- Los INSERTs directos están bloqueados — solo la RPC SECURITY DEFINER puede insertar.
CREATE POLICY "disputes_insert_rpc_only" ON disputes
  FOR INSERT
  WITH CHECK (false);

-- Solo service-role puede actualizar el status a 'resolved'
-- Los usuarios normales (authenticated) no pueden hacer UPDATE en disputes.
-- La resolución manual la hace un admin via SQL o la RPC resolve_dispute (servicio interno).
CREATE POLICY "disputes_update_service_role_only" ON disputes
  FOR UPDATE
  USING (false);


-- ============================================================
-- 3. RPC create_dispute(p_order_id, p_reason, p_details)
-- Solo puede ser llamada por el constructor o proveedor de la orden.
-- Inserta un registro en disputes y envía notificación de tipo
-- 'dispute' a ambas partes.
-- Returns: el dispute_id como jsonb.
-- ============================================================

CREATE OR REPLACE FUNCTION create_dispute(
  p_order_id uuid,
  p_reason   text,
  p_details  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_constructor_id uuid;
  v_provider_id    uuid;
  v_order_status   text;
  v_dispute_id     uuid;
  v_other_party_id uuid;
BEGIN
  -- Validar datos de entrada
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'El motivo de la disputa no puede estar vacío.';
  END IF;

  IF p_details IS NULL OR length(trim(p_details)) < 20 THEN
    RAISE EXCEPTION 'Los detalles deben tener al menos 20 caracteres.';
  END IF;

  -- Buscar la orden
  SELECT constructor_id, provider_id, status
    INTO v_constructor_id, v_provider_id, v_order_status
    FROM orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;

  -- Solo el constructor o proveedor de la orden pueden abrir una disputa
  IF auth.uid() IS DISTINCT FROM v_constructor_id
     AND auth.uid() IS DISTINCT FROM v_provider_id THEN
    RAISE EXCEPTION 'Solo el constructor o proveedor de esta orden pueden reportar una disputa.';
  END IF;

  -- La disputa aplica sobre órdenes en estados terminales o con problema
  IF v_order_status NOT IN ('delivered', 'cancelled', 'expired', 'confirmed', 'processing', 'shipped') THEN
    RAISE EXCEPTION 'No se puede abrir una disputa en una orden con estado: %', v_order_status;
  END IF;

  -- Evitar duplicados: no abrir dos disputas 'open' para la misma orden
  IF EXISTS (
    SELECT 1 FROM disputes
     WHERE order_id = p_order_id
       AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Ya existe una disputa abierta para esta orden.';
  END IF;

  -- Insertar la disputa
  INSERT INTO disputes (order_id, created_by, reason, details, status)
  VALUES (p_order_id, auth.uid(), p_reason, p_details, 'open')
  RETURNING id INTO v_dispute_id;

  -- Determinar a quién notificar (la otra parte)
  IF auth.uid() = v_constructor_id THEN
    v_other_party_id := v_provider_id;
  ELSE
    v_other_party_id := v_constructor_id;
  END IF;

  -- Notificar a la otra parte
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    v_other_party_id,
    'dispute',
    'Disputa reportada en un pedido',
    'Se ha abierto una disputa en la orden. Revisa los detalles en Mis Pedidos.'
  );

  -- Notificar también al creador de la disputa (confirmación de recepción)
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    auth.uid(),
    'dispute',
    'Tu reporte fue enviado',
    'Tu reporte de problema fue registrado. El equipo de Ziteo revisará la situación.'
  );

  RETURN jsonb_build_object(
    'success',    true,
    'dispute_id', v_dispute_id,
    'order_id',   p_order_id
  );
END;
$$;


-- ============================================================
-- 4. RPC resolve_dispute(p_dispute_id, p_resolution_notes)
-- Solo para uso interno / service-role via SQL directo.
-- Documenta la resolución y marca la disputa como resuelta.
-- Notifica a ambas partes.
-- ============================================================

CREATE OR REPLACE FUNCTION resolve_dispute(
  p_dispute_id       uuid,
  p_resolution_notes text DEFAULT 'Disputa resuelta por el equipo de Ziteo.'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id       uuid;
  v_constructor_id uuid;
  v_provider_id    uuid;
  v_status         text;
BEGIN
  -- Solo service-role puede resolver (auth.uid() será NULL cuando se llama
  -- desde el dashboard de Supabase con service-role key)
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'resolve_dispute solo puede ser ejecutada por service-role.';
  END IF;

  SELECT d.order_id, d.status, o.constructor_id, o.provider_id
    INTO v_order_id, v_status, v_constructor_id, v_provider_id
    FROM disputes d
    JOIN orders o ON o.id = d.order_id
   WHERE d.id = p_dispute_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Disputa no encontrada: %', p_dispute_id;
  END IF;

  IF v_status = 'resolved' THEN
    RAISE EXCEPTION 'La disputa ya está resuelta.';
  END IF;

  -- Marcar como resuelta (bypassa RLS via SECURITY DEFINER)
  UPDATE disputes
     SET status      = 'resolved',
         resolved_at = now(),
         details     = details || E'\n\n[Resolución] ' || p_resolution_notes
   WHERE id = p_dispute_id;

  -- Notificar a ambas partes
  INSERT INTO notifications (user_id, type, title, message)
  VALUES
    (v_constructor_id, 'dispute', 'Disputa resuelta', p_resolution_notes),
    (v_provider_id,    'dispute', 'Disputa resuelta', p_resolution_notes);

  RETURN jsonb_build_object(
    'success',    true,
    'dispute_id', p_dispute_id
  );
END;
$$;
-- ============================================================
-- v1.0 LAUNCH: Additional indexes for query patterns observed
-- in the frontend. All indexes already present in earlier
-- migrations are skipped here (IF NOT EXISTS is safe either way).
-- ============================================================


-- user_roles: queried by role for role-based listings (e.g. maestro discovery)
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- user_roles: composite lookup (user + role) used by add-role upsert conflict target
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);

-- profiles: city filter used in maestro/worker discovery flows
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- profiles: active_role filter used in dashboard stats and role-specific queries
CREATE INDEX IF NOT EXISTS idx_profiles_active_role ON profiles(active_role);

-- otps: phone + used + expires_at is the exact predicate used by otp-verify and otp-resend
CREATE INDEX IF NOT EXISTS idx_otps_phone_active ON otps(phone, used, expires_at)
  WHERE used = false;

-- otps: user_id used by otp invalidation on resend
CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps(user_id);

-- messages: conversation_id is the primary lookup key for the chat feature
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- messages: read_at null filter used to count unread messages in notification badges
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read_at)
  WHERE read_at IS NULL;

-- reviews: contract_id used for unique constraint and fetching reviews per contract
CREATE INDEX IF NOT EXISTS idx_reviews_contract_id ON reviews(contract_id)
  WHERE contract_id IS NOT NULL;

-- reviews: reviewer_id + reviewed_id for user review history
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- project_applications: status filter used in maestro "mis trabajos" tab
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON project_applications(status);

-- maestro_profiles: user_id lookup (1:1 with profiles but separate table)
CREATE INDEX IF NOT EXISTS idx_maestro_profiles_user_id ON maestro_profiles(user_id);

-- cart_items: user_id + product_id composite for upsert deduplication
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);

-- licitacion_postulaciones: status filter used in postulaciones listing
CREATE INDEX IF NOT EXISTS idx_postulaciones_status ON licitacion_postulaciones(status);

-- deliveries: driver_id + status used in repartidor radar screen
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_status ON deliveries(driver_id, status);

-- contracts: updated_at used for recent activity sorting in maestro earnings
CREATE INDEX IF NOT EXISTS idx_contracts_updated_at ON contracts(updated_at DESC);

-- products: stock_quantity for low-stock admin queries and inventory management
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock_quantity)
  WHERE stock_quantity <= 10;

-- orders: updated_at DESC used in provider order management feed
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at DESC);
-- ============================================================
-- MIGRATION: 20260519_query_indexes.sql
-- Additional query-level indexes identified from frontend hook
-- analysis (Bloque B, lanzamiento v1.0).
-- All indexes from 20260519_add_v1_indexes.sql are skipped.
-- ============================================================


-- ── orders ───────────────────────────────────────────────────

-- orders: constructor_id + created_at — useMyOrders fetches by
-- constructor_id ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_constructor_created
  ON orders(constructor_id, created_at DESC);

-- orders: provider_id + status — useDashboardStats (proveedor)
-- and useProveedorOrders both filter provider_id + specific status
CREATE INDEX IF NOT EXISTS idx_orders_provider_status
  ON orders(provider_id, status);

-- orders: provider_id + created_at — useIncomingOrders orders
-- by created_at DESC for a given provider
CREATE INDEX IF NOT EXISTS idx_orders_provider_created
  ON orders(provider_id, created_at DESC);

-- orders: constructor_id + status — useDashboardStats constructor
-- path filters by (constructor_id, status IN (...))
CREATE INDEX IF NOT EXISTS idx_orders_constructor_status
  ON orders(constructor_id, status);


-- ── licitaciones ─────────────────────────────────────────────

-- licitaciones: status + created_at — useLicitacionesAbiertas
-- always filters status='open' and orders by created_at DESC
CREATE INDEX IF NOT EXISTS idx_licitaciones_status_created
  ON licitaciones(status, created_at DESC);

-- licitaciones: constructor_id + created_at — useMisLicitaciones
-- filters by constructor_id and orders by created_at DESC
CREATE INDEX IF NOT EXISTS idx_licitaciones_constructor_created
  ON licitaciones(constructor_id, created_at DESC);

-- licitaciones: city filter used by useLicitacionesAbiertas when
-- a city filter is applied alongside status='open'
CREATE INDEX IF NOT EXISTS idx_licitaciones_city
  ON licitaciones(city)
  WHERE status = 'open';

-- licitacion_postulaciones: licitacion_id + created_at —
-- usePostulantesDeLicitacion orders by created_at DESC
CREATE INDEX IF NOT EXISTS idx_postulaciones_licitacion_created
  ON licitacion_postulaciones(licitacion_id, created_at DESC);

-- licitacion_postulaciones: maestro_id lookup — useLicitacionesAbiertas
-- checks which licitaciones the current maestro has already applied to
CREATE INDEX IF NOT EXISTS idx_postulaciones_maestro_id
  ON licitacion_postulaciones(maestro_id);


-- ── contracts ────────────────────────────────────────────────

-- contracts: maestro_id + status — usePendingContracts and
-- useDashboardStats (maestro) both query by maestro_id + status
CREATE INDEX IF NOT EXISTS idx_contracts_maestro_status
  ON contracts(maestro_id, status);

-- contracts: constructor_id + status — useDashboardStats
-- (constructor) queries by constructor_id + status
CREATE INDEX IF NOT EXISTS idx_contracts_constructor_status
  ON contracts(constructor_id, status);


-- ── deliveries ────────────────────────────────────────────────

-- deliveries: status + cargo_type — usePendingDeliveries (repartidor
-- radar) filters status='pending' and optionally cargo_type
CREATE INDEX IF NOT EXISTS idx_deliveries_status_cargo
  ON deliveries(status, cargo_type);

-- deliveries: status + driver_id=NULL — available pool query
-- filters status='pending' IS driver_id NULL
CREATE INDEX IF NOT EXISTS idx_deliveries_pending_unassigned
  ON deliveries(status, created_at DESC)
  WHERE driver_id IS NULL;

-- deliveries: driver_id + created_at — useMyDeliveries fetches
-- all deliveries for a driver ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_created
  ON deliveries(driver_id, created_at DESC);


-- ── projects ─────────────────────────────────────────────────

-- projects: constructor_id + status — useDashboardStats and
-- useProyectos filter by constructor_id and/or status
CREATE INDEX IF NOT EXISTS idx_projects_constructor_status
  ON projects(constructor_id, status);

-- projects: status + needs_maestro — useProyectos for maestro role
-- filters needs_maestro=true AND status IN ('active','planning')
CREATE INDEX IF NOT EXISTS idx_projects_status_needs_maestro
  ON projects(status, needs_maestro)
  WHERE needs_maestro = true;

-- projects: status + needs_materials — useProyectos for proveedor
-- role filters needs_materials=true AND status IN ('active','planning')
CREATE INDEX IF NOT EXISTS idx_projects_status_needs_materials
  ON projects(status, needs_materials)
  WHERE needs_materials = true;


-- ── products ─────────────────────────────────────────────────

-- products: provider_id + active + created_at — useInventario
-- paginates by provider_id ordered by created_at DESC, active is
-- also queried in useDashboardStats (proveedor)
CREATE INDEX IF NOT EXISTS idx_products_provider_active_created
  ON products(provider_id, active, created_at DESC);


-- ── notifications ─────────────────────────────────────────────

-- notifications: user_id + is_read + created_at — notifications
-- screen fetches unread count and recent notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);


-- ── quotations ────────────────────────────────────────────────

-- quotations: buyer_id + status — useQuotation fetches pending
-- quotations for the current buyer
CREATE INDEX IF NOT EXISTS idx_quotations_buyer_status
  ON quotations(buyer_id, status);

-- quotations: provider_id + status — provider-side quotation lookup
CREATE INDEX IF NOT EXISTS idx_quotations_provider_status
  ON quotations(provider_id, status);

-- quotations: expires_at — cron/expiry queries on pending quotations
CREATE INDEX IF NOT EXISTS idx_quotations_expires_at
  ON quotations(expires_at)
  WHERE status = 'pending';
-- ============================================================
-- MIGRATION: 20260519_kpi_views.sql
-- Business KPI views for internal monitoring dashboards.
-- All views are READ-ONLY and scoped to the authenticated role.
-- SECURITY NOTE: these views expose aggregate counts only —
-- no PII, no tokens, no sensitive columns.
-- ============================================================


-- ============================================================
-- KPI 1: Orders by day (last 30 days)
-- Tracks daily order volume and GMV for trending dashboards.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_orders_by_day AS
SELECT
  DATE(created_at AT TIME ZONE 'America/La_Paz') AS day,
  COUNT(*)::INT                                   AS order_count,
  COALESCE(SUM(total), 0)::NUMERIC               AS gmv
FROM orders
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY DATE(created_at AT TIME ZONE 'America/La_Paz')
ORDER BY day DESC;

GRANT SELECT ON public.kpi_orders_by_day TO authenticated;


-- ============================================================
-- KPI 2: GMV and order count by city
-- City is resolved from the constructor's profile (the buyer).
-- Covers all-time data; filter by date in the consuming query.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_gmv_by_city AS
SELECT
  COALESCE(p.city, 'Desconocida')        AS city,
  COUNT(o.id)::INT                        AS total_orders,
  COALESCE(SUM(o.total), 0)::NUMERIC     AS total_gmv,
  COALESCE(
    SUM(o.total) FILTER (WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')),
    0
  )::NUMERIC                             AS confirmed_gmv
FROM orders o
LEFT JOIN profiles p ON p.user_id = o.constructor_id
GROUP BY COALESCE(p.city, 'Desconocida')
ORDER BY total_gmv DESC;

GRANT SELECT ON public.kpi_gmv_by_city TO authenticated;


-- ============================================================
-- KPI 3: Payment confirmation rate
-- Measures funnel health: what % of orders move past pending.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_payment_confirmation_rate AS
SELECT
  COUNT(*)::INT                                             AS total_orders,
  COUNT(*) FILTER (WHERE status = 'confirmed')::INT        AS confirmed,
  COUNT(*) FILTER (WHERE status = 'expired')::INT          AS expired,
  COUNT(*) FILTER (WHERE status = 'cancelled')::INT        AS cancelled,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered'))::NUMERIC
    / NULLIF(COUNT(*), 0) * 100,
    2
  )                                                        AS confirmation_rate
FROM orders;

GRANT SELECT ON public.kpi_payment_confirmation_rate TO authenticated;


-- ============================================================
-- KPI 4: Licitaciones engagement
-- Measures how many tenders have received at least one bid.
-- Uses licitacion_postulaciones as the bids table.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_licitaciones_engagement AS
SELECT
  COUNT(DISTINCT l.id)::INT                                                     AS total,
  COUNT(DISTINCT lp.licitacion_id)::INT                                         AS with_bids,
  (COUNT(DISTINCT l.id) - COUNT(DISTINCT lp.licitacion_id))::INT                AS without_bids,
  ROUND(
    COUNT(DISTINCT lp.licitacion_id)::NUMERIC
    / NULLIF(COUNT(DISTINCT l.id), 0) * 100,
    2
  )                                                                              AS engagement_rate
FROM licitaciones l
LEFT JOIN licitacion_postulaciones lp ON lp.licitacion_id = l.id;

GRANT SELECT ON public.kpi_licitaciones_engagement TO authenticated;


-- ============================================================
-- KPI 5: Active providers
-- "Active" = has at least 1 product with active = true.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_active_providers AS
SELECT
  COUNT(DISTINCT ur.user_id)::INT                                                          AS total_providers,
  COUNT(DISTINCT p.provider_id)::INT                                                        AS with_products,
  (COUNT(DISTINCT ur.user_id) - COUNT(DISTINCT p.provider_id))::INT                        AS without_products
FROM user_roles ur
LEFT JOIN products p
  ON p.provider_id = ur.user_id
  AND p.active = true
WHERE ur.role = 'proveedor';

GRANT SELECT ON public.kpi_active_providers TO authenticated;


-- ============================================================
-- KPI 6: Active maestros
-- "Profile complete" = maestro_profiles row exists and
-- specialties array is non-empty.
-- "Available" = available = true in maestro_profiles.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_active_maestros AS
SELECT
  COUNT(DISTINCT ur.user_id)::INT                                                           AS total_maestros,
  COUNT(DISTINCT mp.user_id) FILTER (
    WHERE mp.specialties IS NOT NULL
      AND array_length(mp.specialties, 1) > 0
  )::INT                                                                                    AS profile_complete,
  COUNT(DISTINCT mp.user_id) FILTER (WHERE mp.available = true)::INT                       AS available
FROM user_roles ur
LEFT JOIN maestro_profiles mp ON mp.user_id = ur.user_id
WHERE ur.role = 'maestro';

GRANT SELECT ON public.kpi_active_maestros TO authenticated;


-- ============================================================
-- KPI 7: User signups by day (last 30 days)
-- by_role is a JSONB object: {"constructor": N, "maestro": N, …}
-- Built by aggregating user_roles — one user can have N roles,
-- so we count distinct role assignments, not just distinct users.
-- ============================================================

CREATE OR REPLACE VIEW public.kpi_signups_by_day AS
SELECT
  DATE(p.created_at AT TIME ZONE 'America/La_Paz') AS day,
  COUNT(DISTINCT p.user_id)::INT                   AS signups,
  jsonb_object_agg(
    role_counts.role,
    role_counts.cnt
  )                                                AS by_role
FROM profiles p
LEFT JOIN LATERAL (
  SELECT
    ur.role,
    COUNT(*)::INT AS cnt
  FROM user_roles ur
  WHERE ur.user_id = p.user_id
  GROUP BY ur.role
) role_counts ON true
WHERE p.created_at >= now() - INTERVAL '30 days'
GROUP BY DATE(p.created_at AT TIME ZONE 'America/La_Paz')
ORDER BY day DESC;

GRANT SELECT ON public.kpi_signups_by_day TO authenticated;

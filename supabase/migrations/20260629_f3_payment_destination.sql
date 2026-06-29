-- F3: Pago en destino — esquema, custodia QR, y RPCs seguros.
-- Principios: monto server-set, token de un solo uso, idempotencia por transaction_id,
-- RLS estricto, bitácora inmutable de cambios de QR.

-- ─── 1. Columnas en deliveries ──────────────────────────────────────────────────
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS payment_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS collect_amount   numeric;

-- ─── 2. Custodia QR: hash + timestamp en user_roles ────────────────────────────
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS payment_qr_hash       text,
  ADD COLUMN IF NOT EXISTS payment_qr_updated_at timestamptz;

-- ─── 3. Bitácora inmutable de cambios de datos de cobro ─────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_method_audit (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  field      text        NOT NULL,   -- 'payment_qr_url' | 'payment_bank_transfer' | 'payment_cash'
  old_hash   text,
  new_hash   text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Append-only: nobody deletes or updates audit rows.
ALTER TABLE public.payment_method_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can read own audit" ON public.payment_method_audit
  FOR SELECT USING (owner_id = auth.uid());
-- No INSERT/UPDATE/DELETE policies for authenticated users — only SECURITY DEFINER writes.

-- ─── 4. Trigger: log payment_qr_url changes into audit ─────────────────────────
CREATE OR REPLACE FUNCTION public.log_payment_method_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.payment_qr_url IS DISTINCT FROM NEW.payment_qr_url THEN
    INSERT INTO public.payment_method_audit (owner_id, field, old_hash, new_hash)
    VALUES (
      NEW.user_id,
      'payment_qr_url',
      OLD.payment_qr_hash,
      NEW.payment_qr_hash
    );
  END IF;
  IF OLD.payment_bank_transfer IS DISTINCT FROM NEW.payment_bank_transfer THEN
    INSERT INTO public.payment_method_audit (owner_id, field, old_hash, new_hash)
    VALUES (
      NEW.user_id,
      'payment_bank_transfer',
      md5(coalesce(OLD.payment_bank_transfer, '')),
      md5(coalesce(NEW.payment_bank_transfer, ''))
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_payment_method_change ON public.user_roles;
CREATE TRIGGER trg_log_payment_method_change
  AFTER UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_method_change();

-- ─── 5. Tabla payment_transactions ─────────────────────────────────────────────
-- id = client-generated UUID (idempotency key). Client creates UUID before calling
-- start_delivery_payment so retries after network failure are safe.
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id            uuid        PRIMARY KEY,
  order_id      uuid        NOT NULL REFERENCES public.orders(id)     ON DELETE CASCADE,
  delivery_id   uuid                 REFERENCES public.deliveries(id) ON DELETE SET NULL,
  method        text        NOT NULL CHECK (method IN ('qr', 'transfer', 'cash')),
  amount        numeric     NOT NULL CHECK (amount > 0),  -- server-set, never client
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'success', 'awaiting_validation', 'recorded', 'failed')),
  confirm_token text        NOT NULL,  -- one-time, server-generated
  token_used    boolean     NOT NULL DEFAULT false,
  evidence_url  text,
  created_by    uuid        NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  settled_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_order       ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_delivery    ON public.payment_transactions(delivery_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_created_by  ON public.payment_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status      ON public.payment_transactions(status);

-- RLS: driver, provider, constructor can read their own transactions.
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver reads own transactions" ON public.payment_transactions
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Provider reads transactions for their orders" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.id = order_id AND o.provider_id = auth.uid()
    )
  );

CREATE POLICY "Constructor reads own order transactions" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.id = order_id AND o.constructor_id = auth.uid()
    )
  );

-- All writes go through SECURITY DEFINER RPCs — no direct INSERT/UPDATE allowed.

-- ─── 6. RPC: start_delivery_payment ────────────────────────────────────────────
-- Client generates p_transaction_id (uuid) before calling — enables idempotent retries.
-- Returns: { transaction_id, amount, confirm_token, order_id }
CREATE OR REPLACE FUNCTION public.start_delivery_payment(
  p_transaction_id uuid,
  p_delivery_id    uuid,
  p_method         text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_driver_id   uuid;
  v_order_id    uuid;
  v_amount      numeric;
  v_token       text;
  v_existing    public.payment_transactions%ROWTYPE;
BEGIN
  -- Validate method
  IF p_method NOT IN ('qr', 'transfer', 'cash') THEN
    RAISE EXCEPTION 'Método de pago inválido: %', p_method;
  END IF;

  -- Verify caller is the assigned driver for this delivery
  SELECT driver_id, order_id
    INTO v_driver_id, v_order_id
    FROM public.deliveries
   WHERE id = p_delivery_id;

  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Entrega no asignada';
  END IF;
  IF v_driver_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No autorizado: solo el chofer asignado puede iniciar el cobro';
  END IF;

  -- Server-set amount from the order (client never dictates the amount)
  SELECT total INTO v_amount FROM public.orders WHERE id = v_order_id;

  -- Idempotency: if transaction already exists, return existing data
  SELECT * INTO v_existing FROM public.payment_transactions WHERE id = p_transaction_id;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'transaction_id', v_existing.id,
      'amount',         v_existing.amount,
      'confirm_token',  v_existing.confirm_token,
      'order_id',       v_existing.order_id
    );
  END IF;

  -- Generate one-time confirm token
  v_token := gen_random_uuid()::text;

  INSERT INTO public.payment_transactions
    (id, order_id, delivery_id, method, amount, status, confirm_token, created_by)
  VALUES
    (p_transaction_id, v_order_id, p_delivery_id, p_method, v_amount, 'pending', v_token, auth.uid());

  RETURN jsonb_build_object(
    'transaction_id', p_transaction_id,
    'amount',         v_amount,
    'confirm_token',  v_token,
    'order_id',       v_order_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_delivery_payment(uuid, uuid, text) TO authenticated;

-- ─── 7. RPC: settle_delivery_payment ───────────────────────────────────────────
-- Validates token, settles transaction, idempotent if already settled.
-- Returns: { ok, status }
CREATE OR REPLACE FUNCTION public.settle_delivery_payment(
  p_transaction_id uuid,
  p_confirm_token  text,
  p_evidence_url   text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx    public.payment_transactions%ROWTYPE;
  v_new_status text;
BEGIN
  SELECT * INTO v_tx FROM public.payment_transactions WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transacción no encontrada';
  END IF;

  -- AuthZ: only the driver who started the transaction can settle it
  IF v_tx.created_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Idempotency: already settled → return current state without error
  IF v_tx.status IN ('success', 'recorded', 'awaiting_validation') THEN
    RETURN jsonb_build_object('ok', true, 'status', v_tx.status, 'idempotent', true);
  END IF;

  -- Validate one-time token
  IF v_tx.token_used THEN
    RAISE EXCEPTION 'Token ya utilizado';
  END IF;
  IF v_tx.confirm_token IS DISTINCT FROM p_confirm_token THEN
    RAISE EXCEPTION 'Token inválido';
  END IF;

  -- Determine new status by method
  v_new_status := CASE v_tx.method
    WHEN 'qr'       THEN 'success'
    WHEN 'cash'     THEN 'recorded'
    WHEN 'transfer' THEN 'awaiting_validation'
    ELSE 'failed'
  END;

  UPDATE public.payment_transactions
     SET status       = v_new_status,
         token_used   = true,
         evidence_url = COALESCE(p_evidence_url, evidence_url),
         settled_at   = now()
   WHERE id = p_transaction_id;

  RETURN jsonb_build_object('ok', true, 'status', v_new_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_delivery_payment(uuid, text, text) TO authenticated;

-- ─── 8. RPC: store_qr_hash (called after uploadQr to persist hash) ─────────────
-- Client computes SHA-256 of file content and passes it here to bind the hash to the row.
CREATE OR REPLACE FUNCTION public.store_qr_hash(
  p_hash text,
  p_role text DEFAULT 'proveedor'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  UPDATE public.user_roles
     SET payment_qr_hash       = p_hash,
         payment_qr_updated_at = now()
   WHERE user_id = auth.uid()
     AND role    = p_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.store_qr_hash(text, text) TO authenticated;

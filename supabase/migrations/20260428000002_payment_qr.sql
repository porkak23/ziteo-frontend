-- Columna en user_roles para guardar la URL del QR de cobro del proveedor
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS payment_qr_url TEXT;

-- Storage bucket privado para QR de pagos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-qrs',
  'payment-qrs',
  false,  -- privado: nunca accesible por URL pública
  524288, -- 512 KB máximo
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "provider_upload_own_qr"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-qrs'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "provider_update_own_qr"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-qrs'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "provider_delete_own_qr"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-qrs'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- RLS en storage: buyer puede leer el QR SOLO si tiene un pedido activo con ese proveedor
CREATE POLICY "buyer_read_qr_with_active_order"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-qrs'
  AND (
    -- El propio proveedor puede ver su QR
    split_part(name, '/', 1) = auth.uid()::text
    OR
    -- Constructor con pedido pending/confirmed con este proveedor
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.buyer_id = auth.uid()
        AND o.provider_id::text = split_part(name, '/', 1)
        AND o.status IN ('pending', 'confirmed')
    )
  )
);

-- Columna para confirmar pago recibido en orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES profiles(user_id);

-- =============================================================================
-- SCRIPT SURGICAL DE CONFIGURACIÓN DE STORAGE BUCKETS Y POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================================================
-- Instrucciones: Copia todo este código SQL y pégalo directamente en la consola
-- de Supabase (SQL Editor -> New Query -> Run) para crear todos los buckets 
-- necesarios y sus políticas de seguridad correspondientes.

-- -----------------------------------------------------------------------------
-- 1. ADAPTACIONES EN LA BASE DE DATOS
-- -----------------------------------------------------------------------------
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS payment_qr_url TEXT;

-- -----------------------------------------------------------------------------
-- 2. CREACIÓN DE STORAGE BUCKETS (PÚBLICOS Y PRIVADOS)
-- -----------------------------------------------------------------------------

-- Bucket Privado: QR de Pago para Proveedores (5 MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-qrs',
  'payment-qrs',
  false, -- privado
  5242880, -- 5 MB (antes 512KB) para evitar rechazos de capturas grandes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET file_size_limit = 5242880, 
    public = false, 
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Bucket Privado: Comprobantes de Pago / Evidencia (10 MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false, -- privado
  10485760, -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET file_size_limit = 10485760, 
    public = false, 
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Bucket Público: Avatares de Perfil (5 MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- público
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 5242880, public = true;

-- Bucket Público: Fotos de Proyectos (5 MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-photos',
  'project-photos',
  true, -- público
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 5242880, public = true;

-- Bucket Público: Fotos de Productos (5 MB max)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- público
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 5242880, public = true;


-- -----------------------------------------------------------------------------
-- 3. ELIMINAR POLÍTICAS ANTIGUAS (Para evitar duplicados en caso de re-ejecución)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "provider_upload_own_qr" ON storage.objects;
DROP POLICY IF EXISTS "provider_update_own_qr" ON storage.objects;
DROP POLICY IF EXISTS "provider_delete_own_qr" ON storage.objects;
DROP POLICY IF EXISTS "buyer_read_qr_with_active_order" ON storage.objects;

DROP POLICY IF EXISTS "constructor_upload_proof" ON storage.objects;
DROP POLICY IF EXISTS "parties_read_proof" ON storage.objects;

DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
DROP POLICY IF EXISTS "user_modify_own_avatar" ON storage.objects;

DROP POLICY IF EXISTS "public_read_project_photos" ON storage.objects;
DROP POLICY IF EXISTS "user_modify_own_project_photo" ON storage.objects;

DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
DROP POLICY IF EXISTS "user_modify_own_product_image" ON storage.objects;


-- -----------------------------------------------------------------------------
-- 4. POLÍTICAS DE SEGURIDAD (RLS) PARA QR DE PAGO (payment-qrs)
-- -----------------------------------------------------------------------------

-- Permitir subir el QR propio a la carpeta con su user_id
CREATE POLICY "provider_upload_own_qr"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-qrs'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Permitir actualizar su propio QR
CREATE POLICY "provider_update_own_qr"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-qrs'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Permitir borrar su propio QR
CREATE POLICY "provider_delete_own_qr"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-qrs'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Permitir leer el QR (el dueño siempre, y el comprador si tiene un pedido activo)
CREATE POLICY "buyer_read_qr_with_active_order"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-qrs'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.constructor_id = auth.uid()
        AND o.provider_id::text = split_part(name, '/', 1)
    )
  )
);


-- -----------------------------------------------------------------------------
-- 5. POLÍTICAS PARA COMPROBANTES DE PAGO (payment-proofs)
-- -----------------------------------------------------------------------------

-- Constructor puede subir su comprobante
CREATE POLICY "constructor_upload_proof"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Constructor (creador) y Proveedor (dueño del pedido) pueden ver el comprobante
CREATE POLICY "parties_read_proof"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    split_part(name, '/', 1) = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.provider_id = auth.uid()
        AND o.constructor_id::text = split_part(name, '/', 1)
    )
  )
);


-- -----------------------------------------------------------------------------
-- 6. POLÍTICAS PARA BUCKETS PÚBLICOS (avatars, project-photos, product-images)
-- -----------------------------------------------------------------------------

-- Lectura pública para cualquier usuario
CREATE POLICY "public_read_avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "public_read_project_photos" ON storage.objects FOR SELECT USING (bucket_id = 'project-photos');
CREATE POLICY "public_read_product_images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

-- Modificación (Insert/Update/Delete) solo para el dueño de la carpeta
CREATE POLICY "user_modify_own_avatar"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "user_modify_own_project_photo"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'project-photos'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "user_modify_own_product_image"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'product-images'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-images'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- =============================================================================
-- ¡SCRIPT COMPLETADO CON ÉXITO!
-- =============================================================================

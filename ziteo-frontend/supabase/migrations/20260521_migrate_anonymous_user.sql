-- =============================================================
-- Migración: Función para migrar perfiles anónimos a beta determinista
-- =============================================================

CREATE OR REPLACE FUNCTION migrate_anonymous_profile(
  p_old_uid UUID,
  p_new_uid UUID,
  p_phone   TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_phone TEXT;
  v_new_email TEXT;
BEGIN
  -- 1. Control de seguridad: el llamador debe ser el nuevo usuario autenticado
  IF auth.uid() != p_new_uid THEN
    RAISE EXCEPTION 'Unauthorized: Caller must be the new user';
  END IF;

  -- 2. Normalizar el teléfono para comprobar formato
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

  -- 3. Control de seguridad: el correo del nuevo usuario debe coincidir con el teléfono
  SELECT email INTO v_new_email FROM auth.users WHERE id = p_new_uid;
  IF v_new_email IS NULL OR v_new_email != v_clean_phone || '@ziteo.beta' THEN
    RAISE EXCEPTION 'Unauthorized: Email does not match phone number';
  END IF;

  -- 4. Verificar que el perfil antiguo exista y tenga ese mismo teléfono
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = p_old_uid AND phone = p_phone) THEN
    RAISE EXCEPTION 'Invalid parameters: profile does not match phone';
  END IF;

  -- 5. Migrar todas las referencias en las tablas relacionales al nuevo user_id
  
  -- user_roles
  UPDATE user_roles SET user_id = p_new_uid WHERE user_id = p_old_uid;
  
  -- orders
  UPDATE orders SET constructor_id = p_new_uid WHERE constructor_id = p_old_uid;
  UPDATE orders SET provider_id = p_new_uid WHERE provider_id = p_old_uid;
  UPDATE orders SET payment_confirmed_by = p_new_uid WHERE payment_confirmed_by = p_old_uid;
  
  -- quotations
  UPDATE quotations SET buyer_id = p_new_uid WHERE buyer_id = p_old_uid;
  UPDATE quotations SET provider_id = p_new_uid WHERE provider_id = p_old_uid;
  
  -- messages
  UPDATE messages SET sender_id = p_new_uid WHERE sender_id = p_old_uid;
  UPDATE messages SET receiver_id = p_new_uid WHERE receiver_id = p_old_uid;
  
  -- projects
  UPDATE projects SET constructor_id = p_new_uid WHERE constructor_id = p_old_uid;
  
  -- project_shares
  UPDATE project_shares SET shared_by_id = p_new_uid WHERE shared_by_id = p_old_uid;
  UPDATE project_shares SET shared_with_id = p_new_uid WHERE shared_with_id = p_old_uid;
  
  -- project_applications
  UPDATE project_applications SET applicant_id = p_new_uid WHERE applicant_id = p_old_uid;
  
  -- contract_bids
  UPDATE contract_bids SET maestro_id = p_new_uid WHERE maestro_id = p_old_uid;
  
  -- contracts
  UPDATE contracts SET constructor_id = p_new_uid WHERE constructor_id = p_old_uid;
  UPDATE contracts SET maestro_id = p_new_uid WHERE maestro_id = p_old_uid;
  
  -- maestro_profiles
  UPDATE maestro_profiles SET user_id = p_new_uid WHERE user_id = p_old_uid;
  
  -- notifications
  UPDATE notifications SET user_id = p_new_uid WHERE user_id = p_old_uid;
  
  -- cart_items
  UPDATE cart_items SET user_id = p_new_uid WHERE user_id = p_old_uid;
  
  -- ratings
  BEGIN
    UPDATE ratings SET reviewer_id = p_new_uid WHERE reviewer_id = p_old_uid;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorar si la tabla no existe en el esquema actual
  END;

  -- 6. Finalmente actualizar el perfil principal
  UPDATE profiles SET user_id = p_new_uid WHERE user_id = p_old_uid;
END;
$$;

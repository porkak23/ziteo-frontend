-- Migration to add Maestro Payment Methods and RLS DELETE policies.
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS payment_cash BOOLEAN DEFAULT false;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS payment_bank_transfer TEXT;

-- RLS DELETE policies to allow users to remove/deactivate their own roles and profiles
DROP POLICY IF EXISTS "user_roles_delete_own" ON user_roles;
CREATE POLICY "user_roles_delete_own"
  ON user_roles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "maestro_profiles_delete_own" ON maestro_profiles;
CREATE POLICY "maestro_profiles_delete_own"
  ON maestro_profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

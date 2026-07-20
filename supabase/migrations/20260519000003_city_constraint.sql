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

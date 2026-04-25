-- ============================================================
-- Fase 1: RLS en TODAS las tablas
-- ============================================================

-- 1. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (user_id = auth.uid());

-- 2. USER_ROLES
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_roles_insert_own" ON user_roles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_roles_update_own" ON user_roles FOR UPDATE USING (user_id = auth.uid());

-- 3. PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_all" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_own" ON products FOR INSERT WITH CHECK (provider_id = auth.uid());
CREATE POLICY "products_update_own" ON products FOR UPDATE USING (provider_id = auth.uid());
CREATE POLICY "products_delete_own" ON products FOR DELETE USING (provider_id = auth.uid());

-- 4. ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_involved" ON orders FOR SELECT USING (constructor_id = auth.uid() OR provider_id = auth.uid());
CREATE POLICY "orders_insert_constructor" ON orders FOR INSERT WITH CHECK (constructor_id = auth.uid());
CREATE POLICY "orders_update_involved" ON orders FOR UPDATE USING (constructor_id = auth.uid() OR provider_id = auth.uid());

-- 5. ORDER_ITEMS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_select_via_order" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.constructor_id = auth.uid() OR orders.provider_id = auth.uid())));
CREATE POLICY "order_items_insert_via_order" ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.constructor_id = auth.uid()));

-- 6. PROJECTS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select_all" ON projects FOR SELECT USING (true);
CREATE POLICY "projects_insert_own" ON projects FOR INSERT WITH CHECK (constructor_id = auth.uid());
CREATE POLICY "projects_update_own" ON projects FOR UPDATE USING (constructor_id = auth.uid());
CREATE POLICY "projects_delete_own" ON projects FOR DELETE USING (constructor_id = auth.uid());

-- 7. CONTRACTS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_select_involved" ON contracts FOR SELECT USING (constructor_id = auth.uid() OR maestro_id = auth.uid());
CREATE POLICY "contracts_insert_constructor" ON contracts FOR INSERT WITH CHECK (constructor_id = auth.uid());
CREATE POLICY "contracts_update_involved" ON contracts FOR UPDATE USING (constructor_id = auth.uid() OR maestro_id = auth.uid());

-- 8. LICITACIONES
ALTER TABLE licitaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "licitaciones_select_all" ON licitaciones FOR SELECT USING (true);
CREATE POLICY "licitaciones_insert_own" ON licitaciones FOR INSERT WITH CHECK (constructor_id = auth.uid());
CREATE POLICY "licitaciones_update_own" ON licitaciones FOR UPDATE USING (constructor_id = auth.uid());

-- 9. LICITACION_POSTULACIONES
ALTER TABLE licitacion_postulaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "postulaciones_select_involved" ON licitacion_postulaciones FOR SELECT
  USING (maestro_id = auth.uid() OR EXISTS (SELECT 1 FROM licitaciones WHERE licitaciones.id = licitacion_postulaciones.licitacion_id AND licitaciones.constructor_id = auth.uid()));
CREATE POLICY "postulaciones_insert_maestro" ON licitacion_postulaciones FOR INSERT WITH CHECK (maestro_id = auth.uid());

-- 10. PROJECT_APPLICATIONS
ALTER TABLE project_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_select_involved" ON project_applications FOR SELECT
  USING (applicant_id = auth.uid() OR EXISTS (SELECT 1 FROM projects WHERE projects.id = project_applications.project_id AND projects.constructor_id = auth.uid()));
CREATE POLICY "applications_insert_own" ON project_applications FOR INSERT WITH CHECK (applicant_id = auth.uid());

-- 11. MAESTRO_HABILIDADES
ALTER TABLE maestro_habilidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habilidades_select_all" ON maestro_habilidades FOR SELECT USING (true);
CREATE POLICY "habilidades_insert_own" ON maestro_habilidades FOR INSERT WITH CHECK (maestro_id = auth.uid());
CREATE POLICY "habilidades_update_own" ON maestro_habilidades FOR UPDATE USING (maestro_id = auth.uid());
CREATE POLICY "habilidades_delete_own" ON maestro_habilidades FOR DELETE USING (maestro_id = auth.uid());

-- 12. CART_ITEMS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_select_own" ON cart_items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "cart_insert_own" ON cart_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "cart_update_own" ON cart_items FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "cart_delete_own" ON cart_items FOR DELETE USING (user_id = auth.uid());

-- 13. MAESTRO_PROFILES
ALTER TABLE maestro_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maestro_profiles_select_all" ON maestro_profiles FOR SELECT USING (true);
CREATE POLICY "maestro_profiles_insert_own" ON maestro_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "maestro_profiles_update_own" ON maestro_profiles FOR UPDATE USING (user_id = auth.uid());

-- 14. RATINGS
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_select_all" ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert_own" ON ratings FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- 15. NOTIFICATIONS
-- (ya tiene RLS, pero por si acaso verificamos)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_select_own') THEN
    CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_insert_any') THEN
    CREATE POLICY "notifications_insert_any" ON notifications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_update_own') THEN
    CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

-- 16. OTPs (solo service_role, sin policies = bloqueado para anon/authenticated)
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Fase 3: Triggers de transición de estado
-- ============================================================

-- Orders: pending → processing → shipped → delivered (+ cancelled desde cualquiera excepto terminales)
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status = 'cancelled' AND OLD.status NOT IN ('delivered', 'cancelled') THEN RETURN NEW; END IF;
  IF OLD.status = 'pending' AND NEW.status = 'processing' THEN RETURN NEW; END IF;
  IF OLD.status = 'processing' AND NEW.status = 'shipped' THEN RETURN NEW; END IF;
  IF OLD.status = 'shipped' AND NEW.status = 'delivered' THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Transición de estado inválida: % → %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION validate_order_status_transition();

-- Contracts: pending → accepted | rejected (terminal)
CREATE OR REPLACE FUNCTION validate_contract_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Transición de estado inválida: % → %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contract_status
  BEFORE UPDATE OF status ON contracts
  FOR EACH ROW EXECUTE FUNCTION validate_contract_status_transition();

-- Licitaciones: open → closed (no reabrir)
CREATE OR REPLACE FUNCTION validate_licitacion_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF OLD.status = 'open' AND NEW.status = 'closed' THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Transición de estado inválida: % → %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_licitacion_status
  BEFORE UPDATE OF status ON licitaciones
  FOR EACH ROW EXECUTE FUNCTION validate_licitacion_status_transition();


-- ============================================================
-- Fase 4: Índices de performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_constructor_id ON orders(constructor_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_provider_id ON products(provider_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_contracts_constructor_id ON contracts(constructor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_maestro_id ON contracts(maestro_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_licitaciones_constructor_id ON licitaciones(constructor_id);
CREATE INDEX IF NOT EXISTS idx_licitaciones_status ON licitaciones(status);
CREATE INDEX IF NOT EXISTS idx_licitaciones_city ON licitaciones(city);
CREATE INDEX IF NOT EXISTS idx_postulaciones_licitacion_id ON licitacion_postulaciones(licitacion_id);
CREATE INDEX IF NOT EXISTS idx_postulaciones_maestro_id ON licitacion_postulaciones(maestro_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON project_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_applicant_id ON project_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_projects_constructor_id ON projects(constructor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_city ON projects(city);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_maestro_habilidades_maestro_id ON maestro_habilidades(maestro_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

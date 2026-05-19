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

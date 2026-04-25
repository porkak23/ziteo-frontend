# 🗄️ ZITEO Database Schema Completo

**Version:** 1.0 MVP  
**Database:** PostgreSQL 15+ (Supabase)  
**Owner:** Claude Code (Antigravity orchestration)

---

## 📌 Principios

- **RLS (Row-Level Security):** Activado en todas las tablas
- **Timestamps:** `created_at` (default now()), `updated_at` (trigger auto-update)
- **Soft deletes:** Donde aplique (products, projects, etc.)
- **Indexes:** En foreign keys + búsquedas frecuentes
- **Constraints:** NOT NULL en campos críticos, UNIQUE donde sea necesario

---

## 🔑 Tablas Principales

### 1. **profiles** — Información base del usuario (multi-rol)

> **Modelo multi-rol:** Un usuario puede tener varios roles en la misma cuenta (Constructor, Proveedor, Maestro). `active_role` indica el rol activo en la sesión actual. Los roles habilitados se almacenan en la tabla `user_roles`. El usuario cambia de rol desde su avatar.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos básicos (compartidos entre todos los roles)
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  
  -- Rol activo en la sesión actual (el usuario lo cambia desde su avatar)
  active_role VARCHAR(50) NOT NULL CHECK (active_role IN ('constructor', 'proveedor', 'maestro', 'chofer')),
  
  -- Perfil
  avatar_url TEXT,
  bio TEXT,
  
  -- Auth
  pin_hash VARCHAR(255) NOT NULL, -- Hashed PIN de 5 dígitos
  preferred_auth_method VARCHAR(50) DEFAULT 'pin' CHECK (preferred_auth_method IN ('pin', 'biometric')),
  -- Google/Apple SSO es [POST-MVP]
  
  -- 2FA (post-MVP, solo pagos)
  totp_secret TEXT, -- TOTP secret (encriptado en app)
  totp_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_city CHECK (city != '')
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_active_role ON profiles(active_role);
```

**RLS:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuarios ven solo su propio perfil
CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Usuarios actualizan solo su propio perfil
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Anon lee perfiles públicos (Maestros, Proveedores)
CREATE POLICY "Public read for maestros proveedores" ON profiles
  FOR SELECT USING (
    active_role IN ('maestro', 'proveedor') AND auth.role() = 'anon'
  );
```

---

### 1b. **user_roles** — Roles habilitados por cuenta

> Una cuenta puede activar múltiples roles. Cada rol se registra aquí al momento de habilitarlo. Cuando el usuario quiere usar un nuevo rol por primera vez, completa el onboarding de ese rol (campos específicos) y se inserta un registro aquí.

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('constructor', 'proveedor', 'maestro', 'chofer')),
  
  -- Campos específicos del rol (nullable, solo aplica al rol correspondiente)
  -- Constructor
  company_name VARCHAR(200),
  
  -- Proveedor
  store_name VARCHAR(200),
  store_description TEXT,
  store_logo_url TEXT,
  
  -- Maestro
  specialty VARCHAR(100),        -- plomero, electricista, albañil, etc.
  years_experience INT,
  hourly_rate NUMERIC(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  
  -- Chofer [POST-MVP]
  vehicle_type VARCHAR(100),
  vehicle_plate VARCHAR(20),
  
  -- Estado del rol
  is_verified BOOLEAN DEFAULT FALSE,  -- verificado por ZITEO
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

**RLS:**
```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Usuarios ven sus propios roles
CREATE POLICY "Users view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Usuarios insertan sus propios roles (habilitar un nuevo rol)
CREATE POLICY "Users insert own roles" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios actualizan sus propios roles
CREATE POLICY "Users update own roles" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id);

-- Público puede ver datos de maestros (para contratar)
CREATE POLICY "Public read maestro roles" ON user_roles
  FOR SELECT USING (role = 'maestro' AND onboarding_completed = TRUE);

-- Público puede ver datos de proveedores (para tienda)
CREATE POLICY "Public read proveedor roles" ON user_roles
  FOR SELECT USING (role = 'proveedor' AND onboarding_completed = TRUE);
```

**Función: cambio de rol activo**
```sql
-- Llamar al cambiar de rol desde el avatar
CREATE OR REPLACE FUNCTION switch_active_role(new_role VARCHAR(50))
RETURNS VOID AS $$
BEGIN
  -- Verificar que el usuario tiene ese rol habilitado
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = new_role AND onboarding_completed = TRUE
  ) THEN
    RAISE EXCEPTION 'Role % not enabled for this user', new_role;
  END IF;

  -- Actualizar rol activo
  UPDATE profiles SET active_role = new_role WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 2. **categories** — Categorías de productos

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon_name VARCHAR(50) NOT NULL, -- Material Symbol name (e.g., 'build', 'tools', 'person')
  description TEXT,
  order_index INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_name CHECK (name != '')
);

INSERT INTO categories (name, icon_name, description, order_index) VALUES
  ('Herramientas', 'hammer', 'Herramientas manuales y eléctricas', 1),
  ('Materiales', 'inventory_2', 'Materiales de construcción', 2),
  ('Maestros', 'person', 'Mano de obra especializada', 3),
  ('Equipos', 'build', 'Equipos y máquinas', 4);

CREATE INDEX idx_categories_active ON categories(active);
```

---

### 3. **products** — Catálogo de productos (Proveedor)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Datos del producto
  category_id UUID NOT NULL REFERENCES categories(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Precios y stock
  price_unit DECIMAL(10, 2) NOT NULL CHECK (price_unit > 0),
  unit_type VARCHAR(50) NOT NULL DEFAULT 'unidad', -- 'unidad', 'metro', 'kg', 'litro', etc.
  stock_quantity INT NOT NULL DEFAULT 0,
  
  -- Imágenes (Supabase Storage)
  image_url TEXT,
  image_bucket VARCHAR(100) DEFAULT 'products',
  
  -- Specs (JSON para flexibilidad)
  specs JSONB, -- { "color": "rojo", "largo": "2m", "marca": "XYZ" }
  
  -- Estado
  active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_price CHECK (price_unit > 0),
  CONSTRAINT valid_name CHECK (name != '')
);

CREATE INDEX idx_products_provider_id ON products(provider_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('spanish', name));

-- Trigger para updated_at
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**RLS:**
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Proveedor ve sus propios productos
CREATE POLICY "Providers view own products" ON products
  FOR SELECT USING (auth.uid() = provider_id);

-- Constructores ven solo productos activos (no borrados)
CREATE POLICY "Constructors view active products" ON products
  FOR SELECT USING (is_deleted = FALSE AND active = TRUE);

-- Solo el Proveedor puede crear/actualizar sus productos
CREATE POLICY "Providers manage own products" ON products
  FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Providers delete own products" ON products
  FOR DELETE USING (auth.uid() = provider_id);
```

---

### 4. **projects** — Proyectos del Constructor

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constructor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Datos
  name VARCHAR(200) NOT NULL,
  description TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  
  -- Presupuesto y estado
  estimated_budget DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'paused')),
  
  -- Foto del proyecto (Supabase Storage)
  photo_url TEXT,
  
  -- Timestamps
  start_date DATE,
  estimated_end_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_name CHECK (name != ''),
  CONSTRAINT valid_budget CHECK (estimated_budget IS NULL OR estimated_budget > 0)
);

CREATE INDEX idx_projects_constructor_id ON projects(constructor_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_location ON projects(location_lat, location_lng);
```

**RLS:**
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Constructor ve solo sus proyectos
CREATE POLICY "Constructors view own projects" ON projects
  FOR SELECT USING (auth.uid() = constructor_id);

-- Constructor maneja sus proyectos
CREATE POLICY "Constructors manage own projects" ON projects
  FOR ALL USING (auth.uid() = constructor_id);

-- [FUTURE] Compartir proyectos - se define en project_shares
```

---

### 5. **project_materials** — Materiales agregados a proyecto

```sql
CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Cantidad
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_type VARCHAR(50) NOT NULL, -- Hereda de product.unit_type
  
  -- Notas
  notes TEXT,
  
  -- Timestamps
  added_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_project_materials_project_id ON project_materials(project_id);
CREATE INDEX idx_project_materials_product_id ON project_materials(product_id);
```

**RLS:**
```sql
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;

-- Constructor ve solo sus materiales
CREATE POLICY "View project materials" ON project_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_id AND constructor_id = auth.uid()
    )
  );

-- Constructor maneja sus materiales
CREATE POLICY "Manage project materials" ON project_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_id AND constructor_id = auth.uid()
    )
  );
```

---

### 6. **cart_items** — Carrito persistente

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  quantity INT NOT NULL CHECK (quantity > 0),
  
  added_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE UNIQUE INDEX idx_cart_items_user_product ON cart_items(user_id, product_id);
```

**RLS:**
```sql
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Users ven solo su carrito
CREATE POLICY "View own cart" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

-- Users manejan solo su carrito
CREATE POLICY "Manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);
```

---

### 7. **orders** — Órdenes (Constructor → Proveedor)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constructor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Datos de la orden
  total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  
  -- Fechas
  order_date TIMESTAMP DEFAULT now(),
  due_date DATE,
  delivered_date DATE,
  
  -- Notas
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_total CHECK (total >= 0)
);

CREATE INDEX idx_orders_constructor_id ON orders(constructor_id);
CREATE INDEX idx_orders_provider_id ON orders(provider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_project_id ON orders(project_id);
```

**RLS:**
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Constructor ve sus órdenes
CREATE POLICY "Constructors view their orders" ON orders
  FOR SELECT USING (auth.uid() = constructor_id);

-- Proveedor ve sus órdenes
CREATE POLICY "Providers view their orders" ON orders
  FOR SELECT USING (auth.uid() = provider_id);

-- Solo Proveedor actualiza estado
CREATE POLICY "Providers update order status" ON orders
  FOR UPDATE USING (auth.uid() = provider_id);
```

---

### 8. **order_items** — Items de la orden

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  
  quantity INT NOT NULL CHECK (quantity > 0),
  price_unit DECIMAL(10, 2) NOT NULL CHECK (price_unit > 0),
  
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

**RLS:**
```sql
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Igual al padre (orders)
CREATE POLICY "View order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE id = order_id 
      AND (constructor_id = auth.uid() OR provider_id = auth.uid())
    )
  );
```

---

### 9. **maestro_profiles** — Información de Maestros (Mano de Obra)

```sql
CREATE TABLE maestro_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Especialidades (JSON array)
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g., ['electricista', 'carpintero', 'plomero']
  
  -- Tarificación
  rate_type VARCHAR(50) DEFAULT 'per_day' CHECK (rate_type IN ('per_day', 'per_hour', 'per_project')),
  rate_amount DECIMAL(10, 2) NOT NULL CHECK (rate_amount > 0),
  
  -- Disponibilidad
  available BOOLEAN DEFAULT TRUE,
  max_concurrent_projects INT DEFAULT 3,
  
  -- Perfil
  experience_years INT DEFAULT 0,
  portfolio_url TEXT, -- Link a fotos de trabajos
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_maestro_profiles_user_id ON maestro_profiles(user_id);
CREATE INDEX idx_maestro_profiles_available ON maestro_profiles(available);
CREATE INDEX idx_maestro_profiles_specialties ON maestro_profiles USING gin(specialties);
```

**RLS:**
```sql
ALTER TABLE maestro_profiles ENABLE ROW LEVEL SECURITY;

-- Maestro ve su perfil
CREATE POLICY "Maestros view own profile" ON maestro_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Constructores ven perfiles públicos de maestros
CREATE POLICY "Constructors view public maestro profiles" ON maestro_profiles
  FOR SELECT USING (available = TRUE);

-- Maestro actualiza su perfil
CREATE POLICY "Maestros update own profile" ON maestro_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

---

### 10. **contracts** — Contratos / Licitaciones

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maestro_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  constructor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  
  -- Tipo
  type VARCHAR(50) DEFAULT 'direct_hire' CHECK (type IN ('direct_hire', 'bidding')),
  
  -- Detalles
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scope JSONB, -- { tasks: [], requirements: [], timeline: "" }
  
  -- Precio (inicial o propuesto)
  initial_amount DECIMAL(10, 2),
  
  -- Estado
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'counter_offered', 'active', 'completed')),
  
  -- Fechas
  contract_date TIMESTAMP DEFAULT now(),
  start_date DATE,
  estimated_end_date DATE,
  actual_end_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_title CHECK (title != '')
);

CREATE INDEX idx_contracts_maestro_id ON contracts(maestro_id);
CREATE INDEX idx_contracts_constructor_id ON contracts(constructor_id);
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_status ON contracts(status);
```

**RLS:**
```sql
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Maestro ve sus contratos
CREATE POLICY "Maestros view own contracts" ON contracts
  FOR SELECT USING (auth.uid() = maestro_id);

-- Constructor ve sus contratos
CREATE POLICY "Constructors view own contracts" ON contracts
  FOR SELECT USING (auth.uid() = constructor_id);

-- Maestro actualiza estado
CREATE POLICY "Maestros update contract status" ON contracts
  FOR UPDATE USING (auth.uid() = maestro_id);
```

---



---

### 11. **contract_bids** — Contra-ofertas (Post-MVP)

```sql
CREATE TABLE contract_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  maestro_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  
  -- Propuesta
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_contract_bids_contract_id ON contract_bids(contract_id);
CREATE INDEX idx_contract_bids_maestro_id ON contract_bids(maestro_id);
```

**RLS:**
```sql
ALTER TABLE contract_bids ENABLE ROW LEVEL SECURITY;

-- Maestro ve sus bids
CREATE POLICY "Maestros view own bids" ON contract_bids
  FOR SELECT USING (auth.uid() = maestro_id);

-- Constructor ve bids en sus contratos
CREATE POLICY "Constructors view bids on contracts" ON contract_bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contracts WHERE id = contract_id AND constructor_id = auth.uid()
    )
  );

-- Maestro actualiza sus bids
CREATE POLICY "Maestros update own bids" ON contract_bids
  FOR UPDATE USING (auth.uid() = maestro_id);
```

---

### 12. **notifications** — Sistema de notificaciones

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Tipo de notificación
  type VARCHAR(50) NOT NULL CHECK (type IN ('order', 'contract', 'message', 'system')),
  
  -- Contenido
  title VARCHAR(200) NOT NULL,
  message TEXT,
  
  -- Referencia
  related_entity_type VARCHAR(50), -- 'order', 'contract', 'project', etc.
  related_entity_id UUID,
  
  -- Estado
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

**RLS:**
```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users ven solo sus notificaciones
CREATE POLICY "View own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users marcan como leído
CREATE POLICY "Update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

---

### 13. **project_shares** — Compartir proyectos (Feature Flag)

```sql
CREATE TABLE project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  shared_by_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  shared_with_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE RESTRICT,
  
  -- Nivel de acceso
  access_level VARCHAR(50) DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
  
  -- Mensajes
  message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP, -- Share link expiration (optional)
  
  CONSTRAINT no_self_share CHECK (shared_by_id != shared_with_id)
);

CREATE INDEX idx_project_shares_project_id ON project_shares(project_id);
CREATE INDEX idx_project_shares_shared_with_id ON project_shares(shared_with_id);
```

**RLS:**
```sql
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- Constructor ve shares de sus proyectos
CREATE POLICY "View shares of own projects" ON project_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_id AND constructor_id = auth.uid()
    )
  );

-- Usuario ve shares en sus proyectos
CREATE POLICY "View shared projects" ON project_shares
  FOR SELECT USING (auth.uid() = shared_with_id OR 
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND constructor_id = auth.uid()));

-- Constructor crea shares
CREATE POLICY "Create shares on own projects" ON project_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_id AND constructor_id = auth.uid()
    )
  );
```

---

### 14. **ratings** — Calificaciones entre usuarios

> Permite calificar maestros post-contrato y proveedores post-orden. Un reviewer no puede calificar dos veces la misma entidad.

```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  related_entity_type VARCHAR(50) NOT NULL CHECK (related_entity_type IN ('order', 'contract')),
  related_entity_id UUID NOT NULL,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(reviewer_id, related_entity_id)
);

CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX idx_ratings_entity ON ratings(related_entity_id);
RLS:


ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer ratings
CREATE POLICY "Anyone reads ratings" ON ratings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Solo el reviewer puede insertar su rating
CREATE POLICY "Reviewer inserts own rating" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
Función para promedio:


CREATE OR REPLACE FUNCTION get_user_rating(target_user_id UUID)
RETURNS TABLE(avg_score NUMERIC, total_ratings BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(score)::NUMERIC, 1) as avg_score,
    COUNT(*)::BIGINT as total_ratings
  FROM ratings
  WHERE rated_user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## 🔧 Funciones y Triggers

### 1. Función para actualizar `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Aplicar a todas las tablas con `updated_at`:**
```sql
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... etc para todas las tablas
```

### 2. Función para marcar notificación como leída

```sql
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, read_at = now() 
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Índices Avanzados

```sql
-- Búsqueda de productos por nombre/descripción
CREATE INDEX idx_products_search ON products 
  USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- Búsqueda de proyectos por nombre
CREATE INDEX idx_projects_search ON projects 
  USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- Búsqueda de maestros por especialidades
CREATE INDEX idx_maestro_specialties ON maestro_profiles 
  USING gin(specialties);

-- Órdenes por fecha
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Notificaciones por usuario + fecha
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
```

---

## 🔐 Seguridad Adicional

### Encriptación de datos sensibles

```sql
-- Instalar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PIN se guarda hasheado (bcrypt en app antes de enviar)
-- TOTP secret se encripta (en aplicación, no en DB)
```

### Auditoría

```sql
-- [FUTURE] Crear tabla de auditoría
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  table_name VARCHAR(100),
  action VARCHAR(50), -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT now()
);
```

---

## 📝 Inicialización de datos (seed)

```sql
-- Categories (ya en ejemplo arriba)

-- Demo profiles (opcional, quitar en prod)
INSERT INTO profiles (user_id, phone, name, city, role, pin_hash) VALUES
  (gen_random_uuid(), '+591-123-4567', 'Juan Constructor', 'La Paz', 'constructor', crypt('12345', gen_salt('bf'))),
  (gen_random_uuid(), '+591-234-5678', 'Carlos Proveedor', 'Cochabamba', 'proveedor', crypt('54321', gen_salt('bf')));
```

---

## 🔒 Matriz de Permisos por Rol

Define qué acciones puede realizar cada rol en el MVP. Esta tabla es la fuente de verdad para las RLS policies.

> **Multi-rol:** Los permisos se evalúan contra `profiles.active_role` (el rol activo en sesión). Un mismo usuario puede tener múltiples roles habilitados en `user_roles` y cambiar entre ellos desde su avatar. Las RLS policies usan `active_role` para determinar el acceso.

| Acción | Constructor | Proveedor | Maestro |
|--------|:-----------:|:---------:|:-------:|
| Ver productos en tienda | ✅ | ❌ | ✅ |
| Agregar al carrito | ✅ | ❌ | ✅ |
| Hacer checkout (crear orden) | ✅ | ❌ | ✅ |
| Crear/vender productos | ❌ | ✅ | ❌ |
| Ver panel de pedidos (proveedor) | ❌ | ✅ | ❌ |
| Actualizar estado de orden | ❌ | ✅ | ❌ |
| Crear proyectos | ✅ | ❌ | ❌ |
| Ver sus propios proyectos | ✅ | ❌ | ❌ |
| Buscar maestros disponibles | ✅ | ❌ | ❌ |
| Crear contrato (contratar maestro) | ✅ | ❌ | ❌ |
| Ver contratos recibidos | ❌ | ❌ | ✅ |
| Aceptar/rechazar contratos | ❌ | ❌ | ✅ |
| Ver perfil público de maestros | ✅ | ❌ | ❌ |
| Editar su propio perfil de maestro | ❌ | ❌ | ✅ |
| Calificar a un proveedor (post-orden) | ✅ | ❌ | ✅ |
| Calificar a un maestro (post-contrato) | ✅ | ❌ | ❌ |
| Recibir notificaciones | ✅ | ✅ | ✅ |

**Notas:**
- El Maestro puede comprar en la Tienda porque también puede necesitar materiales para sus trabajos
- El Proveedor NO contrata Maestros (post-MVP si hay demanda)
- Las RLS policies deben validar `role` del JWT en cada operación sensible

---

## ✅ Deployment Checklist

- [ ] Ejecutar DDL en Supabase production
- [ ] Habilitar RLS en todas las tablas
- [ ] Crear índices (performance test)
- [ ] Backup automático configurado
- [ ] Auditoría activada (post-MVP)
- [ ] Performance monitoring (pg_stat_statements)

---

**Esta es la fuente de verdad para la estructura de datos de ZITEO MVP.**

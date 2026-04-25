# 🚀 ZITEO MVP Sprint Execution Guide

**Propósito:** Detalle operacional para que Antigravity orqueste cada sprint sin ambigüedad.

**Dependencias externas:**
- `ZITEO_MAESTRO_ORQUESTACION.md` — Visión de 5 semanas
- `ZITEO_DATABASE_SCHEMA_COMPLETO.md` — DDL exacto
- `ZITEO_API_SPEC_COMPLETO.md` — Endpoints exactos

---

## 📅 Sprint 0: Setup (Semana 0 — Día 1-3)

**Objetivo:** Infraestructura lista, repos configurados, documentación sincronizada.

### Antigravity

- [ ] **Crear Supabase project**
  - [ ] Free tier (con upgrade path a Pro)
  - [ ] Configurar Authentication (Phone OTP + Google/Apple)
  - [ ] Storage buckets: `products`, `projects` (CORS enabled)
  - [ ] Documentar: DB URL, Anon Key, Service Role Key
  - [ ] Crear staging environment (opcional, pero recomendado)

- [ ] **GitHub setup**
  - [ ] Crear repo `ziteo-mvp` (privado)
  - [ ] Rama main + develop
  - [ ] `.env.example` con vars de Supabase
  - [ ] `.gitignore` (node_modules, .env, build/)
  - [ ] README con setup instructions

- [ ] **Documentación centralizada**
  - [ ] Copiar `ZITEO_MAESTRO_ORQUESTACION.md` a repo `/docs`
  - [ ] Copiar `ZITEO_DATABASE_SCHEMA_COMPLETO.md` a repo `/docs`
  - [ ] Copiar `ZITEO_API_SPEC_COMPLETO.md` a repo `/docs`
  - [ ] Copiar `ZITEO_DESIGN_MASTER.md` a repo `/docs`
  - [ ] Crear `/docs/INDEX.md` — entrada rápida a todos los docs

- [ ] **Equipo sync**
  - [ ] Sprint kick-off meeting (30 min)
  - [ ] Confirmar responsables por componente (Claude Code, Stitch, Antigravity)
  - [ ] Establecer daily sync (Slack thread o 15 min standup)
  - [ ] Crear issue template en GitHub para tareas

### Claude Code

- [ ] **Setup inicial**
  - [ ] Node.js project (npm init -y)
  - [ ] Instalar dependencias:
    ```
    npm install @supabase/supabase-js @supabase/auth-helpers-nextjs express cors dotenv
    npm install --save-dev tsx nodemon typescript @types/node
    ```
  - [ ] Crear estructura:
    ```
    /backend
      /src
        /routes
        /middleware
        /services
        /utils
      .env.example
      package.json
    ```
  - [ ] Supabase CLI setup (`supabase init`)

- [ ] **Crear migrations folder**
  - [ ] `/supabase/migrations/001_initial.sql`
  - [ ] Copiar DDL de `ZITEO_DATABASE_SCHEMA_COMPLETO.md`
  - [ ] Test en Supabase staging

### Stitch

- [ ] **Design files ready**
  - [ ] Acceso a Figma (file ID: `4D25Fz61d1JrsfsNWf1Ydo`)
  - [ ] Verificar componentes: botones, inputs, cards, bottom nav
  - [ ] Exportar color tokens → repo `/design/tokens.json`
  - [ ] Documentar breakpoints: mobile (320px), tablet (768px)

### Validación Antigravity

- [ ] **Checklist completitud**
  - [ ] Supabase proyecto funcional (login de test OK)
  - [ ] GitHub repo con estructura
  - [ ] Todos los docs en `/docs`
  - [ ] Team alineado en dailies

---

## 📅 Sprint 1: Onboarding + Tienda Base (Semana 1-2)

**Objetivo:** Constructor puede registrarse, ver tienda, agregar al carrito.

**Dependencias:** Sprint 0 ✅

### Claude Code — Backend

#### Task 1.1: Migraciones DB + RLS

- [ ] Deploy migration `001_initial.sql` a Supabase prod
- [ ] Test RLS:
  ```sql
  -- Como anon user, SELECT desde products (no profile)
  -- Como auth user, SELECT su propio profile
  ```
- [ ] Crear indexes en:
  - [ ] `products(active, category_id)`
  - [ ] `profiles(user_id, phone)`
  - [ ] `cart_items(user_id)`
- [ ] Documentar: Supabase DDL version en `/docs/DB_VERSION.md`

#### Task 1.2: Auth endpoints

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Autenticación

Crear endpoints en `/src/routes/auth.ts`:

- [ ] **POST /api/auth/register**
  - Validar: phone (formato), name, city, pin (5 dígitos), role
  - Crear Supabase Auth user (phone OTP)
  - Crear profile row
  - Retornar JWT + refresh token
  - Error handling: 409 (phone exists), 422 (validation)

- [ ] **POST /api/auth/login**
  - Validar phone + pin contra profile.pin_hash (bcrypt)
  - Retornar JWT + refresh token
  - Error handling: 401 (invalid pin)

- [ ] **POST /api/auth/refresh**
  - Validar refresh token
  - Retornar nuevo access token
  - Error handling: 401 (invalid token)

- [ ] **POST /api/auth/logout**
  - Invalidar refresh token en DB
  - Error handling: 401 (not authenticated)

**Testing:**
- [ ] Postman: register → login → ver token JWT
- [ ] Verificar RLS: profile de otro user retorna 403

#### Task 1.3: Tienda endpoints (GET only)

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Tienda

- [ ] **GET /api/tienda/productos**
  - Query params: search, category, min_price, max_price, sort, limit, offset
  - Full-text search en `name || description` (Spanish)
  - RLS: solo `active=true` y `is_deleted=false`
  - Agregar `provider` info (name, city)
  - Retornar facets (categorías, price range)

- [ ] **GET /api/tienda/productos/:id**
  - RLS: solo productos activos
  - Incluir provider rating (post-MVP placeholder: 4.8)
  - Incluir specs (JSON)

**Testing:**
- [ ] GET /tienda/productos?search=cemento (retorna 0 items, no hay seed data aún)
- [ ] Usar Supabase seed para agregar 5 productos de test
- [ ] Verificar búsqueda y filtros funcionan

#### Task 1.4: Carrito endpoints (persistente)

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Carrito

- [ ] **GET /api/cart**
  - RLS: solo carrito del usuario autenticado
  - Incluir producto details (name, price, image)
  - Incluir totales (items count, total amount)

- [ ] **POST /api/cart/items**
  - Validar product_id existe
  - Validar quantity > 0 y <= stock
  - Upsert en cart_items (si existe, actualizar quantity)
  - Retornar item + total actualizado
  - Error handling: 404 (product), 400 (insufficient stock)

- [ ] **PATCH /api/cart/items/:id**
  - Validar quantity > 0 y <= stock
  - Actualizar cart_item
  - Retornar item actualizado

- [ ] **DELETE /api/cart/items/:id**
  - Eliminar item
  - Retornar 200 OK

- [ ] **POST /api/cart/checkout**
  - Validar carrito no vacío
  - Crear order(s) — si hay items de múltiples providers, crear múltiples orders
  - Crear order_items
  - Vaciar carrito (delete cart_items)
  - Retornar órdenes creadas
  - Error handling: 400 (empty cart), 409 (product no longer available)

**Testing:**
- [ ] Agregar 3 productos al carrito
- [ ] Actualizar cantidad
- [ ] Eliminar 1 item
- [ ] Checkout → crear órdenes

### Stitch — Frontend Screens

**Referencia:** `ZITEO_DESIGN_MASTER.md` → Components locked

Generar screens:

- [ ] **Splash screen**
  - Geometric pattern (ZITEO brown #A43700)
  - Tagline: "La plataforma que construye Bolivia"
  - Animated loading bar (themed: orange → amber)
  - 3 segundos luego → Welcome

- [ ] **Welcome screen**
  - Background: foto de trabajador Boliviano
  - 2 CTA: "Soy Constructor" | "Soy Proveedor/Maestro"
  - Link: "¿Ya tengo cuenta?" → Login

- [ ] **Login screen**
  - Input: phone (+591-XXXXXXXX masked)
  - Input: PIN (5 dígitos, masked)
  - CTA: "Ingresar"
  - Links: "¿Olvidé mi PIN?" | "Crear cuenta"
  - Biometric option (si disponible en device)

- [ ] **Registration Step 1: Teléfono**
  - Input: phone
  - CTA: "Enviar código"
  - Verificar OTP (Twilio)

- [ ] **Registration Step 2: Datos**
  - Input: name
  - Dropdown: city (hardcoded: La Paz, Cochabamba, Santa Cruz, etc.)
  - Input: PIN (5 dígitos, confirmation)
  - CTA: "Siguiente"

- [ ] **Registration Step 3: Rol**
  - Radio buttons: Constructor | Proveedor | Maestro
  - Descripción de cada rol
  - CTA: "Crear cuenta"

- [ ] **Constructor Home (Tienda)**
  - Header: "ZITEO" logo + Cart icon (badge con count)
  - Bottom nav: TIENDA (highlight) · PROYECTOS (center circle) · CONTRATAR
  - Carruseles verticales:
    - [ ] Carrusel publicitario (3 banners)
    - [ ] Proyectos activos (grid 2 columnas)
    - [ ] Switch comprar/alquilar (hidden ahora, prepara para futuro)
    - [ ] 4 category carousels (Herramientas, Materiales, Equipos, Maestros) — cada uno con "Ver más"
    - [ ] Carrusel ofertas especiales
    - [ ] Maestros destacados (grid)
    - [ ] Ferreterías cercanas (grid)
  - Scroll vertical infinito
  - Pull-to-refresh (opcional MVP)

- [ ] **Producto detalle**
  - Hero: Imagen grande
  - Info: Nombre, precio, stock status
  - Specs: JSON renderizado como tabla
  - Provider: Card con nombre, ciudad, rating, botón ver más productos
  - Cantidad selector: [−] [input] [+]
  - CTA primaria: "Agregar al carrito"
  - CTA secundaria: "Ver similar"
  - Share button (prepara arquitectura, desactivado MVP)

- [ ] **Carrito modal/pantalla**
  - Listar items (scrollable)
  - Cada item: foto, nombre, precio × cantidad, subtotal
  - [−] [cantidad] [+]
  - Botón eliminar (X)
  - Totales: items count, total amount
  - CTA: "Proceder al checkout"
  - Link: "Continuar comprando"

**Testing:**
- [ ] Flujo completo: Splash → Welcome → Login → Tienda → Producto → Agregar carrito → Ver carrito
- [ ] Búsqueda + filtros en tienda
- [ ] Carrito persiste (refresh página)

### Validación Antigravity

- [ ] **Integration test**
  - [ ] Frontend consume endpoints reales
  - [ ] RLS: otro usuario no puede ver carrito ajeno (401/403)
  - [ ] Carrito persiste después de logout/login
  - [ ] Imágenes de productos cargan correctamente
  - [ ] Performance: tienda carga en <2s (4G simulado)

- [ ] **Metrics**
  - [ ] Auth endpoints: <100ms
  - [ ] Tienda búsqueda: <200ms
  - [ ] Carrito operaciones: <150ms

---

## 📅 Sprint 2: Proyectos + Integración (Semana 2-3)

**Objetivo:** Constructor crea proyectos, agrega materiales, carrito → proyectos.

**Dependencias:** Sprint 1 ✅

### Claude Code — Backend

#### Task 2.1: Proyectos endpoints

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Proyectos

- [ ] **POST /api/proyectos**
  - Validar: name, city o (lat+lng)
  - Guardar foto en Supabase Storage (bucket: `projects`)
  - Crear project row
  - Retornar project con photo_url
  - Error handling: 422 (missing fields), 413 (image too large)

- [ ] **GET /api/proyectos**
  - RLS: solo proyectos del usuario autenticado
  - Filtrar por status (query param)
  - Incluir materials_count
  - Paginación: limit, offset

- [ ] **GET /api/proyectos/:id**
  - RLS: solo si es propietario
  - Retornar detalles completos

- [ ] **PATCH /api/proyectos/:id**
  - RLS: solo si es propietario
  - Actualizar: name, description, status, budget, dates
  - Retornar proyecto actualizado

- [ ] **DELETE /api/proyectos/:id**
  - RLS: solo si es propietario
  - Validar: no hay órdenes asociadas (constraint)
  - Soft delete (marcar is_deleted=true en futuro)

**Testing:**
- [ ] Crear proyecto
- [ ] Listar mis proyectos
- [ ] Editar proyecto
- [ ] Eliminar proyecto
- [ ] RLS: otro usuario no puede ver mis proyectos (401/403)

#### Task 2.2: Materiales endpoints

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Materiales

- [ ] **POST /api/proyectos/:id/materiales**
  - Validar: product_id existe, quantity > 0
  - RLS: proyecto pertenece al usuario
  - Crear project_material row
  - Retornar material con producto info

- [ ] **GET /api/proyectos/:id/materiales**
  - RLS: proyecto pertenece al usuario
  - Incluir product details (name, price, provider)
  - Calcular subtotal por material
  - Retornar totales

- [ ] **DELETE /api/proyectos/:id/materiales/:mat_id**
  - RLS: proyecto pertenece al usuario
  - Eliminar material

**Testing:**
- [ ] Crear proyecto
- [ ] Agregar 3 materiales
- [ ] Ver lista de materiales
- [ ] Eliminar 1 material
- [ ] RLS: otro usuario no puede ver materiales ajenos

#### Task 2.3: Carrito → Proyectos (mejora)

- [ ] **PATCH /api/cart/items/:id** — Agregar optional `project_id`
  - Si `project_id` provided, marcar item para ese proyecto (metadata en futuro)
  - Útil para después: "comprar para este proyecto"

### Stitch — Frontend Screens

- [ ] **PROYECTOS tab**
  - Header: "Mis Proyectos"
  - CTA primaria: "Nuevo proyecto"
  - Lista de proyectos (grid 1 columna, card style)
    - Foto (hero)
    - Nombre, ubicación, status (badge)
    - Budget, fechas
    - Click → Detalles

- [ ] **Crear proyecto screen**
  - Input: nombre
  - Input: ubicación (texto o map picker)
  - Input: presupuesto estimado
  - Inputs: fechas (start, end)
  - Upload: foto
  - CTA: "Crear"
  - Validación client-side

- [ ] **Proyecto detalle screen**
  - Header: nombre, status (editable)
  - Información: ubicación, presupuesto, fechas
  - Tabs: Materiales | Órdenes | Contratos
  - **Materiales tab:**
    - [ ] Lista de materiales agregados
    - [ ] Cada item: foto, nombre, cantidad, precio, subtotal
    - [ ] Botón + para agregar más
    - [ ] Botón X para eliminar
    - [ ] Total de presupuesto usado
  - **Órdenes tab:** (visible pero vacío en Sprint 2)
  - **Contratos tab:** (visible pero vacío en Sprint 2)
  - CTA: "Editar proyecto" → modal
  - CTA: "Eliminar proyecto" → confirmación

- [ ] **Agregar material modal**
  - Iguales a tienda: búsqueda + filtros
  - Seleccionar producto
  - Quantity selector: [−] [input] [+]
  - CTA: "Agregar a proyecto"
  - Feedback: toast "Material agregado"

- [ ] **Integración PROYECTOS ↔ TIENDA**
  - Botón "Agregar a proyecto" en detalles de producto (desde tienda)
  - Proyectos dropdown: "Selecciona proyecto" → agrega a ese proyecto

**Testing:**
- [ ] Crear proyecto desde scratch
- [ ] Agregar 5 materiales desde tienda → proyecto
- [ ] Ver lista de materiales en proyecto
- [ ] Editar proyecto
- [ ] Eliminar material
- [ ] Flujo: Tienda → Producto → "Agregar a proyecto" → proyecto recibe material

### Validación Antigravity

- [ ] **End-to-end Constructor flow**
  - [ ] Splash → Welcome → Register → Tienda → Agregar producto al carrito
  - [ ] Tienda → Producto → "Agregar a proyecto" → Proyecto creado/actualizado
  - [ ] Proyectos → Ver materiales → Editar material cantidad → Eliminar

- [ ] **Performance**
  - [ ] Proyectos list: <200ms
  - [ ] Agregar material: <150ms
  - [ ] Proyecto detalle: <300ms

---

## 📅 Sprint 3: Proveedor Dashboard (Semana 3-4)

**Objetivo:** Proveedor crea productos, ve órdenes, gestiona estado.

**Dependencias:** Sprint 1 ✅ (Sprint 2 es paralelo, no bloqueador)

### Claude Code — Backend

#### Task 3.1: Proveedor productos endpoints

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Proveedor

- [ ] **POST /api/proveedor/productos**
  - RLS: solo usuario autenticado con role='proveedor'
  - Validar: name, price_unit > 0, category, stock_quantity
  - Guardar imagen en Storage (bucket: `products`)
  - Crear product row
  - Retornar producto con image_url

- [ ] **GET /api/proveedor/productos**
  - RLS: solo mis productos
  - Filtrar por active status
  - Incluir stock_status (good/warning/critical)
  - Paginación

- [ ] **PATCH /api/proveedor/productos/:id**
  - RLS: solo mi producto
  - Actualizar: name, price_unit, stock_quantity, active, specs
  - Retornar producto actualizado

- [ ] **DELETE /api/proveedor/productos/:id**
  - RLS: solo mi producto
  - Soft delete (is_deleted=true)

**Testing:**
- [ ] Crear 5 productos como proveedor
- [ ] Editar precio + stock
- [ ] RLS: Constructor no puede ver endpoint de crear (403)

#### Task 3.2: Proveedor órdenes endpoints

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Proveedor órdenes

- [ ] **GET /api/proveedor/ordenes**
  - RLS: solo órdenes donde soy provider_id
  - Filtrar por status
  - Incluir constructor info + project name
  - Stats: total pending, total confirmed
  - Paginación

- [ ] **GET /api/proveedor/ordenes/:id**
  - RLS: solo si soy provider
  - Detalles completos: items, constructor, project, notes

- [ ] **PATCH /api/proveedor/ordenes/:id/status**
  - RLS: solo si soy provider
  - Validar transiciones: pending → confirmed → shipped → delivered
  - Actualizar `updated_at`
  - Crear notificación para Constructor (INSERT notifications)

**Testing:**
- [ ] Constructor compra de Proveedor (Sprint 1 checkout)
- [ ] Proveedor ve orden en GET /ordenes
- [ ] Proveedor cambia status → notificación llega a Constructor

#### Task 3.3: Proveedor dashboard stats

- [ ] **GET /api/proveedor/dashboard**
  - RLS: solo yo
  - Stats: pending orders count, confirmed orders, total revenue (month), products active, low stock count
  - Recent orders (últimas 5)
  - Retornar todo en 1 query (optimizado)

**Testing:**
- [ ] Múltiples órdenes, calcular stats correctamente

### Stitch — Frontend Screens

- [ ] **Proveedor Home (Dashboard)**
  - Header: "ZITEO Proveedor"
  - Bottom nav: PEDIDOS · INVENTARIO (center) · INTEL
  - **Stats card:**
    - [ ] Órdenes pendientes (count + total $)
    - [ ] Órdenes confirmadas (count + total $)
    - [ ] Productos activos
    - [ ] Stock bajo (warning)
  - **Órdenes recientes:**
    - [ ] Grid: cada orden es card
    - [ ] Constructor name, total, status (badge color), fecha
    - [ ] Click → detalles

- [ ] **PEDIDOS tab**
  - Segmented control: Todas | Pendientes | Confirmadas | Entregadas
  - Lista de órdenes (scrollable)
  - Cada orden: constructor, items count, total, status (editable dropdown o botón)
  - Click → detalles + cambiar status

- [ ] **Orden detalle modal/screen**
  - Constructor info (name, phone, city)
  - Project name (si existe)
  - Items ordered:
    - [ ] Tabla: Producto | Cantidad | Precio unit | Subtotal
  - Total order
  - Status selector: Pending → Confirmed → Shipped → Delivered
  - Cada transición muestra timestamp
  - Notes field (editable)
  - CTA: "Guardar cambios"
  - Feedback: toast "Orden actualizada"

- [ ] **INVENTARIO tab**
  - Segmented control: Todos | Activos | Sin stock
  - Lista de productos
  - Cada producto: foto, nombre, categoria, precio, stock (editable inline), active toggle
  - Edit button → modal
  - Delete button → confirmación
  - CTA primaria: "Nuevo producto"

- [ ] **Crear/Editar producto modal**
  - Inputs: nombre, descripción, categoría (dropdown)
  - Inputs: precio, unidad (dropdown: bolsa, metro, kg, litro, etc.), stock
  - Specs: JSON editor o key-value pairs
  - Upload: imagen
  - Toggle: Activo/Inactivo
  - CTA: "Guardar" | "Cancelar"
  - Validación client-side

- [ ] **INTEL tab (placeholder MVP)**
  - Empty state: "Análisis de precios próximamente"
  - Texto: "Herramientas de inteligencia post-lanzamiento"

**Testing:**
- [ ] Proveedor login
- [ ] Ver dashboard stats
- [ ] Crear producto
- [ ] Editar producto (inline stock update)
- [ ] Ver órdenes
- [ ] Cambiar estado de orden
- [ ] Feedback visual: notificaciones, toasts

### Validación Antigravity

- [ ] **Full flow Proveedor**
  - [ ] Proveedor crea 3 productos
  - [ ] Constructor compra de esos 3 productos
  - [ ] Proveedor ve órdenes en PEDIDOS
  - [ ] Proveedor cambia status → Constructor notificado

- [ ] **Performance**
  - [ ] Productos list: <200ms
  - [ ] Órdenes list: <250ms
  - [ ] Dashboard stats: <300ms

---

## 📅 Sprint 4: Maestro + Pulido (Semana 4-5)

**Objetivo:** Maestro perfil + contratos, botones accept/reject, testing integral.

**Dependencias:** Sprint 1-3 ✅

### Claude Code — Backend

#### Task 4.1: Maestro profile endpoints

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Maestro

- [ ] **GET /api/maestro/perfil**
  - RLS: solo yo
  - Retornar: specialties (array), rate_type, rate_amount, experience, available, bio

- [ ] **PATCH /api/maestro/perfil**
  - RLS: solo yo
  - Actualizar: specialties, rate_type, rate_amount, available, bio, experience_years
  - Validar: rate_amount > 0

**Testing:**
- [ ] Crear perfil maestro
- [ ] Editar specialties
- [ ] RLS: otro usuario no puede editar mi perfil

#### Task 4.2: Contratos endpoints (MVP)

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Maestro contratos

- [ ] **GET /api/maestro/contratos**
  - RLS: solo mis contratos
  - Filtrar por status
  - Incluir constructor info, project name
  - Paginación

- [ ] **GET /api/maestro/contratos/:id**
  - RLS: solo si soy maestro
  - Detalles: scope (JSONB), dates, constructor, project, initial_amount
  - Include empty array para counter_bids (prepared for future)

- [ ] **PATCH /api/maestro/contratos/:id/status**
  - RLS: solo si soy maestro
  - MVP: status puede ser 'accepted' | 'rejected'
  - Validar: transición desde 'pending' únicamente
  - Crear notificación para Constructor
  - [ARQUITECTURA] Preparar para status='counter_offered' (post-MVP)

**Testing:**
- [ ] Constructor crea contrato
- [ ] Maestro ve contrato en GET /maestro/contratos
- [ ] Maestro acepta → Constructor notificado
- [ ] Maestro rechaza → Constructor notificado

#### Task 4.3: Buscar maestros endpoint

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Búsqueda maestros

- [ ] **GET /api/maestros**
  - Query params: specialty, city, rate_type, min_rate, max_rate, sort
  - RLS: solo maestros con available=true
  - Incluir rating (placeholder: 4.8)
  - Full-text search en specialties
  - Agregar facets (specialties + rate range)

**Testing:**
- [ ] Buscar maestros por especialidad
- [ ] Filtrar por rango de precio
- [ ] Verificar solo maestros disponibles

#### Task 4.4: Constructor contrata maestro

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Contratar maestro

- [ ] **POST /api/maestros/:id/contratos**
  - Validar: title, project_id, initial_amount > 0
  - Crear contract row (type='direct_hire', status='pending')
  - Crear notificación para Maestro
  - Retornar contract

**Testing:**
- [ ] Constructor busca maestros
- [ ] Constructor selecciona 1
- [ ] Constructor crea contrato
- [ ] Maestro recibe notificación

#### Task 4.5: Notificaciones completas

**Referencia:** `ZITEO_API_SPEC_COMPLETO.md` → Notificaciones

- [ ] **GET /api/notificaciones**
  - RLS: solo mis notificaciones
  - Filtrar por is_read
  - Incluir: title, message, related_entity_type, related_entity_id
  - Paginación

- [ ] **PATCH /api/notificaciones/:id/read**
  - Marcar como leído + set read_at

- [ ] **DELETE /api/notificaciones/:id**
  - Eliminar notificación

**Triggers de notificación:**
- [ ] Order creada → Proveedor
- [ ] Order status cambió → Constructor
- [ ] Contract creada → Maestro
- [ ] Contract status cambió → Constructor

**Testing:**
- [ ] Acciones disparan notificaciones
- [ ] Notificaciones persisten en DB
- [ ] Marcar como leído funciona

### Stitch — Frontend Screens

- [ ] **Constructor CONTRATAR tab**
  - Segmented control: Maestros | Contratos (o licitaciones, prep para futuro)
  - **Maestros section:**
    - [ ] Búsqueda + filtros:
      - [ ] Search box
      - [ ] Chips de especialidades (electricista, plomería, carpintería, etc.)
      - [ ] Slider: rango de precio
      - [ ] Dropdown: orden (rating, precio, etc.)
    - [ ] Grid de maestros:
      - [ ] Card: foto, nombre, especialidades (chips), rate, rating, botón "Contratar"
      - [ ] Click → maestro detalle + crear contrato
  - **Contratos section:**
    - [ ] Lista de mis contratos
    - [ ] Cada contrato: maestro name, proyecto, estado (badge)
    - [ ] Click → detalles + (si pending) ver estado

- [ ] **Buscar maestros screen**
  - Iguales a tienda pero para maestros
  - Cada card maestro: foto, nombre, especialidades, rate_type + amount, rating, reviews count
  - Click → detalles

- [ ] **Maestro detalle modal/screen**
  - Hero: foto
  - Info: nombre, especialidades (chips), ciudad, teléfono (opcional)
  - Tarifación: rate_type + amount
  - Experience: años
  - Bio: descripción
  - Portfolio: link (si existe)
  - Rating: stars + count
  - CTA: "Contratar"

- [ ] **Crear contrato modal**
  - Auto-populate: maestro name (read-only)
  - Dropdown: Proyecto (mis proyectos)
  - Input: Título del contrato
  - Textarea: Descripción/scope
  - Input: Precio inicial (sugerido: maestro.rate_amount)
  - Date pickers: start, end
  - CTA: "Enviar contrato"
  - Feedback: "Contrato enviado, maestro lo revisará"

- [ ] **Maestro home screen**
  - Header: "Mi perfil" | Editar
  - Card: photo, nombre, city, especialidades, rate, experience
  - Tabs: Perfil | Contratos | Calificaciones
  - **Perfil tab:**
    - [ ] Editable fields: foto, especialidades (multiselect chips), rate_type, rate_amount, bio, available toggle
    - [ ] CTA: "Guardar cambios"
  - **Contratos tab:**
    - [ ] Lista de contratos (pending, accepted, completed)
    - [ ] Cada contrato: constructor, proyecto, monto, estado
    - [ ] Click → detalles + acciones
  - **Calificaciones tab:**
    - [ ] Placeholder: "Sin calificaciones aún"

- [ ] **Contrato detalle screen (Maestro)**
  - Constructor info
  - Proyecto info
  - Scope (JSON rendered as formatted text)
  - Monto inicial
  - Fechas (start, end)
  - **Si status='pending':**
    - [ ] Botones: [Aceptar] [Rechazar]
    - [ ] Modal de confirmación antes de aceptar
    - [ ] [ARQUITECTURA] Botón "Hacer contra-oferta" (disabled, hidden para MVP)
  - **Si status='accepted':**
    - [ ] Mostrar: "Contrato aceptado"
    - [ ] Timeline de hitos (prep para futuro)
  - **Si status='rejected':**
    - [ ] Mostrar: "Contrato rechazado"

- [ ] **Notificaciones (global)**
  - Icon bell en header + badge count
  - Dropdown menu: últimas 5 notificaciones
  - Cada notificación: icon (order/contract/etc), title, timestamp, unread indicator
  - Click → ir a entidad relacionada
  - "Ver todas" link → full notifications page

- [ ] **Full notifications page**
  - Lista completa (scrollable)
  - Filtros: all / orders / contracts / messages
  - Cada notificación: title, message, timestamp, mark as read, delete
  - Empty state: "Sin notificaciones"

**Testing:**
- [ ] Constructor busca maestros
- [ ] Constructor crea contrato
- [ ] Maestro recibe notificación
- [ ] Maestro ve contrato
- [ ] Maestro acepta → Constructor notificado
- [ ] Notificaciones persisten

### Validación Antigravity

- [ ] **Full end-to-end flows**
  - [ ] **Flow Constructor:** Register → Tienda → Carrito → Proyectos → Contratar maestro → Ver notificaciones
  - [ ] **Flow Proveedor:** Register → Crear productos → Recibir orden → Cambiar estado
  - [ ] **Flow Maestro:** Register → Completar perfil → Recibir contrato → Aceptar/Rechazar

- [ ] **E2E testing (Playwright/Cypress)**
  - [ ] 10+ test cases cubriendo happy paths
  - [ ] Error cases: validation, permissions, edge cases
  - [ ] Performance benchmarks

- [ ] **Security audit**
  - [ ] RLS policies testadas
  - [ ] Auth tokens validados
  - [ ] XSS/CSRF protections en endpoints
  - [ ] No data leakage entre usuarios

- [ ] **Mobile testing**
  - [ ] iPhone 12 (375px)
  - [ ] Android Pixel 4 (412px)
  - [ ] Tablet (iPad, 768px)
  - [ ] Touch interactions smooth
  - [ ] Orientations (portrait/landscape) handled

### Documentación Final

- [ ] **Actualizar /docs**
  - [ ] `DEPLOYMENT_CHECKLIST.md` — pre-lanzamiento
  - [ ] `TROUBLESHOOTING.md` — issues conocidos + soluciones
  - [ ] `VERSIONING.md` — v1.0.0 MVP release notes

---

## ✅ Pre-Launch Checklist (Día 1 de Semana 6)

### Antigravity Final Validation

- [ ] **Funcionalidad 100% completa**
  - [ ] Todos los 3 flows funcionan end-to-end
  - [ ] No hay TODOs pendientes en código
  - [ ] Notificaciones se disparan correctamente

- [ ] **Performance**
  - [ ] Tienda búsqueda: <200ms
  - [ ] Carrito operaciones: <100ms
  - [ ] Órdenes list: <250ms
  - [ ] Mobile (4G): <2s load time

- [ ] **Security**
  - [ ] RLS policies 100% testeadas
  - [ ] Auth flows verified
  - [ ] No secrets en repo (git secrets check)
  - [ ] HTTPS en todos los endpoints

- [ ] **Testing**
  - [ ] 30+ unit tests
  - [ ] 15+ E2E tests
  - [ ] Coverage > 80%

- [ ] **Documentation**
  - [ ] README actualizado
  - [ ] API docs deployed (Swagger)
  - [ ] Troubleshooting guide
  - [ ] Deployment runbook

- [ ] **Infrastructure**
  - [ ] Supabase backups configured
  - [ ] Monitoring alerts setup (errors, performance)
  - [ ] Error tracking (Sentry) configured
  - [ ] Analytics (Mixpanel) tracked

- [ ] **Data**
  - [ ] Seed data created (5 providers, 50+ products, 3 maestros)
  - [ ] Test accounts ready (1 de cada rol)
  - [ ] Database size monitored

---

## 📊 Métricas de Éxito MVP

| Métrica | Meta | Criterio |
|---------|------|----------|
| **Tiempo** | <5 semanas | Fases 0-4 completadas |
| **Errores críticos** | 0 | En beta testing |
| **Performance** | <200ms (p95) | Endpoints principales |
| **Mobile load** | <2s | 4G simulado |
| **Test coverage** | >80% | Backend |
| **Registros** | 100+ | Primera semana post-launch |
| **Uptime** | >99% | Beta period |

---

## 🎯 Post-MVP (Backlog ordenado)

1. **Pagos** (Semana 6-7)
   - Stripe/MercadoPago integration
   - TOTP/2FA
   - Pruebas de transacciones

2. **Chat** (Semana 8)
   - Mensajería entre Constructor ↔ Proveedor
   - Notificaciones en tiempo real

3. **IA** (Semana 9+)
   - Análisis de precios
   - Recomendaciones
   - Búsqueda mejorada

4. **Contra-oferta Maestro** (Semana 10)
   - Lógica completa
   - UI modals

5. **Compartir proyectos** (Semana 8)
   - Feature flag activado
   - Colaboración básica

---

**Este es el playbook operacional. Antigravity lo sigue sprint a sprint.**

**Próximo paso:** Kick-off Sprint 0. 🚀

# 🏗️ ZITEO MVP — Documento Maestro de Orquestación

**Versión:** 1.0 MVP  
**Última actualización:** Abril 2026  
**Owner:** Fernando (Fundador, ZITEO Bolivia)  
**Orquestrador:** Antigravity (gestión de agentes)  
**Ejecutores:** Claude Code + Google Stitch  

---

## 📌 Decisiones Estratégicas Confirmadas

| Decisión | Valor | Notas |
|----------|-------|-------|
| **Design** | Locked (v1.3) | Componentes, colores, tipografía sin cambios |
| **Backend** | Supabase | BaaS completo: Auth, DB, Storage, Realtime |
| **Frontend** | React + Tailwind | Mobile-first, light mode only |
| **Auth MVP** | PIN + OTP (SMS) | TOTP/2FA solo en pagos (post-MVP) |
| **Carrito** | Persistente | Local + Supabase (sincronizado) |
| **Compartir proyectos** | Sí | Feature post-fase-1 o fase-2 |
| **Roles activos** | Constructor, Proveedor, Maestro | Chofer/Transportista: post-MVP |
| **Chat/Mensajería** | Post-MVP | Base preparada en schema |
| **Pagos** | Post-MVP | Decision: Stripe vs MercadoPago (pending) |
| **IA** | Post-lanzamiento | Sin IA en MVP. Estructura preparada para luego. |
| **Cloud migration** | Post-lanzamiento | Supabase ahora, Cloud después |

---

## 🎯 Visión del MVP en 3 fases

```
FASE 1: Constructor MVP (2-3 semanas)
├─ Onboarding completo (auth, registro)
├─ Tienda: Búsqueda, filtros, carrito persistente
├─ Proyectos: CRUD básico (crear, editar, eliminar)
├─ Agregar materiales a proyecto (sin carrito avanzado)
└─ Integración Supabase (auth + DB)

FASE 2: Proveedor + Maestro (2-3 semanas)
├─ Proveedor Dashboard: CRUD de productos (sin IA)
├─ Proveedor: Gestión de órdenes (visualizar, procesar)
├─ Maestro: Perfil + disponibilidad
├─ Maestro: Aceptar/rechazar contratos (botones)
│  └─ [ARQUITECTURA preparada para contra-oferta, lógica después]
└─ Notificaciones básicas (push/in-app)

FASE 3: Pulido + Beta (1-2 semanas)
├─ Pruebas end-to-end
├─ Optimización mobile
├─ Preparar compartir proyectos (feature flag)
└─ Lanzamiento público (Beta)

POST-LANZAMIENTO (Q2 2026):
├─ Pagos (Stripe/MercadoPago TOTP/2FA)
├─ Chat/Mensajería
├─ IA (análisis de precios, recomendaciones)
├─ Contra-oferta de Maestro (lógica completa)
└─ Cloud migration
```

---

## 🏛️ Arquitectura de Orquestación (Antigravity + Claude Code)

### Roles de los Agentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANTIGRAVITY (ORCHESTRATOR)                    │
│  - Gestiona sprints, dependencias, validaciones                 │
│  - Coordina Claude Code + Stitch                                │
│  - Monitorea estado del proyecto                                │
└─────────────────────────────────────────────────────────────────┘
                ↓                         ↓
    ┌───────────────────┐      ┌──────────────────────┐
    │   CLAUDE CODE     │      │  GOOGLE STITCH 2.0   │
    │   (Executor)      │      │   (UI Generator)     │
    │                   │      │                      │
    │ - Backend logic   │      │ - Screen designs     │
    │ - API endpoints   │      │ - Component HTML     │
    │ - DB migrations   │      │ - Responsive layout  │
    │ - Auth flows      │      │                      │
    │ - Integrations    │      │                      │
    └───────────────────┘      └──────────────────────┘
            ↓                           ↓
    ┌─────────────────────────────────────┐
    │  SUPABASE (Database + Auth)         │
    │  PostgreSQL | RLS | Realtime        │
    └─────────────────────────────────────┘
```

### Flujo de Entrega de Funcionalidad

1. **Antigravity define ticket/tarea** (ej: "Constructor - Tienda básica")
2. **Claude Code** → API endpoints + DB schema
3. **Stitch** → UI screens (basadas en design locked)
4. **Claude Code** → Integración frontend-backend
5. **Antigravity** → Validación, testing, siguiente tarea

---

## 🗄️ Tech Stack Confirmado

### Frontend
- **Framework:** React 18
- **Build:** Vite
- **Styling:** Tailwind CSS + ZITEO tokens (`ZITEO_DESIGN_MASTER.md`)
- **Icons:** Material Symbols (SVG, stroke 1.5px)
- **State Management:** TanStack Query (server state) + Zustand (client state)
- **Package Manager:** npm/pnpm

### Backend
- **Platform:** Supabase
- **Database:** PostgreSQL 15+
- **Auth:** Supabase Auth (OTP, Google, Apple)
- **Storage:** Supabase Storage (product images, project photos)
- **Realtime:** Supabase Realtime (notificaciones, carrito sync)
- **Edge Functions:** Node.js (webhooks, lógica sensible)

### Infraestructura MVP
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **Post-lanzamiento:** Cloud (GCP/AWS, pending decision)

---

## 📊 Database Schema Resumen

### Tablas Principales

```sql
/* AUTH (manejado por Supabase Auth, pero referenciamos en DB) */
profiles (user_id, role, phone, name, city, avatar_url, created_at)

/* PRODUCTOS & TIENDA */
products (id, provider_id, category, name, price, stock, image_url, spec, active)
categories (id, name, icon_name) -- maestros, herramientas, materiales, etc.

/* PROYECTOS */
projects (id, constructor_id, name, photo_url, location, budget, status, created_at)
project_materials (id, project_id, product_id, quantity, added_at)

/* CARRITO */
cart_items (id, user_id, product_id, quantity, added_at)
-- persistente en Supabase (no solo localStorage)

/* ÓRDENES */
orders (id, constructor_id, provider_id, total, status, created_at, due_date)
order_items (id, order_id, product_id, quantity, price_unit)

/* MAESTROS (Mano de Obra) */
maestro_profiles (user_id, specialties[], rate_type, rate_amount, available, bio)

/* CONTRATOS / LICITACIONES */
contracts (id, maestro_id, constructor_id, project_id, type, status, created_at)
-- type: 'direct_hire' | 'bidding' (arquitectura preparada para licitaciones)

contract_bids (id, contract_id, maestro_id, amount, notes, status)
-- preparada para: accept, reject, counter_offer (lógica post-MVP)

/* NOTIFICACIONES */
notifications (id, user_id, type, related_id, read, created_at)

/* COMPARTIR PROYECTOS (preparada, feature flag) */
project_shares (id, project_id, shared_by_id, shared_with_id, access_level, created_at)
```

**Nota:** Ver `ZITEO_DATABASE_SCHEMA_COMPLETO.md` (se creará) para detalles completos, constraints, RLS policies.

---

## 🔌 API Spec Resumen (por rol)

### Constructor Endpoints

```
POST   /api/auth/register                    -- Registro (fase 1)
POST   /api/auth/login                       -- Login PIN + OTP
GET    /api/tienda/productos                 -- Búsqueda + filtros
GET    /api/tienda/productos/:id             -- Detalle producto
POST   /api/cart/items                       -- Agregar al carrito
GET    /api/cart                             -- Ver carrito
PATCH  /api/cart/items/:id                   -- Actualizar cantidad
DELETE /api/cart/items/:id                   -- Eliminar del carrito

GET    /api/proyectos                        -- Listar mis proyectos
POST   /api/proyectos                        -- Crear proyecto
GET    /api/proyectos/:id                    -- Detalle proyecto
PATCH  /api/proyectos/:id                    -- Editar proyecto
DELETE /api/proyectos/:id                    -- Eliminar proyecto

POST   /api/proyectos/:id/materiales         -- Agregar material a proyecto
GET    /api/proyectos/:id/materiales         -- Ver materiales del proyecto
DELETE /api/proyectos/:id/materiales/:mat_id -- Quitar material

GET    /api/maestros                         -- Listar maestros (búsqueda)
POST   /api/maestros/:id/contratos           -- Contratar maestro (future: licitación)

POST   /api/proyectos/:id/share              -- Compartir proyecto [FEATURE FLAG]
```

### Proveedor Endpoints

```
GET    /api/proveedor/dashboard              -- Stats básicas (órdenes, stock)
POST   /api/proveedor/productos              -- Crear producto
PATCH  /api/proveedor/productos/:id          -- Editar producto
DELETE /api/proveedor/productos/:id          -- Eliminar producto
GET    /api/proveedor/productos              -- Ver mis productos

GET    /api/proveedor/ordenes                -- Mis órdenes
PATCH  /api/proveedor/ordenes/:id/status     -- Cambiar estado (pending → confirmed → delivered)

POST   /api/proveedor/productos/bulk-upload  -- [FUTURE] Bulk import (CSV, IA después)
```

### Maestro Endpoints

```
GET    /api/maestro/perfil                   -- Mi perfil
PATCH  /api/maestro/perfil                   -- Editar perfil
GET    /api/maestro/contratos                -- Mis contratos
PATCH  /api/maestro/contratos/:id/status     -- Accept/Reject [botones MVP]
  -- payload: { status: 'accepted' | 'rejected' }
  -- [PREPARADA ARQUITECTURA para { status: 'counter_offered', amount, notes }]
```

**Nota:** Ver `ZITEO_API_SPEC_COMPLETO.md` (se creará) para request/response schemas, auth headers, rate limiting.

---

## 🎬 Sprint Breakdown (Fase 1 + 2)

### Sprint 1: Onboarding + Tienda Base (Semana 1-2)

**Claude Code:**
- [x] Supabase setup: Auth, RLS policies, profiles table
- [ ] Endpoints: register, login, OTP verification
- [ ] Endpoints: GET /tienda/productos (con filtering)
- [ ] Endpoints: POST/GET/PATCH/DELETE /cart

**Stitch:**
- [ ] Splash screen (geometric pattern, loading bar)
- [ ] Welcome screen
- [ ] Login screen (PIN + Google/Apple)
- [ ] Registration (3 steps)
- [ ] Constructor tienda home (carruseles, categorías)
- [ ] Producto detalle + carrito modal

**Validaciones Antigravity:**
- Auth flow end-to-end
- Carrito persistencia (localStorage + Supabase sync)
- Búsqueda + filtros rendering

---

### Sprint 2: Proyectos + Integración (Semana 2-3)

**Claude Code:**
- [ ] Endpoints: CRUD /proyectos
- [ ] Endpoints: POST/GET/DELETE /proyectos/:id/materiales
- [ ] Integración carrito → proyectos (agregar materiales)
- [ ] DB migrations: projects, project_materials tables

**Stitch:**
- [ ] Proyectos tab (CRUD UI)
- [ ] Proyecto detalle + agregar materiales
- [ ] Materiales list con delete

**Validaciones Antigravity:**
- Full Constructor flow: Tienda → Carrito → Proyecto → Materiales

---

### Sprint 3: Proveedor Dashboard (Semana 3-4)

**Claude Code:**
- [ ] Endpoints: CRUD /proveedor/productos
- [ ] Endpoints: GET/PATCH /proveedor/ordenes
- [ ] DB migrations: products, orders, order_items

**Stitch:**
- [ ] Proveedor home (stats, órdenes recientes)
- [ ] Productos CRUD (lista, crear, editar)
- [ ] Órdenes (visualizar, cambiar estado)

**Validaciones Antigravity:**
- Proveedor → Crear producto → Constructor ve en tienda

---

### Sprint 4: Maestro + Pulido (Semana 4-5)

**Claude Code:**
- [ ] Endpoints: Maestro perfil, contratos, aceptar/rechazar
- [ ] DB migrations: maestro_profiles, contracts
- [ ] Notificaciones básicas (push schema)
- [ ] [ARQUITECTURA para contra-oferta: contract_bids table + endpoints]

**Stitch:**
- [ ] Maestro perfil
- [ ] Contratos list + botones accept/reject
- [ ] [UI preparada para counter_offer modal, lógica después]

**Validaciones Antigravity:**
- Full Constructor → Contratar maestro → Maestro acepta/rechaza

---

## 🔐 Autenticación & Seguridad MVP

### Flujo Auth (MVP)

1. **Registro:**
   - Phone → OTP (Twilio vía Supabase Auth)
   - Nombre + Ciudad + PIN (5 dígitos, hashed en profiles)
   - Seleccionar rol (Constructor/Proveedor/Maestro)

2. **Login:**
   - Phone + PIN (verificamos contra profiles.pin_hash)
   - Biometrics (opcional, mobile device)
   - Google/Apple (opcional, future polish)

3. **Sesión:**
   - JWT token (Supabase Auth)
   - Refresh token (14 días)
   - RLS policies (row-level security) en Supabase

### TOTP/2FA (post-MVP, solo pagos)

- Habilitado solo en checkout
- User scans QR code → guardar secret en DB
- Verificar code en cada pago
- Recovery codes (guardados localmente + en DB)

---

## 💾 Carrito Persistente (Arquitectura)

```javascript
/* MVP Strategy */

LocalStorage (UI state)
    ↓ (sync cada 5s)
Supabase cart_items table (persistencia)
    ↓ (Realtime subscription)
UI (actualización reactiva)

/* Flujo */
1. User agrega producto → cart_items (local) + POST /api/cart
2. Supabase Realtime notifica cambios a otros dispositivos
3. Si desconexión → localStorage mantiene carrito
4. Reconexión → sincroniza con servidor
```

---

## 🎁 Maestro: Accept/Reject + Arquitectura para Contra-Oferta

### MVP (Fase 2)

```sql
-- contracts table
id | maestro_id | constructor_id | project_id | type | status | created_at
1  | 5          | 2              | 10         | direct_hire | pending | 2026-04-04

-- status: 'pending' | 'accepted' | 'rejected'
```

**Endpoints:**
```
PATCH /api/maestro/contratos/:id/status
{
  status: 'accepted' | 'rejected'
}
```

**UI:** Botones [Aceptar] [Rechazar]

---

### Post-MVP: Contra-Oferta (Arquitectura preparada)

```sql
-- contract_bids table (preparada)
id | contract_id | maestro_id | amount | notes | status | created_at
1  | 1           | 5          | 500    | Precio ajustado | pending | 2026-04-10

-- status: 'pending' | 'accepted' | 'rejected'
```

**Endpoints (futuros):**
```
POST /api/maestro/contratos/:id/counter-offer
{
  amount: 550,
  notes: "Precio incluye materiales"
}

PATCH /api/maestro/contratos/:id/counter-offer/:bid_id
{
  status: 'accepted' | 'rejected'
}
```

**UI (futura):** Modal "Hacer contra-oferta" con input de precio + notas.

---

## 📈 Compartir Proyectos (Feature Flag)

### MVP (Desactivado)

```sql
-- project_shares table (preparada)
id | project_id | shared_by_id | shared_with_id | access_level | created_at
```

### Fase 2/3: Activación

- Constructor puede compartir proyecto con Proveedor/Maestro
- Acceso: 'view' (lectura) | 'edit' (colaboración)
- UI: Botón "Compartir" en proyectos

---

## 🚀 Deployment & Monitoring MVP

### Pre-lanzamiento

- [ ] Staging en Vercel + Supabase staging environment
- [ ] E2E tests (Playwright/Cypress)
- [ ] Load testing (100 usuarios simultáneos)
- [ ] Security audit (OWASP Top 10)

### Lanzamiento (Beta)

- [ ] Producción: Vercel + Supabase prod
- [ ] Analytics (Mixpanel/Segment)
- [ ] Error tracking (Sentry)
- [ ] Crash reporting (mobile)

### Post-lanzamiento

- [ ] Cloud migration (GCP/AWS, decision pending)
- [ ] CDN + caching strategy
- [ ] DB optimization (indexing, partitioning)

---

## 📋 Documentos Dependientes (A crear)

| Documento | Owner | Sprint |
|-----------|-------|--------|
| `ZITEO_DATABASE_SCHEMA_COMPLETO.md` | Claude Code | Sprint 0 |
| `ZITEO_API_SPEC_COMPLETO.md` | Claude Code | Sprint 0 |
| `ZITEO_AUTH_FLOWS.md` | Claude Code | Sprint 1 |
| `ZITEO_FRONTEND_ARCHITECTURE.md` | Stitch + Claude Code | Sprint 1 |
| `ZITEO_TESTING_STRATEGY.md` | Antigravity | Sprint 2 |
| `ZITEO_DEPLOYMENT_CHECKLIST.md` | Antigravity | Sprint 4 |

---

## ✅ Checklist Pre-Sprint 1

- [ ] Supabase proyecto creado (free tier con upgrade path)
- [ ] GitHub repo inicializado (React + Tailwind template)
- [ ] Figma access confirmado (ZITEO file ID: `4D25Fz61d1JrsfsNWf1Ydo`)
- [ ] `ZITEO_DESIGN_MASTER.md` actualizado con tokens finales
- [ ] `claude.md` + `STITCH_ORIGINAL_COMPLETO.md` listos en repo
- [ ] Antigravity proyecto setup (si aplica)
- [ ] Team sync: Rol de cada agente confirmado

---

## 🎯 KPIs de Éxito MVP

- **Tiempo:** Lanzamiento en 5 semanas (Fase 1 + 2 + 3)
- **Calidad:** 0 errores críticos en beta
- **Performance:** Tienda carga en <2s (mobile 4G)
- **Adopción:** 100+ Constructores registrados en primera semana

---

## 📞 Escalabilidad Post-MVP

| Feature | Implementación | Timeline |
|---------|---|---|
| Pagos | Stripe/MercadoPago + TOTP/2FA | Semana 6-7 |
| Chat | Realtime messaging (Supabase) | Semana 8 |
| IA | Análisis de precios, recomendaciones | Semana 9+ |
| Contra-oferta Maestro | Lógica completa + UI | Semana 10 |
| Compartir proyectos | Feature flag → enabled | Semana 8 |
| Cloud migration | GCP/AWS | Post-lanzamiento |

---

**Esta es tu brújula. Antigravity la usa para orquestar, Claude Code para ejecutar, Stitch para diseñar.**

¿Listo? 🚀

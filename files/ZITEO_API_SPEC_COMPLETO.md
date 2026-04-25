# 🔌 ZITEO API Specification Completa

**Version:** 1.0 MVP  
**Framework:** Node.js + Express (Supabase Edge Functions)  
**Owner:** Claude Code (Antigravity orchestration)

---

## 📌 Convenios Globales

### Headers requeridos
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-Client-Version: 1.0.0 (para versioning post-MVP)
```

### Response format
```json
{
  "success": true,
  "data": { /* payload */ },
  "error": null,
  "timestamp": "2026-04-04T10:30:00Z"
}
```

### Error format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "El carrito está vacío",
    "details": { /* additional info */ }
  },
  "timestamp": "2026-04-04T10:30:00Z"
}
```

### HTTP Status Codes
- `200` → OK
- `201` → Created
- `400` → Bad Request
- `401` → Unauthorized
- `403` → Forbidden (insufficient permissions)
- `404` → Not Found
- `409` → Conflict (duplicate, constraint violation)
- `422` → Unprocessable Entity (validation error)
- `500` → Server Error

### Rate Limiting (post-MVP)
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1712249400
```

---

## 🔐 Autenticación

### POST `/api/auth/register`

**Descripción:** Registrar nuevo usuario con su primer rol. Una vez registrado puede habilitar roles adicionales desde su avatar (sin crear nueva cuenta).

**Payload:**
```json
{
  "phone": "+591-1234567",
  "name": "Juan Pérez",
  "city": "La Paz",
  "pin": "12345",
  "initial_role": "constructor"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "+591-1234567",
    "name": "Juan Pérez",
    "active_role": "constructor",
    "roles": ["constructor"],
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Errors:**
- `409`: Phone ya registrado
- `422`: PIN no es 5 dígitos o nombre vacío

**Lógica:**
1. Validar phone (formato +591-XXXXXXXX)
2. Crear user en Supabase Auth (method: 'phone')
3. Enviar OTP a phone (Twilio via Supabase)
4. Crear profile en `profiles` con `active_role = initial_role`
5. Insertar primer rol en `user_roles` con `onboarding_completed = false`
6. Retornar token + lista de roles habilitados

**Nota multi-rol:** Un usuario puede habilitar roles adicionales después del registro desde el menú de avatar → "Agregar rol". Cada nuevo rol pasa por onboarding propio (campos específicos del rol). El switch de rol activo se hace con `PATCH /api/auth/switch-role`.

**Nota:** Google/Apple SSO es **[POST-MVP]**. MVP soporta solo `pin` y biometría device-level (no requiere backend).

---

### POST `/api/auth/login`

**Descripción:** Login con phone + PIN

**Payload:**
```json
{
  "phone": "+591-1234567",
  "pin": "12345"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Juan Pérez",
    "active_role": "constructor",
    "roles": ["constructor", "maestro"],
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Errors:**
- `401`: PIN incorrecto
- `404`: Usuario no encontrado

---

### PATCH `/api/auth/switch-role`

**Descripción:** Cambiar el rol activo de la sesión (desde el avatar del usuario). Requiere que el rol esté habilitado en `user_roles` y tenga `onboarding_completed = true`.

**Headers:** `Authorization: Bearer {token}`

**Payload:**
```json
{
  "role": "maestro"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "active_role": "maestro",
    "roles": ["constructor", "maestro"]
  }
}
```

**Errors:**
- `400`: `UNAUTHORIZED_ROLE` — rol no habilitado o onboarding incompleto
- `422`: rol inválido

**Lógica:**
1. Verificar que `user_roles` tiene el rol con `onboarding_completed = true`
2. Llamar a función SQL `switch_active_role(role)` (actualiza `profiles.active_role`)
3. Retornar el nuevo `active_role` y lista completa de roles

---

### POST `/api/auth/add-role`

**Descripción:** Habilitar un nuevo rol en la cuenta existente. Inicia el onboarding para ese rol.

**Headers:** `Authorization: Bearer {token}`

**Payload:**
```json
{
  "role": "proveedor",
  "store_name": "Ferretería El Constructor",
  "store_description": "Venta de materiales de construcción"
}
```
> Los campos extra dependen del rol: `company_name` para constructor, `store_name`/`store_description` para proveedor, `specialty`/`years_experience`/`hourly_rate` para maestro.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "role": "proveedor",
    "onboarding_completed": true,
    "roles": ["constructor", "proveedor"]
  }
}
```

**Errors:**
- `409`: Rol ya habilitado
- `422`: Campos requeridos del rol faltantes

---

### POST `/api/auth/verify-otp`

**Descripción:** Verificar OTP (SMS) para confirmar phone

**Payload:**
```json
{
  "phone": "+591-1234567",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "verified": true
  }
}
```

---

### POST `/api/auth/refresh`

**Descripción:** Refrescar access token

**Payload:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

---

### POST `/api/auth/logout`

**Descripción:** Invalidar refresh token

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Logged out" }
}
```

---

## 🛒 Tienda (Constructor)

### GET `/api/tienda/productos`

**Descripción:** Listar productos con filtros y búsqueda

**Query params:**
```
?search=cemento&category=Materiales&min_price=10&max_price=500&sort=name_asc&limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400...",
        "name": "Cemento Portland 50kg",
        "price_unit": 150,
        "unit_type": "bolsa",
        "stock_quantity": 100,
        "image_url": "https://...",
        "provider": {
          "user_id": "...",
          "name": "Ferretería La Paz",
          "city": "La Paz"
        },
        "category": "Materiales",
        "specs": { "marca": "Fancesa", "tipo": "Portland" }
      }
    ],
    "total": 245,
    "limit": 20,
    "offset": 0,
    "facets": {
      "categories": [
        { "name": "Materiales", "count": 150 },
        { "name": "Herramientas", "count": 95 }
      ],
      "prices": { "min": 5, "max": 2000 }
    }
  }
}
```

---

### GET `/api/tienda/productos/:id`

**Descripción:** Detalle de producto

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400...",
    "name": "Cemento Portland 50kg",
    "description": "Cemento de alta calidad para construcción",
    "price_unit": 150,
    "unit_type": "bolsa",
    "stock_quantity": 100,
    "image_url": "https://...",
    "specs": { "marca": "Fancesa", "tipo": "Portland", "resistencia": "42.5 MPa" },
    "provider": {
      "user_id": "...",
      "name": "Ferretería La Paz",
      "city": "La Paz",
      "rating": 4.8,
      "reviews_count": 150
    },
    "category": "Materiales",
    "created_at": "2026-03-15T10:00:00Z"
  }
}
```

---

## 🛒 Carrito (Constructor)

### GET `/api/cart`

**Descripción:** Obtener carrito del usuario

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart-item-id",
        "product_id": "550e8400...",
        "product_name": "Cemento Portland 50kg",
        "quantity": 5,
        "price_unit": 150,
        "subtotal": 750,
        "provider_name": "Ferretería La Paz",
        "image_url": "https://..."
      }
    ],
    "total_items": 1,
    "total_amount": 750,
    "last_updated": "2026-04-04T10:00:00Z"
  }
}
```

---

### POST `/api/cart/items`

**Descripción:** Agregar producto al carrito

**Payload:**
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 5
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "cart-item-id",
    "product_id": "550e8400...",
    "quantity": 5,
    "price_unit": 150,
    "subtotal": 750
  }
}
```

**Errors:**
- `404`: Producto no existe
- `400`: Stock insuficiente
- `422`: Cantidad inválida

---

### PATCH `/api/cart/items/:id`

**Descripción:** Actualizar cantidad en carrito

**Payload:**
```json
{
  "quantity": 10
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cart-item-id",
    "quantity": 10,
    "subtotal": 1500
  }
}
```

---

### DELETE `/api/cart/items/:id`

**Descripción:** Eliminar producto del carrito

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Item removed from cart" }
}
```

---

### POST `/api/cart/checkout`

**Descripción:** Convertir carrito en orden(es)

**Payload:**
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "notes": "Urgente, necesito antes del viernes"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "orders_created": [
      {
        "id": "order-id-1",
        "provider_id": "...",
        "provider_name": "Ferretería La Paz",
        "total": 750,
        "status": "pending",
        "items_count": 1
      }
    ],
    "total_orders": 1,
    "total_amount": 750,
    "cart_cleared": true
  }
}
```

**Nota:** Si hay productos de múltiples proveedores, se crean múltiples órdenes.

---

## 🔄 Cart Sync Strategy

**Regla:** Supabase es la fuente de verdad. `localStorage` es solo caché local.

```
Flujo de sincronización:

1. AGREGAR ITEM (online):
   → POST /api/cart/items
   → Guardar resultado en localStorage

2. AGREGAR ITEM (offline):
   → Solo guardar en localStorage con flag: { synced: false }

3. AL CARGAR LA APP / HACER LOGIN:
   → GET /api/cart
   → Reemplazar localStorage con respuesta del servidor (server wins)

4. AL RECONECTAR (offline → online):
   → GET /api/cart para obtener estado del servidor
   → Para items con { synced: false } en localStorage → POST /api/cart/items
   → Merge: si mismo product_id existe en ambos, usar cantidad del servidor

5. AL HACER CHECKOUT:
   → POST /api/cart/checkout
   → Vaciar localStorage del carrito

CONFLICTO: Si mismo product_id existe con cantidades diferentes en server y local → usar cantidad del servidor.
```

**Implementación en frontend (Zustand store):**
```javascript
// Al iniciar la app:
// 1. Cargar localStorage como estado inicial (UX inmediata)
// 2. Fetch GET /api/cart en background
// 3. Reemplazar store con respuesta del servidor
```

---

## 📋 Proyectos (Constructor)

### GET `/api/proyectos`

**Descripción:** Listar proyectos del constructor

**Query params:**
```
?status=planning,active&sort=created_at_desc&limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400...",
        "name": "Remodelación Casa Las Flores",
        "description": "Remodelación de cocina y baño",
        "location_address": "Calle Principal 123, La Paz",
        "status": "planning",
        "estimated_budget": 5000,
        "photo_url": "https://...",
        "start_date": "2026-04-15",
        "estimated_end_date": "2026-06-15",
        "materials_count": 5,
        "created_at": "2026-04-01T10:00:00Z"
      }
    ],
    "total": 3,
    "limit": 20,
    "offset": 0
  }
}
```

---

### POST `/api/proyectos`

**Descripción:** Crear nuevo proyecto

**Payload:**
```json
{
  "name": "Remodelación Casa Las Flores",
  "description": "Remodelación de cocina y baño",
  "location_address": "Calle Principal 123, La Paz",
  "location_lat": -16.5023,
  "location_lng": -68.1193,
  "estimated_budget": 5000,
  "start_date": "2026-04-15",
  "estimated_end_date": "2026-06-15",
  "photo_url": "https://[project].supabase.co/storage/v1/object/public/projects/..."  // [OPTIONAL] — subir primero a Supabase Storage desde el frontend
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400...",
    "name": "Remodelación Casa Las Flores",
    "status": "planning",
    "photo_url": "https://storage.supabase.co/...",
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**Errors:**
- `422`: Campos requeridos faltantes
- `413`: Foto demasiado grande (max 10MB)

---

### GET `/api/proyectos/:id`

**Descripción:** Detalle del proyecto

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400...",
    "name": "Remodelación Casa Las Flores",
    "description": "Remodelación de cocina y baño",
    "location_address": "Calle Principal 123, La Paz",
    "location_lat": -16.5023,
    "location_lng": -68.1193,
    "status": "planning",
    "estimated_budget": 5000,
    "photo_url": "https://...",
    "start_date": "2026-04-15",
    "estimated_end_date": "2026-06-15",
    "created_at": "2026-04-01T10:00:00Z",
    "updated_at": "2026-04-04T10:00:00Z"
  }
}
```

---

### PATCH `/api/proyectos/:id`

**Descripción:** Actualizar proyecto

**Payload:** (todos opcionales)
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "status": "active",
  "estimated_budget": 6000,
  "estimated_end_date": "2026-07-15"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400...",
    "name": "Nuevo nombre",
    "updated_at": "2026-04-04T11:00:00Z"
  }
}
```

---

### DELETE `/api/proyectos/:id`

**Descripción:** Eliminar proyecto

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Project deleted" }
}
```

**Nota:** Solo si no hay órdenes asociadas (soft delete en futuro)

---

## 📦 Materiales del Proyecto (Constructor)

### GET `/api/proyectos/:id/materiales`

**Descripción:** Listar materiales del proyecto

**Response (200):**
```json
{
  "success": true,
  "data": {
    "project_id": "550e8400...",
    "items": [
      {
        "id": "material-id-1",
        "product_id": "product-id-1",
        "product_name": "Cemento Portland 50kg",
        "quantity": 10,
        "unit_type": "bolsa",
        "price_unit": 150,
        "subtotal": 1500,
        "provider_name": "Ferretería La Paz",
        "notes": "Calidad premium",
        "added_at": "2026-04-04T10:00:00Z"
      }
    ],
    "total_items": 1,
    "total_amount": 1500
  }
}
```

---

### POST `/api/proyectos/:id/materiales`

**Descripción:** Agregar material al proyecto

**Payload:**
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 10,
  "notes": "Calidad premium"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "material-id-1",
    "product_id": "550e8400...",
    "quantity": 10,
    "unit_type": "bolsa",
    "price_unit": 150,
    "subtotal": 1500
  }
}
```

---

### DELETE `/api/proyectos/:id/materiales/:mat_id`

**Descripción:** Eliminar material del proyecto

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Material removed" }
}
```

---

## 🏪 Proveedor Dashboard

### GET `/api/proveedor/dashboard`

**Descripción:** Stats del proveedor

**Response (200):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "550e8400...",
      "name": "Ferretería La Paz",
      "city": "La Paz",
      "phone": "+591-234-5678"
    },
    "stats": {
      "pending_orders": 5,
      "confirmed_orders": 12,
      "total_revenue_month": 15000,
      "products_active": 150,
      "products_low_stock": 8
    },
    "recent_orders": [
      {
        "id": "order-id-1",
        "constructor_name": "Juan Pérez",
        "total": 750,
        "status": "pending",
        "created_at": "2026-04-04T10:00:00Z"
      }
    ]
  }
}
```

---

### GET `/api/proveedor/productos`

**Descripción:** Listar productos del proveedor

**Query params:**
```
?status=active,inactive&sort=created_at_desc&limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400...",
        "name": "Cemento Portland 50kg",
        "category": "Materiales",
        "price_unit": 150,
        "unit_type": "bolsa",
        "stock_quantity": 100,
        "stock_status": "good",
        "image_url": "https://...",
        "active": true,
        "created_at": "2026-03-15T10:00:00Z"
      }
    ],
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

---

### POST `/api/proveedor/productos`

**Descripción:** Crear nuevo producto

**Payload:**
```json
{
  "name": "Cemento Portland 50kg",
  "description": "Cemento de alta calidad",
  "category": "Materiales",
  "price_unit": 150,
  "unit_type": "bolsa",
  "stock_quantity": 100,
  "specs": {
    "marca": "Fancesa",
    "tipo": "Portland",
    "resistencia": "42.5 MPa"
  },
  "image_url": "https://[project].supabase.co/storage/v1/object/public/products/..."  // [OPTIONAL] — subir primero a Supabase Storage desde el frontend
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400...",
    "name": "Cemento Portland 50kg",
    "image_url": "https://...",
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**Errors:**
- `422`: Campos requeridos faltantes
- `413`: Imagen demasiado grande

---

### PATCH `/api/proveedor/productos/:id`

**Descripción:** Actualizar producto

**Payload:** (todos opcionales)
```json
{
  "name": "Nuevo nombre",
  "price_unit": 160,
  "stock_quantity": 120,
  "active": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400...",
    "name": "Nuevo nombre",
    "updated_at": "2026-04-04T11:00:00Z"
  }
}
```

---

### DELETE `/api/proveedor/productos/:id`

**Descripción:** Eliminar producto (soft delete)

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Product deleted" }
}
```

---

### GET `/api/proveedor/ordenes`

**Descripción:** Listar órdenes del proveedor

**Query params:**
```
?status=pending,confirmed&sort=created_at_desc&limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "order-id-1",
        "constructor_name": "Juan Pérez",
        "constructor_city": "La Paz",
        "total": 750,
        "status": "pending",
        "items_count": 2,
        "created_at": "2026-04-04T10:00:00Z",
        "due_date": "2026-04-07"
      }
    ],
    "total": 5,
    "stats": {
      "pending_total": 3000,
      "confirmed_total": 5000
    }
  }
}
```

---

### GET `/api/proveedor/ordenes/:id`

**Descripción:** Detalle de orden

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "order-id-1",
    "constructor": {
      "user_id": "...",
      "name": "Juan Pérez",
      "city": "La Paz",
      "phone": "+591-123-4567"
    },
    "project": {
      "id": "project-id",
      "name": "Remodelación Casa Las Flores"
    },
    "total": 750,
    "status": "pending",
    "items": [
      {
        "id": "item-1",
        "product_name": "Cemento Portland 50kg",
        "quantity": 5,
        "price_unit": 150,
        "subtotal": 750
      }
    ],
    "notes": "Urgente",
    "created_at": "2026-04-04T10:00:00Z",
    "due_date": "2026-04-07"
  }
}
```

---

### PATCH `/api/proveedor/ordenes/:id/status`

**Descripción:** Actualizar estado de orden

**Payload:**
```json
{
  "status": "confirmed",
  "notes": "Orden confirmada, será entregada el viernes"
}
```

**Valid statuses:** `pending` → `confirmed` → `shipped` → `delivered`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "order-id-1",
    "status": "confirmed",
    "updated_at": "2026-04-04T11:00:00Z"
  }
}
```

**Nota:** Cambiar a `delivered` genera notificación al Constructor.

---

## 👨‍🔧 Maestro (Mano de Obra)

### GET `/api/maestro/perfil`

**Descripción:** Obtener perfil del maestro

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400...",
    "name": "Carlos Electricista",
    "city": "La Paz",
    "phone": "+591-345-6789",
    "specialties": ["electricista", "reparaciones"],
    "rate_type": "per_day",
    "rate_amount": 200,
    "experience_years": 10,
    "available": true,
    "max_concurrent_projects": 3,
    "portfolio_url": "https://...",
    "bio": "Electricista con 10 años de experiencia"
  }
}
```

---

### PATCH `/api/maestro/perfil`

**Descripción:** Actualizar perfil del maestro

**Payload:** (todos opcionales)
```json
{
  "specialties": ["electricista", "reparaciones", "instalaciones"],
  "rate_type": "per_day",
  "rate_amount": 250,
  "available": true,
  "bio": "Actualizado",
  "experience_years": 11
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400...",
    "specialties": ["electricista", "reparaciones", "instalaciones"],
    "rate_amount": 250,
    "updated_at": "2026-04-04T11:00:00Z"
  }
}
```

---

### GET `/api/maestro/contratos`

**Descripción:** Listar contratos del maestro

**Query params:**
```
?status=pending,accepted&sort=created_at_desc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "contract-id-1",
        "title": "Electricidad Casa Las Flores",
        "constructor_name": "Juan Pérez",
        "project_name": "Remodelación Casa Las Flores",
        "type": "direct_hire",
        "status": "pending",
        "initial_amount": 500,
        "start_date": "2026-04-15",
        "estimated_end_date": "2026-04-25",
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "total": 2,
    "stats": {
      "pending": 1,
      "accepted": 1,
      "completed": 10
    }
  }
}
```

---

### GET `/api/maestro/contratos/:id`

**Descripción:** Detalle del contrato

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "contract-id-1",
    "title": "Electricidad Casa Las Flores",
    "description": "Instalación de circuitos eléctricos",
    "constructor": {
      "user_id": "...",
      "name": "Juan Pérez",
      "phone": "+591-123-4567",
      "city": "La Paz"
    },
    "project": {
      "id": "project-id",
      "name": "Remodelación Casa Las Flores",
      "location_address": "Calle Principal 123, La Paz"
    },
    "type": "direct_hire",
    "status": "pending",
    "initial_amount": 500,
    "scope": {
      "tasks": ["Instalación de 15 puntos", "Revisión de panel principal"],
      "requirements": ["Herramientas propias"],
      "timeline": "10 días"
    },
    "start_date": "2026-04-15",
    "estimated_end_date": "2026-04-25",
    "created_at": "2026-04-04T10:00:00Z",
    
    "counter_bids": [
      {
        "id": "bid-id-1",
        "amount": 550,
        "notes": "Precio incluye materiales",
        "status": "pending"
      }
    ]
  }
}
```

---

### PATCH `/api/maestro/contratos/:id/status`

**Descripción:** Aceptar o rechazar contrato

**Payload:**
```json
{
  "status": "accepted"
}
```

**Valid statuses (MVP):** `accepted`, `rejected`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "contract-id-1",
    "status": "accepted",
    "updated_at": "2026-04-04T11:00:00Z"
  }
}
```

**Nota:** Cambiar a `accepted` notifica al Constructor.

---

### POST `/api/maestro/contratos/:id/counter-offer`

**[POST-MVP] Descripción:** Hacer contra-oferta

**Payload:**
```json
{
  "amount": 550,
  "notes": "Precio incluye materiales y herramientas"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "bid_id": "bid-id-1",
    "contract_id": "contract-id-1",
    "amount": 550,
    "status": "pending",
    "created_at": "2026-04-04T11:00:00Z"
  }
}
```

---

## 👷 Búsqueda de Maestros (Constructor)

### GET `/api/maestros`

**Descripción:** Buscar maestros disponibles

**Query params:**
```
?specialty=electricista&city=La%20Paz&rate_type=per_day&min_rate=100&max_rate=500&sort=rating_desc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "user_id": "550e8400...",
        "name": "Carlos Electricista",
        "city": "La Paz",
        "specialties": ["electricista", "reparaciones"],
        "rate_type": "per_day",
        "rate_amount": 200,
        "experience_years": 10,
        "available": true,
        "rating": 4.8,
        "reviews_count": 25
      }
    ],
    "total": 5,
    "filters": {
      "specialties": [
        { "name": "electricista", "count": 15 },
        { "name": "plomería", "count": 12 }
      ],
      "rate_range": { "min": 100, "max": 500 }
    }
  }
}
```

---

### POST `/api/maestros/:id/contratos`

**Descripción:** Crear contrato (contratación directa)

**Payload:**
```json
{
  "title": "Electricidad Casa Las Flores",
  "description": "Instalación de circuitos eléctricos",
  "project_id": "project-id",
  "initial_amount": 500,
  "scope": {
    "tasks": ["Instalación de 15 puntos", "Revisión de panel"],
    "requirements": ["Herramientas propias"],
    "timeline": "10 días"
  },
  "start_date": "2026-04-15",
  "estimated_end_date": "2026-04-25"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "contract-id-1",
    "title": "Electricidad Casa Las Flores",
    "type": "direct_hire",
    "status": "pending",
    "initial_amount": 500,
    "created_at": "2026-04-04T11:00:00Z"
  }
}
```

**Nota:** Notifica al Maestro de nueva propuesta.

---

## 🔔 Notificaciones

### 🔴 Realtime — Supabase Channel

**Método preferido:** Supabase Realtime (no polling). El frontend se suscribe al insertar nuevas notificaciones.

```javascript
// Suscripción en el cliente (React hook)
const channel = supabase
  .channel(`notifications:${user_id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${user_id}`
  }, (payload) => {
    // Actualizar badge del bell icon
    addNotification(payload.new)
  })
  .subscribe()

// Cleanup al desmontar
return () => supabase.removeChannel(channel)
```

**Fallback (si Realtime falla):** `GET /api/notificaciones?since={timestamp}` cada 30 segundos.

**Eventos que generan notificaciones:**

| Evento | Tipo | Destinatario |
|--------|------|--------------|
| Orden creada | `order` | Proveedor |
| Orden confirmada/enviada/entregada | `order` | Constructor |
| Orden cancelada | `order` | Constructor |
| Contrato creado | `contract` | Maestro |
| Contrato aceptado | `contract` | Constructor |
| Contrato rechazado | `contract` | Constructor |

---

### GET `/api/notificaciones`

**Descripción:** Listar notificaciones del usuario

**Query params:**
```
?is_read=false&limit=20&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "notif-id-1",
        "type": "order",
        "title": "Nueva orden de Ferretería La Paz",
        "message": "Has recibido una nueva orden: Cemento Portland 50kg (5 bolsas)",
        "related_entity_type": "order",
        "related_entity_id": "order-id-1",
        "is_read": false,
        "created_at": "2026-04-04T10:00:00Z"
      }
    ],
    "total_unread": 3,
    "total": 50
  }
}
```

---

### PATCH `/api/notificaciones/:id/read`

**Descripción:** Marcar notificación como leída

**Response (200):**
```json
{
  "success": true,
  "data": { "is_read": true }
}
```

---

### DELETE `/api/notificaciones/:id`

**Descripción:** Eliminar notificación

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Notification deleted" }
}
```

---

## 🔗 Compartir Proyectos [FEATURE FLAG]

### POST `/api/proyectos/:id/share`

**[POST-MVP] Descripción:** Compartir proyecto con otro usuario

**Payload:**
```json
{
  "shared_with_phone": "+591-234-5678",
  "access_level": "view",
  "message": "Te comparto mi proyecto para que veas los materiales"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "share-id-1",
    "project_id": "project-id",
    "shared_with_name": "Carlos",
    "access_level": "view",
    "created_at": "2026-04-04T11:00:00Z"
  }
}
```

---

### GET `/api/proyectos/shared-with-me`

**[POST-MVP] Descripción:** Listar proyectos compartidos conmigo

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "share-id-1",
        "project_id": "project-id",
        "project_name": "Remodelación Casa Las Flores",
        "shared_by_name": "Juan Pérez",
        "access_level": "view",
        "created_at": "2026-04-04T11:00:00Z"
      }
    ],
    "total": 2
  }
}
```

---

## ✅ Validaciones Globales

### Campos requeridos por endpoint

| Endpoint | Validaciones |
|----------|---|
| register | phone (formato), name (length 1-100), pin (5 dígitos), city, role |
| login | phone, pin (5 dígitos) |
| create project | name, city (si location_address no provided) |
| create product | name, price_unit > 0, category, stock_quantity >= 0 |
| add to cart | product_id, quantity > 0 |
| create contract | title, project_id, initial_amount > 0 |

### Limites

| Recurso | Límite |
|---------|--------|
| Nombre de producto | 200 caracteres |
| Descripción | 2000 caracteres |
| Imagen | 10 MB máximo |
| Productos por búsqueda | 100 items |
| Carrito | 50 items máximo |
| PIN | 5 dígitos |

---

## 🔐 Tokens y Sesiones

### JWT Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "phone": "+591-1234567",
  "role": "constructor",
  "iat": 1712249400,
  "exp": 1712253000,
  "iss": "ziteo-api"
}
```

### Token Refresh
- **Access Token:** 1 hora
- **Refresh Token:** 14 días
- **Logout:** Invalida refresh token en DB

---

## ⚠️ Appendix: Error Codes Completos

Lista exhaustiva de códigos usados en `error.code` de las respuestas de error.

### Autenticación
| Código | HTTP | Descripción |
|--------|------|-------------|
| `PHONE_ALREADY_REGISTERED` | 409 | El teléfono ya tiene cuenta |
| `USER_NOT_FOUND` | 404 | No existe usuario con ese teléfono |
| `INVALID_PIN` | 401 | PIN incorrecto |
| `INVALID_OTP` | 401 | Código OTP incorrecto |
| `OTP_EXPIRED` | 401 | Código OTP expirado (>10 min) |
| `INVALID_PHONE_FORMAT` | 422 | Teléfono no cumple formato +591-XXXXXXX |
| `TOKEN_EXPIRED` | 401 | Access token expirado |
| `INVALID_TOKEN` | 401 | Token inválido o revocado |

### Autorización
| Código | HTTP | Descripción |
|--------|------|-------------|
| `UNAUTHORIZED_ROLE` | 403 | El rol del usuario no tiene permiso para esta acción |
| `NOT_YOUR_RESOURCE` | 403 | El recurso pertenece a otro usuario |

### Productos & Tienda
| Código | HTTP | Descripción |
|--------|------|-------------|
| `PRODUCT_NOT_FOUND` | 404 | Producto no existe |
| `PRODUCT_NOT_ACTIVE` | 400 | Producto desactivado por el proveedor |
| `PRODUCT_DELETED` | 400 | Producto eliminado (soft delete) |
| `INSUFFICIENT_STOCK` | 400 | Stock insuficiente para la cantidad solicitada |

### Carrito
| Código | HTTP | Descripción |
|--------|------|-------------|
| `CART_ITEM_NOT_FOUND` | 404 | Item no existe en el carrito del usuario |
| `CART_EMPTY` | 400 | Carrito vacío al intentar checkout |
| `CART_LIMIT_EXCEEDED` | 400 | Carrito supera 50 items |
| `INVALID_QUANTITY` | 422 | Cantidad debe ser > 0 |

### Proyectos
| Código | HTTP | Descripción |
|--------|------|-------------|
| `PROJECT_NOT_FOUND` | 404 | Proyecto no existe |
| `PROJECT_HAS_ORDERS` | 409 | No se puede eliminar, tiene órdenes asociadas |

### Órdenes
| Código | HTTP | Descripción |
|--------|------|-------------|
| `ORDER_NOT_FOUND` | 404 | Orden no existe |
| `INVALID_STATUS_TRANSITION` | 400 | Transición de estado no permitida (ej: delivered → pending) |
| `ORDER_ALREADY_CANCELLED` | 409 | Orden ya fue cancelada |

### Contratos
| Código | HTTP | Descripción |
|--------|------|-------------|
| `CONTRACT_NOT_FOUND` | 404 | Contrato no existe |
| `MAESTRO_NOT_AVAILABLE` | 400 | Maestro no está disponible actualmente |
| `CONTRACT_ALREADY_ACCEPTED` | 409 | Contrato ya fue aceptado |
| `CONTRACT_ALREADY_REJECTED` | 409 | Contrato ya fue rechazado |

### Generales
| Código | HTTP | Descripción |
|--------|------|-------------|
| `MISSING_REQUIRED_FIELDS` | 422 | Faltan campos requeridos en el payload |
| `INVALID_REQUEST` | 400 | Request malformado |
| `INTERNAL_ERROR` | 500 | Error interno del servidor |
| `NOT_FOUND` | 404 | Recurso genérico no encontrado |

---

## 📊 Monitoring & Analytics (Post-MVP)

```
POST /api/analytics/track
{
  "event": "product_viewed",
  "product_id": "...",
  "timestamp": "2026-04-04T10:00:00Z"
}
```

---

**Esta es la especificación completa. Claude Code la usa para la implementación de endpoints.**

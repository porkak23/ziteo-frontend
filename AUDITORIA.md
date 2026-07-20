# AUDITORIA TÉCNICA — ZITEOO
> Generado: 2026-06-26 | Alcance: Frontend + Backend (Supabase) + Edge Functions

---

## 1. ARQUITECTURA ACTUAL

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework UI** | React | 19.2.4 |
| **Lenguaje** | TypeScript | 6.0.2 |
| **Build Tool** | Vite | 8.0.4 |
| **Estilos** | Tailwind CSS | 3.4.19 |
| **Estado global** | Zustand | 5.0.12 |
| **Data fetching** | TanStack React Query | 5.96.2 |
| **Validación** | Zod | 4.3.6 |
| **Base de datos** | Supabase (PostgreSQL 15) | 2.101.1 |
| **Auth** | Supabase Auth (Phone + OTP + OAuth) | — |
| **Backend logic** | PostgreSQL RPCs/triggers + Deno Edge Functions | — |
| **Mobile** | Capacitor (Android 8+, iOS 13+) | 8.3.4 |
| **PWA** | Workbox + vite-plugin-pwa | 7.4.0 / 1.2.0 |
| **Notificaciones** | Web Push (VAPID) + Supabase Realtime | — |
| **Monitoreo** | Sentry (errores) + PostHog (analytics) | 8.0.0 / 1.374.2 |
| **Testing** | Playwright (E2E) | 1.49.0 |
| **Despliegue** | Vercel (frontend) + Supabase Cloud (backend) | — |

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (PWA / APK)                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Auth Flow   │  │  Role Tabs   │  │   Shared Components      │  │
│  │  (OTP/PIN/   │  │  Constructor │  │   (ZButton, ZIcon,       │  │
│  │   OAuth)     │  │  Proveedor   │  │    DashNav, etc.)        │  │
│  └──────┬───────┘  │  Maestro     │  └──────────────────────────┘  │
│         │          │  Chofer      │                                  │
│         │          └──────┬───────┘                                  │
│         │                 │                                          │
│  ┌──────▼─────────────────▼──────────────────────────────────────┐  │
│  │              React Query + Zustand (State Layer)              │  │
│  └───────────────────────────────┬───────────────────────────────┘  │
│                                  │                                   │
│  ┌───────────────────────────────▼──────────────────────────────┐   │
│  │          Supabase JS Client (supabase-js 2.101)              │   │
│  └──────┬────────────────────┬──────────────────────────────────┘   │
└─────────┼────────────────────┼──────────────────────────────────────┘
          │                    │
  ┌───────▼──────┐    ┌────────▼────────┐
  │  Supabase    │    │  Edge Functions  │
  │  Database    │    │  (Deno)          │
  │              │    │                  │
  │  PostgreSQL  │    │  auth/login      │
  │  + RLS       │    │  auth/register   │
  │  + RPCs      │    │  auth/otp-verify │
  │  + Triggers  │    │  auth/reset-pin  │
  │  + Realtime  │    │  auth/add-role   │
  │  + Storage   │    │  notifications/  │
  └──────────────┘    │  send-push       │
                      │  beta-signup     │
                      └─────────────────┘
```

### Estructura de Carpetas

```
d:\Ziteo.1\
├── ziteo-frontend/              # App principal (React 19 + Vite)
│   ├── src/
│   │   ├── features/            # Módulos por rol de negocio
│   │   │   ├── auth/            # Login, registro, OTP, OAuth
│   │   │   ├── constructor/     # Dashboard, proyectos, tienda, contratar
│   │   │   ├── proveedor/       # Inventario, pedidos, cotizaciones
│   │   │   ├── vendedor/        # App entry point alternativo (2,370 líneas)
│   │   │   ├── maestro/         # Perfil, onboarding, búsqueda
│   │   │   ├── transportista/   # Viajes, billetera, historial
│   │   │   ├── tienda/          # Catálogo, carrito, checkout
│   │   │   ├── licitaciones/    # Sistema de ofertas/licitaciones
│   │   │   ├── transporte/      # Solicitudes de flete
│   │   │   ├── contratar/       # Contratación de maestros
│   │   │   ├── ocasion/         # Compras puntuales
│   │   │   ├── proyectos/       # Gestión de proyectos
│   │   │   ├── notifications/   # Notificaciones in-app
│   │   │   ├── perfil/          # Perfil de usuario
│   │   │   ├── settings/        # Configuración
│   │   │   └── legal/           # Términos y privacidad
│   │   ├── shared/              # Componentes y utilidades compartidas
│   │   │   ├── components/      # UI reutilizable (CuentaScreen, etc.)
│   │   │   ├── design/          # Design system (tokens, DashNav, ZIcon)
│   │   │   ├── store/           # Stores Zustand (authStore, navStore)
│   │   │   ├── hooks/           # Hooks globales (useToast, useAuthSession)
│   │   │   ├── utils/           # Utilidades generales
│   │   │   ├── query/           # Config React Query
│   │   │   ├── types/           # Tipos TypeScript compartidos
│   │   │   └── native/          # Integraciones Capacitor
│   │   ├── core/                # Servicios core y tema
│   │   │   ├── services/        # authService, API clients
│   │   │   └── theme/           # Configuración de tema
│   │   └── lib/                 # Supabase client, DB types, analytics
│   │       ├── supabase.ts
│   │       ├── database.types.ts   # 2,384 líneas (auto-generado)
│   │       └── analytics.ts
│   ├── public/                  # Assets estáticos + service worker
│   └── android/                 # Proyecto Capacitor Android
│
├── supabase/                    # Backend Supabase
│   ├── functions/               # Edge Functions (Deno)
│   │   ├── auth/                # 6 funciones de autenticación
│   │   ├── notifications/       # send-push, broadcast-push
│   │   ├── beta-signup/
│   │   └── _shared/             # cors.ts, whatsapp.ts
│   ├── migrations/              # 25 archivos SQL (abr–jun 2026)
│   └── config.toml
│
├── landing/                     # Landing page (proyecto separado)
├── design/                      # Handoff de diseño / Figma
├── docs/                        # Documentación técnica
├── files/                       # Documentos internos
└── graphify-out/                # Grafo de conocimiento del proyecto
```

---

## 2. DEPENDENCIAS CRÍTICAS Y VERSIONES

### Producción (Frontend)

| Paquete | Versión | Criticidad | Riesgo |
|---------|---------|-----------|--------|
| `react` + `react-dom` | 19.2.4 | Alta | React 19 aún tiene breaking changes recientes; revisar compatibilidad con librerías de terceros |
| `@supabase/supabase-js` | 2.101.1 | Alta | Núcleo del stack; actualizaciones pueden romper auth + RLS |
| `typescript` | 6.0.2 | Alta | Versión reciente; posibles incompatibilidades con plugins legacy |
| `vite` | 8.0.4 | Media-Alta | Build tool; cambios de config entre versiones mayores |
| `@tanstack/react-query` | 5.96.2 | Media-Alta | Maneja todo el data fetching; migración v4→v5 ya hecha |
| `zustand` | 5.0.12 | Media | State management; API estable |
| `zod` | 4.3.6 | Media | Validación; v4 tiene cambios de API vs v3 |
| `@capacitor/core` | 8.3.4 | Alta | Bridges nativos; actualizaciones requieren rebuild Android/iOS |
| `tailwindcss` | 3.4.19 | Media | Tailwind v4 rompe config; NO actualizar sin plan de migración |
| `@sentry/react` | 8.0.0 | Baja | Error tracking; actualizable sin riesgo |

### Backend (Supabase)

| Componente | Versión/Config | Notas |
|-----------|---------------|-------|
| PostgreSQL | 15 | Gestionado por Supabase Cloud |
| Supabase CLI | ^2.98.2 | Dev tooling |
| Deno Runtime | `oneshot` (config.toml) | Edge Functions |
| JWT Expiry | 1 hora | Refresh token rotation: ON |
| Max file upload | 50 MiB | Storage |
| Max query rows | 1,000 | API limit |

---

## 3. DEUDA TÉCNICA

### 3.1 Archivos Demasiado Grandes

Estos archivos tienen más de 700 líneas y deben dividirse:

| Archivo | Líneas | Problema |
|---------|--------|---------|
| [lib/database.types.ts](ziteo-frontend/src/lib/database.types.ts) | 2,384 | Auto-generado; no editar manualmente — regenerar con CLI |
| [features/vendedor/VendedorApp.tsx](ziteo-frontend/src/features/vendedor/VendedorApp.tsx) | 2,370 | Monolito de UI — mezcla tabs, lógica de negocio y estado |
| [features/ocasion/components/OcasionScreen.tsx](ziteo-frontend/src/features/ocasion/components/OcasionScreen.tsx) | 1,157 | UI + lógica mezcladas; difícil testear |
| [features/tienda/components/TiendaScreen.tsx](ziteo-frontend/src/features/tienda/components/TiendaScreen.tsx) | 1,111 | Catálogo + carrito + checkout en un archivo |
| [features/maestro/components/MaestroPublicProfile.tsx](ziteo-frontend/src/features/maestro/components/MaestroPublicProfile.tsx) | 1,066 | Perfil público con lógica embebida |
| [features/perfil/components/PerfilScreen.tsx](ziteo-frontend/src/features/perfil/components/PerfilScreen.tsx) | 828 | Settings mezclados con perfil |
| [features/constructor/ConstructorTiendaTab.tsx](ziteo-frontend/src/features/constructor/ConstructorTiendaTab.tsx) | 737 | Checkout logic embebida en tab |
| [features/transportista/components/TransportistaScreen.tsx](ziteo-frontend/src/features/transportista/components/TransportistaScreen.tsx) | 734 | Screen única con múltiples sub-vistas |

**Recomendación:** Extraer hooks (`useXxxData`, `useXxxActions`) y subcomponentes (`XxxCard`, `XxxList`) para reducir cada archivo a <300 líneas.

### 3.2 Uso de `any` — Pérdida de Type Safety

18 archivos usan `as any` como workaround de limitaciones del cliente Supabase:

- [features/contratar/hooks/useMaestros.ts](ziteo-frontend/src/features/contratar/hooks/useMaestros.ts) — `supabase as any` para queries avanzadas
- [features/licitaciones/hooks/useLicitaciones.ts](ziteo-frontend/src/features/licitaciones/hooks/useLicitaciones.ts) — cast en broadcast RPC
- [features/maestro/hooks/useHabilidades.ts](ziteo-frontend/src/features/maestro/hooks/useHabilidades.ts) — upsert con conflict handling
- [features/ocasion/hooks/useOcasion.ts](ziteo-frontend/src/features/ocasion/hooks/useOcasion.ts) — queries de productos e imágenes
- `features/proveedor/components/*` — casting de datos de cotización

**Recomendación:** Usar generics tipados de `supabase-js` (`from<MyTable>('tabla')`) o helper types intermedios.

### 3.3 Manejo de Errores Inconsistente

#### Patrones problemáticos identificados:

**A. Fire-and-forget sin retry** — push notifications asíncrono sin garantías:
```typescript
// useOrders.ts
supabase.functions.invoke('notifications/send-push', {...})
  .catch((err) => console.warn('[send-push] failed:', err))
// Si falla: proveedor nunca se entera del pedido
```

**B. State antes de DB confirmation** — posible race condition:
```typescript
// AvatarMenu.tsx
supabase.from('profiles').update({ active_role: role })
  .then(({ error }) => { if (error) console.error(...) })
// Estado UI cambia ANTES de confirmar que DB actualizó
```

**C. Errores silenciados como warnings** — pérdida de datos potencial:
```typescript
// useOrders.ts
if (cargoErr) console.warn('[placeOrder] cargo_type patch failed:', cargoErr.message)
// cargo_type queda NULL sin que el usuario sepa
```

### 3.4 Deuda de Esquema (Schema Drift)

Columnas que existen en producción pero **no están en las migraciones**:
- `orders.cargo_type`
- `orders.delivery_address`
- `orders.dropoff_coordinates`

Esto rompe reproducibilidad del entorno local y onboarding de nuevos devs.

### 3.5 Inconsistencias de Arquitectura

| Área | Problema |
|------|---------|
| **Routing** | Sin React Router — navegación por Zustand state. Difícil de hacer deep-link y SEO. |
| **Auth Email sintético** | Se construye email como `phone@ziteoo.bo` en cliente — lógica debería estar 100% en edge function. |
| **VendedorApp.tsx monolito** | 2,370 líneas mezclando `Proveedor` y `Vendedor` como si fueran el mismo rol. |
| **Landing separada** | `/landing/index.html` no comparte design system con la app — divergencia visual a largo plazo. |

---

## 4. ANÁLISIS DE COMPLETITUD — FLUJOS DE USUARIO

### 4.1 Flujo de Autenticación

```
Splash → Welcome → [Register | Login]
         ↓                ↓
    Phone + PIN      Phone + PIN
         ↓                ↓
    OTP (6 dígitos)  OTP (6 dígitos)
         ↓                ↓
    OAuth (opcional)  Auth OK
         ↓
    Onboarding Wizard
         ↓
    App (tab por rol)
```

| Sub-flujo | Estado | Notas |
|-----------|--------|-------|
| Registro con teléfono + PIN | ✅ Implementado | v20 Edge Function |
| OTP WhatsApp (6 dígitos) | ✅ Implementado | `_shared/whatsapp.ts` |
| Login con PIN | ✅ Implementado | `auth/login` Edge Function |
| OAuth Google | ✅ Implementado | `auth/oauth-setup` |
| OAuth Apple | ✅ Implementado | `auth/oauth-setup` |
| Biometric login (huella/face) | ✅ Implementado | Capacitor plugin |
| Reset de PIN | ✅ Implementado | `auth/reset-pin` |
| Registro con teléfono existente | ✅ Implementado (fix 2026-06-26) | Muestra mensaje útil |
| Onboarding por rol | ✅ Implementado | Wizards para cada rol |
| Agregar segundo rol | ✅ Implementado | `auth/add-role` |

### 4.2 Flujo Constructor

| Sub-flujo | Estado | Notas |
|-----------|--------|-------|
| Dashboard / KPIs | ✅ Implementado | Datos reales conectados |
| Tienda — catálogo | ✅ Implementado | TiendaScreen 1,111 líneas |
| Tienda — carrito | ✅ Implementado | Estado local + React Query |
| Tienda — checkout (crear pedido) | ✅ Implementado | RPC `place_order()` atómico |
| Checkout — captura dirección entrega | ❌ **FALTA** | **BLOQUEANTE** — `delivery_address` siempre NULL |
| Checkout — pago QR | ✅ Implementado | Genera QR de confirmación |
| Mis pedidos — tracking | ✅ Implementado | Estados con timestamps |
| Proyectos — CRUD | ✅ Implementado | ConstructorProyectosTab 684 líneas |
| Contratar maestros | ✅ Implementado | Búsqueda + solicitud |
| Licitaciones — publicar | ✅ Implementado | |
| Solicitar transporte/flete | ✅ Implementado | |
| Notificaciones push | ⚠️ Parcial | Recepción OK; envío fire-and-forget |

### 4.3 Flujo Proveedor / Vendedor

| Sub-flujo | Estado | Notas |
|-----------|--------|-------|
| Dashboard / KPIs | ✅ Implementado | Datos reales conectados |
| Inventario — CRUD productos | ✅ Implementado | Con imágenes (Storage) |
| Gestión de pedidos entrantes | ✅ Implementado | Cambio de estado |
| Cotizaciones — recibir y responder | ✅ Implementado | |
| Ofertas / promociones | ✅ Implementado | |
| Responder licitaciones | ✅ Implementado | |
| Perfil público | ✅ Implementado | VendedorPublicProfile 762 líneas |
| Onboarding wizard | ✅ Implementado | ProveedorOnboardingWizard 697 líneas |
| Recibir notificación de nuevo pedido | ⚠️ Parcial | Push fire-and-forget; puede perderse |
| Panel de pagos / facturación | ❌ **FALTA** | No hay pantalla de cobros/historial de pagos reales |

### 4.4 Flujo Maestro (Trabajador Calificado)

| Sub-flujo | Estado | Notas |
|-----------|--------|-------|
| Perfil público | ✅ Implementado | MaestroPublicProfile 1,066 líneas |
| Onboarding | ✅ Implementado | MaestroOnboardingWizard 709 líneas |
| Búsqueda de maestros (desde Constructor) | ✅ Implementado | |
| Recibir solicitudes de contratación | ⚠️ Parcial | Existe en DB; UI limitada |
| Dashboard propio del Maestro | ❌ **FALTA** | No hay tab/home dedicado para el rol |
| Gestión de trabajos activos | ❌ **FALTA** | |
| Historial de contrataciones | ❌ **FALTA** | |

### 4.5 Flujo Chofer / Transportista

| Sub-flujo | Estado | Notas |
|-----------|--------|-------|
| Ver viajes disponibles | ✅ Implementado | |
| Aceptar/rechazar viaje | ✅ Implementado | |
| Tracking de entrega | ✅ Implementado | Con geolocalización |
| Historial de viajes | ✅ Implementado | |
| Billetera / ganancias | ✅ Implementado | |
| Onboarding | ✅ Implementado | |
| Verificación de identidad (KYC) | ❌ **FALTA** | |
| Calificación post-viaje | ❌ **FALTA** | DB tiene tabla reviews; UI falta |

### 4.6 Flujos Transversales

| Flujo | Estado | Notas |
|-------|--------|-------|
| Sistema de notificaciones in-app | ✅ Implementado | Trigger PostgreSQL → tabla → Realtime |
| Web Push notifications | ⚠️ Parcial | Requiere secrets Meta en Supabase |
| Cambio de rol activo | ✅ Implementado | Multi-rol soportado |
| Perfil / settings usuario | ✅ Implementado | PerfilScreen 828 líneas |
| Cuenta y opciones | ✅ Implementado | CuentaScreen 710 líneas |
| Términos / privacidad | ✅ Implementado | Pantallas legales |
| Sistema de reviews/calificaciones | ⚠️ Parcial | Tabla existe; UI de escritura falta |
| Historial de pagos centralizado | ❌ **FALTA** | |
| Soporte / chat de ayuda | ❌ **FALTA** | Tabla feedback existe; UI falta |
| Búsqueda global (cross-rol) | ❌ **FALTA** | Búsqueda solo dentro de cada sección |

---

## 5. RESUMEN EJECUTIVO

### Fortalezas

- **Arquitectura limpia por dominio** — cada rol en su carpeta; fácil extender sin romper otros.
- **Seguridad de base sólida** — RLS aplicada, Edge Functions con validación de roles, secrets en Supabase Vault.
- **TypeScript estricto** — `strict: true`, tipos auto-generados desde DB, class de errores personalizados.
- **Transacciones atómicas** — `place_order()` RPC garantiza integridad; triggers para notificaciones.
- **PWA + Capacitor** — una sola codebase para web, Android e iOS.

### Prioridades de Deuda Técnica

| Prioridad | Área | Impacto |
|-----------|------|---------|
| 🔴 **P0 — Bloqueante** | Captura de dirección de entrega en checkout | Entregas sin destino → nulas en producción |
| 🔴 **P0 — Bloqueante** | Schema drift (columnas no migradas) | Env local no reproduce producción |
| 🟠 **P1 — Alto** | Validación server-side de cambios de rol | Escalación de privilegios posible |
| 🟠 **P1 — Alto** | Push notifications no garantizadas | Proveedor puede no enterarse de pedidos |
| 🟡 **P2 — Medio** | VendedorApp.tsx monolito (2,370 líneas) | Mantenibilidad, testing difícil |
| 🟡 **P2 — Medio** | 18 archivos con `as any` | Bugs silenciosos en runtime |
| 🟢 **P3 — Bajo** | Dashboard/flujos del rol Maestro incompletos | Feature gap para ese rol |
| 🟢 **P3 — Bajo** | Landing desconectada del design system | Divergencia visual a largo plazo |

### Flujos por Completar (Backlog)

1. **Captura de dirección de entrega** en checkout (Constructor)
2. **Dashboard completo del rol Maestro** (home, trabajos, historial)
3. **Sistema de reviews** — UI para escribir calificaciones post-transacción
4. **Panel de pagos/cobros** para Proveedor
5. **KYC para Chofer** (verificación de identidad)
6. **Búsqueda global** cross-rol
7. **Centro de soporte** (UI para tabla feedback existente)
8. **Historial de pagos** centralizado

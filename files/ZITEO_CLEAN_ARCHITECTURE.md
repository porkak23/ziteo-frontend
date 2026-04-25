# 🏗️ ZITEO Clean Architecture: Estructura de Carpetas

**Versión:** 1.0 MVP  
**Propósito:** Estructura clara y modularizada que reduzca "alucinaciones" de agentes IA  
**Principio:** Organización por features → Fácil para agentes navegar → Menos errores

---

## 📁 Estructura General Recomendada

```
ziteo-mvp/
├── 📋 ROOT DOCUMENTATION
│   ├── README.md
│   ├── CONTRIBUTING.md
│   ├── .github/
│   │   └── workflows/
│   │       ├── ci.yml
│   │       └── deploy.yml
│   └── .gitignore
│
├── 📚 DOCUMENTATION (/docs)
│   ├── README.md (índice)
│   ├── CLAUDE.md ⭐ (reglas de codificación)
│   ├── SPEC.md (especificación técnica)
│   ├── ZITEO_AGENTS.md (agentes especializados)
│   ├── ZITEO_SKILLS.md (habilidades modularizadas)
│   ├── ZITEO_DATABASE_SCHEMA_COMPLETO.md
│   ├── ZITEO_API_SPEC_COMPLETO.md
│   ├── ZITEO_DESIGN_MASTER.md
│   ├── ZITEO_SPRINT_EXECUTION_GUIDE.md
│   ├── ZITEO_MAESTRO_ORQUESTACION.md
│   ├── diseño_completo_de_stitch_.md
│   └── /adr (Architecture Decision Records)
│       ├── ADR-001-supabase-over-firebase.md
│       ├── ADR-002-react-over-vue.md
│       └── ADR-003-tailwind-over-bootstrap.md
│
├── 🔧 AGENT CONFIGURATION (/.agent & /.claude)
│   ├── /.agent
│   │   ├── agent-config.yaml (config de Antigravity)
│   │   ├── skill-manifest.yaml (skills disponibles)
│   │   └── artifact-templates/ (templates para agentes)
│   │       ├── component.template.jsx
│   │       ├── endpoint.template.ts
│   │       └── migration.template.sql
│   │
│   └── /.claude
│       ├── claude-config.yaml (config Claude Code)
│       └── mcp-config.yaml (MCP servers)
│
├── 🎨 FRONTEND (React)
│   └── /frontend
│       ├── package.json
│       ├── vite.config.js
│       ├── tailwind.config.js
│       ├── index.html
│       ├── postcss.config.js
│       │
│       ├── 📁 /src
│       │   ├── App.jsx (root)
│       │   ├── index.css (global styles)
│       │   │
│       │   ├── /core (Capa de dominio/utilidades)
│       │   │   ├── /theme
│       │   │   │   ├── tokens.js (ZITEO colors, fonts, spacing)
│       │   │   │   └── tailwind-config-export.js
│       │   │   ├── /services
│       │   │   │   ├── api-client.js (interceptor + auth)
│       │   │   │   ├── supabase.js (init Supabase)
│       │   │   │   └── auth-service.js
│       │   │   ├── /hooks
│       │   │   │   ├── useAuth.js
│       │   │   │   ├── useFetch.js
│       │   │   │   └── useLocalStorage.js
│       │   │   ├── /utils
│       │   │   │   ├── validators.js
│       │   │   │   ├── formatters.js
│       │   │   │   └── constants.js
│       │   │   └── /types
│       │   │       ├── user.ts
│       │   │       ├── product.ts
│       │   │       └── order.ts
│       │   │
│       │   ├── /features (MODULAR - MÁS IMPORTANTE)
│       │   │   ├── /auth
│       │   │   │   ├── /components
│       │   │   │   │   ├── SplashScreen.jsx
│       │   │   │   │   ├── WelcomeScreen.jsx
│       │   │   │   │   ├── LoginForm.jsx
│       │   │   │   │   ├── RegisterForm.jsx
│       │   │   │   │   ├── RoleSelector.jsx
│       │   │   │   │   └── PINRecovery.jsx
│       │   │   │   ├── /hooks
│       │   │   │   │   └── useAuthFlow.js
│       │   │   │   ├── /store
│       │   │   │   │   └── authStore.js (Zustand)
│       │   │   │   ├── /services
│       │   │   │   │   └── authApi.js
│       │   │   │   └── index.js (exports)
│       │   │   │
│       │   │   ├── /tienda (CONSTRUCTOR - Marketplace)
│       │   │   │   ├── /components
│       │   │   │   │   ├── ProductCard.jsx
│       │   │   │   │   ├── SearchBar.jsx
│       │   │   │   │   ├── FilterModal.jsx
│       │   │   │   │   ├── CarouselSection.jsx
│       │   │   │   │   ├── CartSummary.jsx
│       │   │   │   │   └── CheckoutFlow.jsx
│       │   │   │   ├── /hooks
│       │   │   │   │   └── useTienda.js
│       │   │   │   ├── /store
│       │   │   │   │   ├── tiendaStore.js
│       │   │   │   │   └── cartStore.js ⭐ (SKILL: cart-persistence)
│       │   │   │   ├── /services
│       │   │   │   │   └── tiendaApi.js
│       │   │   │   └── index.js
│       │   │   │
│       │   │   ├── /proyectos (CONSTRUCTOR - Projects)
│       │   │   │   ├── /components
│       │   │   │   │   ├── ProjectList.jsx
│       │   │   │   │   ├── ProjectCard.jsx
│       │   │   │   │   ├── ProjectDetail.jsx
│       │   │   │   │   ├── CreateProjectModal.jsx
│       │   │   │   │   └── MaterialsList.jsx ⭐ (SKILL: project-materials)
│       │   │   │   ├── /store
│       │   │   │   │   └── projectsStore.js
│       │   │   │   ├── /services
│       │   │   │   │   └── projectsApi.js
│       │   │   │   └── index.js
│       │   │   │
│       │   │   ├── /contratar (CONSTRUCTOR - Hire Maestros)
│       │   │   │   ├── /components
│       │   │   │   │   ├── MaestroSearch.jsx
│       │   │   │   │   ├── MaestroCard.jsx
│       │   │   │   │   ├── MaestroDetail.jsx
│       │   │   │   │   ├── CreateContractModal.jsx
│       │   │   │   │   └── ContractHistory.jsx
│       │   │   │   ├── /store
│       │   │   │   │   └── contractsStore.js
│       │   │   │   ├── /services
│       │   │   │   │   └── contractsApi.js
│       │   │   │   └── index.js
│       │   │   │
│       │   │   ├── /proveedor (PROVIDER - Dashboard)
│       │   │   │   ├── /components
│       │   │   │   │   ├── OrderCard.jsx
│       │   │   │   │   ├── TimerVisual.jsx
│       │   │   │   │   ├── ProductUpload.jsx
│       │   │   │   │   ├── InventoryTab.jsx
│       │   │   │   │   └── IntelTab.jsx
│       │   │   │   ├── /store
│       │   │   │   │   └── providerStore.js
│       │   │   │   ├── /services
│       │   │   │   │   └── providerApi.js
│       │   │   │   └── index.js
│       │   │   │
│       │   │   ├── /maestro (MAESTRO/WORKER - Profile + Contracts)
│       │   │   │   ├── /components
│       │   │   │   │   ├── ProfileCard.jsx
│       │   │   │   │   ├── SpecialtiesSelect.jsx
│       │   │   │   │   ├── ContractsList.jsx
│       │   │   │   │   ├── ContractDetail.jsx
│       │   │   │   │   └── RatingsTab.jsx
│       │   │   │   ├── /store
│       │   │   │   │   └── maestroStore.js
│       │   │   │   ├── /services
│       │   │   │   │   └── maestroApi.js
│       │   │   │   └── index.js
│       │   │   │
│       │   │   └── /shared (Componentes compartidos)
│       │   │       ├── /components
│       │   │       │   ├── BottomNav.jsx ⭐ PERSISTENT
│       │   │       │   ├── Header.jsx
│       │   │       │   ├── Modal.jsx
│       │   │       │   ├── Card.jsx
│       │   │       │   ├── Button.jsx
│       │   │       │   ├── Badge.jsx
│       │   │       │   ├── Input.jsx
│       │   │       │   └── Notifications.jsx
│       │   │       └── index.js
│       │   │
│       │   ├── /layouts
│       │   │   ├── MainLayout.jsx (con BottomNav)
│       │   │   ├── AuthLayout.jsx
│       │   │   └── ProviderLayout.jsx
│       │   │
│       │   ├── /pages
│       │   │   ├── HomePage.jsx (redirige a rol)
│       │   │   ├── NotFoundPage.jsx
│       │   │   └── ErrorBoundary.jsx
│       │   │
│       │   └── /store (Global)
│       │       └── useGlobalStore.js (user, auth state)
│       │
│       └── /tests
│           ├── unit/
│           │   ├── components/
│           │   ├── hooks/
│           │   └── services/
│           ├── integration/
│           │   └── flows/
│           └── e2e/
│               └── cypress/
│
├── 🔌 BACKEND (Supabase Edge Functions)
│   └── /backend
│       ├── supabase/
│       │   ├── config.toml
│       │   ├── .env.example
│       │   │
│       │   ├── /migrations (SQL)
│       │   │   ├── 001_initial_schema.sql ⭐ (from DB_SCHEMA)
│       │   │   ├── 002_rls_policies.sql
│       │   │   ├── 003_indexes.sql
│       │   │   ├── 004_triggers.sql
│       │   │   └── [new migrations numbered]
│       │   │
│       │   ├── /functions (Deno/TypeScript Edge Functions)
│       │   │   ├── /auth
│       │   │   │   ├── register.ts
│       │   │   │   ├── login.ts
│       │   │   │   ├── verify-otp.ts
│       │   │   │   ├── refresh-token.ts
│       │   │   │   └── logout.ts
│       │   │   │
│       │   │   ├── /tienda
│       │   │   │   ├── list-productos.ts
│       │   │   │   ├── get-producto.ts
│       │   │   │   ├── search-productos.ts
│       │   │   │   └── filter-productos.ts
│       │   │   │
│       │   │   ├── /cart
│       │   │   │   ├── get-cart.ts
│       │   │   │   ├── add-to-cart.ts
│       │   │   │   ├── update-cart-item.ts
│       │   │   │   ├── remove-from-cart.ts
│       │   │   │   └── checkout.ts ⭐ (SKILL: cart-persistence)
│       │   │   │
│       │   │   ├── /proyectos
│       │   │   │   ├── list-proyectos.ts
│       │   │   │   ├── create-proyecto.ts
│       │   │   │   ├── get-proyecto.ts
│       │   │   │   ├── update-proyecto.ts
│       │   │   │   ├── delete-proyecto.ts
│       │   │   │   ├── add-material.ts ⭐ (SKILL: project-materials)
│       │   │   │   ├── list-materiales.ts
│       │   │   │   └── delete-material.ts
│       │   │   │
│       │   │   ├── /orders
│       │   │   │   ├── create-order.ts
│       │   │   │   ├── list-orders.ts
│       │   │   │   ├── get-order.ts
│       │   │   │   └── update-order-status.ts
│       │   │   │
│       │   │   ├── /contratos
│       │   │   │   ├── create-contract.ts
│       │   │   │   ├── list-contracts.ts
│       │   │   │   ├── get-contract.ts
│       │   │   │   ├── update-status.ts
│       │   │   │   └── vetting-checks.ts ⭐ (SKILL: contractor-vetting)
│       │   │   │
│       │   │   ├── /maestros
│       │   │   │   ├── get-profile.ts
│       │   │   │   ├── update-profile.ts
│       │   │   │   ├── list-maestros.ts
│       │   │   │   ├── search-maestros.ts ⭐ (SKILL: material-search)
│       │   │   │   └── get-maestro-detail.ts
│       │   │   │
│       │   │   ├── /proveedor
│       │   │   │   ├── list-productos.ts
│       │   │   │   ├── create-producto.ts
│       │   │   │   ├── update-producto.ts
│       │   │   │   ├── delete-producto.ts
│       │   │   │   ├── upload-via-photo.ts
│       │   │   │   ├── upload-via-voice.ts
│       │   │   │   └── get-stats.ts
│       │   │   │
│       │   │   └── /notifications
│       │   │       ├── get-notifications.ts
│       │   │       ├── mark-as-read.ts
│       │   │       ├── delete-notification.ts
│       │   │       └── send-notification.ts ⭐ (SKILL: notification-system)
│       │   │
│       │   ├── /seed (Data inicial)
│       │   │   ├── seed.sql (categorías, datos de prueba)
│       │   │   └── dev-users.sql
│       │   │
│       │   └── README.md (cómo ejecutar local)
│       │
│       ├── .env.example
│       └── README.md
│
└── 📦 SHARED (Tipos TypeScript compartidos)
    └── /shared
        ├── types/
        │   ├── user.ts
        │   ├── product.ts
        │   ├── order.ts
        │   ├── contract.ts
        │   └── error.ts
        └── constants/
            ├── roles.ts
            └── status.ts
```

---

## 🎯 Principios de Organización

### 1. **Modularización por Features**
```
❌ INCORRECTO:
/components
  ├── ProductCard.jsx
  ├── ProjectList.jsx
  ├── MaestroDetail.jsx
  └── SearchBar.jsx
→ Agentes pierden contexto ("dónde va este componente?")

✅ CORRECTO:
/features
  ├── /tienda
  │   └── /components
  │       ├── ProductCard.jsx
  │       └── SearchBar.jsx
  └── /proyectos
      └── /components
          └── ProjectList.jsx
→ Agentes entienden: "ProductCard es de tienda"
```

### 2. **Separación Clara: Core vs Features**
- **`/core`:** Utilities, hooks genéricos, config global
- **`/features`:** Lógica de negocio, específica por rol/dominio

### 3. **Store (Estado Global) Localizado**
```
/features/tienda
  ├── /store
  │   ├── tiendaStore.js (productos, filtros)
  │   └── cartStore.js (carrito persistente) ⭐
  └── /components
      └── ProductCard.jsx (usa cartStore)

→ Localizar store con sus componentes
→ Más fácil de encontrar para agentes
```

### 4. **Services API Collocado**
```
/features/tienda
  ├── /services
  │   └── tiendaApi.js (GET /tienda/productos)
  └── /hooks
      └── useTienda.js (usa tiendaApi)

→ Services viven donde se usan
→ Cambiar endpoint → buscar en feature, no en /core
```

### 5. **Types TypeScript Centralizados (Shared)**
```
/shared/types
  ├── user.ts (Usuario, Rol)
  ├── product.ts (Producto, SKU)
  ├── order.ts (Orden, LineItem)
  └── contract.ts (Contrato, Licitación)

→ Importar: import { Product } from '@/shared/types'
→ No duplicar tipos entre features
```

---

## 🔐 Archivos & Carpetas Locked (No cambiar sin SPEC)

| Ruta | Razón | Cambiar |
|------|-------|---------|
| `tailwind.config.js` | ZITEO tokens | NUNCA (sin ADR) |
| `/core/theme/tokens.js` | Colores/tipografía | NUNCA |
| `/features/[rol]/` | Estructura por rol | NUNCA (sin SPEC) |
| `/backend/migrations/` | Schema | Agregar, no borrar |
| `CLAUDE.md` | Reglas de código | NUNCA (sin arquitecto) |
| `SPEC.md` | Contrato | NUNCA (sin ADR) |

---

## 🔄 Onboarding de Agentes

### Paso 1: Leer arquitectura
```
Agent reads: ZITEO_CLEAN_ARCHITECTURE.md
→ Entiende: "Voy a trabajar en /features/tienda"
```

### Paso 2: Localizar feature
```
Agent navigates to: /frontend/src/features/tienda
→ Encuentra: components/, services/, store/
```

### Paso 3: Cargar skills relevantes
```
Trigger: "Implementa carrito"
→ Load: ZITEO_SKILLS.md → cart-persistence skill
```

### Paso 4: Validar con CLAUDE.md
```
Before coding:
- ✅ Colores = tokens?
- ✅ Icons = Material Symbols?
- ✅ Estructura = clean arch?
```

---

## 🧪 Estructura de Tests

```
/tests
├── /unit
│   ├── /components (test por componente)
│   │   ├── ProductCard.test.jsx
│   │   ├── SearchBar.test.jsx
│   │   └── CartSummary.test.jsx
│   ├── /hooks
│   │   └── useCartStore.test.js
│   └── /services
│       ├── tiendaApi.test.js
│       └── authApi.test.js
│
├── /integration
│   ├── /flows
│   │   ├── checkout-flow.test.js (comprar → pagar)
│   │   ├── project-materials-flow.test.js
│   │   └── contract-acceptance-flow.test.js
│
└── /e2e (Cypress)
    ├── auth.cy.js
    ├── tienda.cy.js
    └── maestro-hire.cy.js
```

---

## 📐 Naming Conventions

| Qué | Patrón | Ejemplo |
|-----|--------|---------|
| Component | PascalCase.jsx | ProductCard.jsx |
| Store (Zustand) | camelCase.js | cartStore.js |
| Hook | useXxx.js | useCartStore.js |
| Service/API | camelCaseApi.js | tiendaApi.js |
| Utility | camelCase.js | formatters.js |
| Type | PascalCase.ts | Product.ts |
| Constant | UPPER_SNAKE_CASE.ts | ROLES.ts |
| Folder | lowercase | /tienda, /proyectos |

---

## ✅ Pre-commit Validation

Antes de hacer push:

```bash
# 1. Lint & Format
npm run lint
npm run format

# 2. Types check
npm run type-check

# 3. Tests
npm run test

# 4. Design consistency (custom)
npm run lint:design

# 5. Tree structure validate
npm run validate:structure
```

---

## 🚨 Errores Comunes para Evitar

| Error | Causa | Solución |
|-------|-------|----------|
| "Agente crea componente en carpeta incorrecta" | No siguió /features | Validar estructura antes de proponer |
| "Componente duplica lógica de store" | No encontró store localizado | Buscar store en feature primero |
| "Hardcodea color #a43700 en lugar de token" | Ignora claude.md | Revisar CLAUDE.md Regla #2 |
| "Pone todo en /utils en lugar de /core" | Falta separación | Usar /core solo para genérico |
| "API endpoint no coincide con SPEC" | No consultó SPEC.md | Verificar endpoint en SPEC antes |

---

## 🔗 Referencias Rápidas

- **Clean Architecture:** `/docs/CLAUDE.md` (Rule #5)
- **Token Budget:** `/docs/ZITEO_AGENTS.md` (tabla Sprint)
- **Skills asociadas:** `/docs/ZITEO_SKILLS.md`
- **Naming:** Esta sección
- **Testing:** `/backend/README.md` (tests de API)

---

**Esta estructura es el "mapa" para agentes. Si la siguen, construcción = automática y precisa.**

# 🏗️ RECETA DE ARQUITECTURA ZITEO: Construcción Paso-a-Paso

**Versión:** 1.0 Kickoff  
**Propósito:** Receta exacta de cómo armar el proyecto desde cero  
**Público:** Antigravity + Claude Code (ejecutores)

---

## 📐 LA RECETA EN 4 CAPAS

```
┌──────────────────────────────────────┐
│ CAPA 1: PREPARACIÓN (1 día)          │
│ - Repo setup, estructura, docs       │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│ CAPA 2: INFRAESTRUCTURA (1 día)      │
│ - Supabase, database, migrations     │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│ CAPA 3: SCAFFOLD (1-2 días)          │
│ - Componentes base, endpoints base   │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│ CAPA 4: FEATURES (3 semanas)         │
│ - Tienda, Proyectos, Contratos      │
└──────────────────────────────────────┘
```

---

## CAPA 1: PREPARACIÓN (Sprint 0, Día 1)

### 1.1 Crear Repositorio GitHub

```bash
# Crear repo en GitHub (vacío)
# Nombre: ziteo-mvp
# Descripción: "Marketplace de construcción Bolivia"

# Clonar local
git clone https://github.com/tuorganización/ziteo-mvp.git
cd ziteo-mvp

# Crear estructura base
mkdir -p docs .agent .claude

# Copiar documentación (desde /mnt/user-data/outputs/)
cp /ruta/a/outputs/*.md docs/

# Commit inicial
git add .
git commit -m "docs: agregar documentación ZITEO MVP"
git push origin main
```

### 1.2 Crear Estructura de Carpetas

```bash
# Frontend
mkdir -p frontend/src/{core,features,layouts,pages,store,tests}
mkdir -p frontend/src/core/{theme,services,hooks,utils,types}
mkdir -p frontend/src/features/{auth,tienda,proyectos,contratar,proveedor,maestro,shared}

# Backend
mkdir -p backend/supabase/{migrations,functions,seed}
mkdir -p backend/supabase/functions/{auth,tienda,cart,proyectos,orders,contratos,maestros,proveedor,notifications}

# Shared types
mkdir -p shared/types shared/constants

# Config files
touch README.md CONTRIBUTING.md .gitignore
touch frontend/.env.example backend/.env.example
```

### 1.3 Crear Archivos de Configuración Base

**`frontend/package.json`** (estructura):
```json
{
  "name": "ziteo-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.0",
    "react-dom": "^18.0",
    "zustand": "^4.0",
    "@tanstack/react-query": "^5.0"
  },
  "devDependencies": {
    "vite": "^5.0",
    "tailwindcss": "^3.0",
    "@tailwindcss/forms": "^0.5",
    "typescript": "^5.0",
    "eslint": "^8.0"
  }
}
```

**`frontend/vite.config.js`**:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

**`frontend/tailwind.config.js`** (copiar de ZITEO_DESIGN_MASTER.md):
```javascript
// Aquí van los 40+ colores ZITEO (ver ZITEO_DESIGN_MASTER.md)
```

### 1.4 Crear Configuración de Agentes

**`.agent/agent-config.yaml`**:
```yaml
project: ziteo-mvp
environment: development
agencyMode: true

agents:
  - id: architect-lead
    model: claude-opus-4-6
    skills: [database-design, architecture-patterns, security-audit]
    
  - id: frontend-developer-react
    model: claude-sonnet-4-6
    skills: [react-components, tailwind-css, state-management]
    
  - id: backend-api-architect
    model: claude-sonnet-4-6
    skills: [api-design, supabase-functions, rls-policies]

# ... resto de agentes (ver ZITEO_AGENTS.md)
```

**`.claude/claude-config.yaml`**:
```yaml
project: ziteo-mvp
rules:
  - file: docs/claude.md
    priority: critical
  - file: docs/ZITEO_CLEAN_ARCHITECTURE.md
    priority: high
  - file: docs/ZITEO_DESIGN_MASTER.md
    priority: high

artifact-format:
  - .jsx for React components
  - .ts for Edge Functions
  - .sql for migrations
  - .md for documentation
```

### 1.5 Commit Preparación

```bash
git add .
git commit -m "chore: setup carpetas, config base, documentación"
git push origin main
```

---

## CAPA 2: INFRAESTRUCTURA (Sprint 0, Día 2)

### 2.1 Supabase Setup Local

```bash
# Instalar Supabase CLI
brew install supabase/tap/supabase

# Inicializar proyecto
cd backend
supabase init

# Crear .env
cat > .env.local << EOF
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
EOF

# Iniciar Supabase local
supabase start

# Output:
# API URL: http://localhost:54321
# Anon Key: eyJhbGc...
# Service Role Key: eyJhbGc...
```

### 2.2 Database Schema (DDL)

**`backend/supabase/migrations/001_initial_schema.sql`**:

Copiar DDL completo de `ZITEO_DATABASE_SCHEMA_COMPLETO.md`:
- `profiles` table
- `categories` table
- `products` table
- `projects` table
- `project_materials` table
- `cart_items` table
- `orders` table
- `order_items` table
- `maestro_profiles` table
- `contracts` table
- `contract_bids` table (prep)
- `notifications` table
- `project_shares` table (feature flag)
- `vetting_records` table

```sql
-- Ver ZITEO_DATABASE_SCHEMA_COMPLETO.md línea XXX
-- Copiar DDL exacto aquí
```

### 2.3 RLS Policies

**`backend/supabase/migrations/002_rls_policies.sql`**:

Copiar políticas de ZITEO_DATABASE_SCHEMA_COMPLETO.md:
- Per-user profiles
- Public products (lectura)
- User-owned projects
- User-owned cart
- etc.

```sql
-- Ver ZITEO_DATABASE_SCHEMA_COMPLETO.md
-- Copiar RLS exactas aquí
```

### 2.4 Seed Data

**`backend/supabase/seed/seed.sql`**:

```sql
-- Categorías iniciales
INSERT INTO categories (name, slug) VALUES
  ('Materiales Construcción', 'materiales-construccion'),
  ('Herrería', 'herreria'),
  ('Plomería', 'plomeria'),
  ('Electricidad', 'electricidad');

-- Datos de prueba (usuarios, productos)
-- Importante: NO incluir en seed de producción
```

### 2.5 Aplicar Migrations

```bash
# En terminal (backend/)
supabase migration up

# Verificar en Studio (http://localhost:54321)
# Should see:
# - 13 tables
# - RLS policies en cada tabla
# - Foreign keys
# - Triggers (update_updated_at)
```

### 2.6 Commit Infraestructura

```bash
git add backend/supabase/
git commit -m "database: schema, RLS policies, seed data"
git push origin main
```

---

## CAPA 3: SCAFFOLD (Sprint 0, Día 3 + Mitad Día 4)

### 3.1 Frontend Base

**`frontend/src/index.html`**:
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ZITEO - La plataforma que construye Bolivia</title>
  
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet"/>
  
  <!-- Material Symbols -->
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
  
  <!-- Tailwind (via CDN para dev rápido) -->
  <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
  
  <!-- Custom config -->
  <style>
    /* Importar tailwind config custom (colores ZITEO) */
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

**`frontend/src/main.jsx`**:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**`frontend/src/App.jsx`**:
```jsx
export default function App() {
  return (
    <div className="bg-surface text-on-surface">
      <h1 className="font-headline font-extrabold text-6xl">ZITEO</h1>
      <p className="text-on-surface-variant">La plataforma que construye Bolivia</p>
    </div>
  )
}
```

### 3.2 Design Tokens Export

**`frontend/src/core/theme/tokens.js`**:
```javascript
// Exportar TODOS los colores ZITEO de tailwind.config.js
export const colors = {
  primary: '#a43700',
  background: '#f9f9f9',
  // ... 40+ más (ver ZITEO_DESIGN_MASTER.md)
}

export const typography = {
  headline: 'Manrope',
  body: 'Inter',
}

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
}
```

### 3.3 Supabase Client Setup

**`frontend/src/core/services/supabase.js`**:
```javascript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
  },
})
```

### 3.4 Auth Store (Zustand)

**`frontend/src/core/store/authStore.js`**:
```javascript
import create from 'zustand'
import { supabase } from '@/core/services/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  
  login: async (phone, pin) => {
    try {
      // Llamar a API /auth/login
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      })
      const data = await response.json()
      set({ user: data.user, error: null })
    } catch (error) {
      set({ error: error.message })
    }
  },
  
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
```

### 3.5 API Client

**`frontend/src/core/services/api-client.js`**:
```javascript
const API_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token')
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}
```

### 3.6 Backend: Edge Function Template

**`backend/supabase/functions/auth/register.ts`** (scaffold):
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, name, city, pin, role } = await req.json()

    // TODO: Implementar lógica (ver ZITEO_API_SPEC_COMPLETO.md)
    // TODO: Validar inputs
    // TODO: Crear usuario en Supabase Auth
    // TODO: Crear profile en table

    return new Response(
      JSON.stringify({ success: true, user_id: '...' }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
```

### 3.7 Shared Types

**`shared/types/user.ts`**:
```typescript
export type Role = 'constructor' | 'ferretero' | 'maestro' | 'chofer'

export interface User {
  id: string
  phone: string
  name: string
  email?: string
  role: Role
  city: string
  avatar_url?: string
  created_at: string
}
```

**`shared/types/product.ts`**:
```typescript
export interface Product {
  id: string
  title: string
  description?: string
  price: number
  unit: string
  stock: number
  provider_id: string
  category_id: string
  image_url?: string
  specifications?: Record<string, string>
  created_at: string
}
```

### 3.8 Commit Scaffold

```bash
git add frontend/ backend/ shared/
git commit -m "scaffold: base structure, stores, API client, edge functions template"
git push origin main
```

---

## CAPA 4: FEATURES (Sprints 1-4, Semanas 2-5)

### Patrón de Features

Para CADA feature (Tienda, Proyectos, Contratos, etc.):

**1. Backend (Edge Functions)**
```
/backend/supabase/functions/[feature]/
├── endpoint1.ts
├── endpoint2.ts
└── README.md (documenta endpoints)

Pasos:
a) Definir inputs/outputs (ver ZITEO_API_SPEC_COMPLETO.md)
b) Implementar con validación
c) Agregar RLS checks
d) Crear tests
```

**2. Frontend (Components + Store)**
```
/frontend/src/features/[feature]/
├── /components
│   ├── Component1.jsx
│   └── Component2.jsx
├── /store
│   └── [feature]Store.js
├── /services
│   └── [feature]Api.js
├── /hooks
│   └── use[Feature].js
└── index.js (exports)

Pasos:
a) Crear componentes (copiar de Stitch design)
b) Crear store (Zustand)
c) Crear API service (llamar backend)
d) Conectar con hooks
e) Integrar en layout
```

**3. Tests**
```
/frontend/src/tests/
├── unit/components/[Feature].test.jsx
├── integration/flows/[feature].test.js
└── e2e/[feature].cy.js

Pasos:
a) Unit: cada componente
b) Integration: flujos multi-componente
c) E2E: desde browser del usuario
```

### Feature Execution Template

```
FEATURE: [Tienda / Proyectos / Contratos / etc.]
STATUS: Sprint X
OWNER: Agente [nombre]
PRIORITY: ALTA

CHECKLIST:
☐ Backend: X endpoints listos
☐ Frontend: Y componentes listos
☐ Store/Services: Integración lista
☐ Tests: >80% coverage
☐ Design: tokens aplicados
☐ Security: RLS auditado
☐ Performance: <200ms APIs
☐ Artifact: Code review done
```

---

## 📋 CHECKLIST DE CONSTRUCCIÓN

### Sprint 0 (Día 1-3)

- [ ] **Capa 1: Preparación**
  - [ ] GitHub repo creado
  - [ ] Estructura de carpetas
  - [ ] Documentación copiada
  - [ ] Config de agentes

- [ ] **Capa 2: Infraestructura**
  - [ ] Supabase local running
  - [ ] Migrations 001-002 aplicadas
  - [ ] Seed data loaded
  - [ ] Studio: 13 tables visible

- [ ] **Capa 3: Scaffold**
  - [ ] frontend/src/App.jsx funciona
  - [ ] Supabase client conectado
  - [ ] Auth store creado
  - [ ] 3 Edge Functions templates listos
  - [ ] Shared types definidos

### Sprint 1 (Semana 2)

- [ ] **Auth Feature**
  - [ ] Backend: register, login, verify-otp endpoints
  - [ ] Frontend: SplashScreen, WelcomeScreen, LoginForm, RegisterForm
  - [ ] Store: authStore funcional
  - [ ] Tests: Auth flow E2E

- [ ] **Tienda Feature** (Constructor)
  - [ ] Backend: GET /tienda/productos, search, filter endpoints
  - [ ] Frontend: ProductCard, SearchBar, FilterModal, CarouselSection
  - [ ] Store: tiendaStore + cartStore
  - [ ] Tests: Búsqueda + carrito

### Sprints 2-4: Siguientes Features

(Patrón similar para cada feature)

---

## 🔧 COMANDOS CLAVE

### Setup
```bash
cd ziteo-mvp
npm install (frontend)
supabase start (backend)
```

### Development
```bash
cd frontend && npm run dev    # Vite dev server
cd backend && supabase start  # Local Supabase
```

### Testing
```bash
npm run test             # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # E2E tests (Cypress)
```

### Linting
```bash
npm run lint            # ESLint
npm run type-check      # TypeScript
npm run format          # Prettier
```

### Deployment
```bash
npm run build           # Build frontend
supabase deploy        # Deploy functions (post-MVP)
```

---

## ✅ VERIFICACIÓN POR CAPA

### Capa 1: Preparación ✅
```
cd ziteo-mvp
ls -la
# Debe ver: docs/, .agent/, .claude/, frontend/, backend/, shared/
```

### Capa 2: Infraestructura ✅
```
supabase status
# Output: Supabase running at http://localhost:54321
# Database: 13 tables with RLS
```

### Capa 3: Scaffold ✅
```
npm run dev (frontend)
# Browser: http://localhost:5173
# Debe ver: "ZITEO" + "La plataforma que construye Bolivia"
```

### Capa 4: Features ✅
```
# Verificar cada sprint:
# Sprint 1: Auth flow E2E sin errores
# Sprint 2: Tienda funcional (búsqueda + carrito)
# Sprint 3: Proveedor CRUD
# Sprint 4: Maestro contratos + E2E completo
```

---

## 🎯 RESUMEN DE LA RECETA

```
CAPA 1 (1 día):   Preparación → GitHub + Estructura
CAPA 2 (1 día):   Infraestructura → Supabase + Schema
CAPA 3 (2 días):  Scaffold → Base frontend/backend
CAPA 4 (3 semanas): Features → Tienda, Proyectos, Contratos, Maestro

TOTAL: 5 semanas → MVP Beta listo
```

---

**Sigue esta receta exactamente. Si algo falla, vuelve a la sección de VERIFICACIÓN correspondiente.**

**¿Comenzamos con Sprint 0, Capa 1?** 🚀

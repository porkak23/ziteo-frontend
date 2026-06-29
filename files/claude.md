# 🧑‍💻 Claude Code Rules for ZITEO

**Propósito:** Guía de codificación para Claude Code al construir backend + frontend del MVP ZITEO.

**Versión:** 1.0 MVP  
**Contexto:** Antigravity orquestra, Claude Code ejecuta backend + integración frontend

---

## 🎯 Core Rules (Immutable)

### 1. Estructura HTML exacta desde Stitch

**Regla:** Copiar HTML exacto de `diseño_completo_de_stitch_.md`, NO reformatear.

```
✅ CORRECTO:
<div class="relative h-screen w-full flex flex-col items-center justify-center bg-pattern">
  <div class="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-primary-container rounded-xl">
    <!-- content -->
  </div>
</div>

❌ INCORRECTO (reformateo):
<div class="relative h-screen w-full">
  <div class="flex items-center justify-center w-24 h-24">
    <!-- cambió el layout -->
  </div>
</div>
```

**Por qué:** El diseño está locked. Cambios rompen consistencia y requieren re-validación en Figma.

### 2. Colores: SOLO tokens ZITEO

**Paleta locked** (`tailwind.config.js` del proyecto):

```javascript
colors: {
  "primary": "#a43700",              // Naranja oscuro (orangeDark) — CTAs/botones rellenos
  "primary-container": "#E8733A",    // Naranja brillante (orange) — acento, estados activos, gradiente
  "background": "#f9f9f9",           // Light gray
  "on-primary": "#ffffff",           // Text en primary
  "surface-container-low": "#f3f3f3",
  "outline": "#8f7066",
  // ... 40+ más
}
```
> Fuente de verdad: tokens `Z` del handoff de Claude Design. Gradiente de marca: `linear-gradient(135deg, #E8733A 0%, #A43700 100%)`. El #D94F00 quedó deprecado.

**Regla:** Nunca hardcodear colores. Siempre usar variables Tailwind:
```
✅ CORRECTO: className="bg-primary text-on-primary"
❌ INCORRECTO: className="bg-[#a43700] text-white"
❌ INCORRECTO: style={{ backgroundColor: '#a43700' }}
```

### 3. Tipografía

**Fonts locked** en `fonts.googleapis.com`:
- **Space Grotesk 600/700** → `font-headline` (títulos, bold)
- **Manrope 400–600** → `font-body` / `font-label` (cuerpo, labels)

**Tamaños:**
- Título principal (h1): `text-6xl` (Space Grotesk 700)
- Heading (h2): `text-3xl` (Space Grotesk 700)
- Body: `text-base` (Manrope 400)
- Small: `text-sm` (Manrope 400)

```
✅ CORRECTO:
<h1 class="font-headline font-extrabold text-6xl">ZITEO</h1>
<p class="font-body text-base">Description</p>

❌ INCORRECTO:
<h1 style={{ fontFamily: 'Arial', fontSize: '48px' }}>ZITEO</h1>
```

### 4. Icons: Material Symbols SOLO

**Regla:** Material Symbols, stroke 1.5px, NO emoji.

```html
✅ CORRECTO:
<span class="material-symbols-outlined text-on-primary text-5xl" 
  style="font-variation-settings: 'FILL' 1;">architecture</span>

❌ INCORRECTO:
<span>🏗️</span>  <!-- emoji -->
<img src="custom-icon.svg"/>  <!-- custom -->
```

**Cómo usarlas:**
- Nombre: `material-symbols-outlined`
- Variantes: `FILL`, `wght` (weight), `GRAD` (grade), `opsz` (optical size)
- Enlace: `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined`

### 5. Bottom Navigation (Persistent on all screens)

**Regla:** 3 botones sticky en footer, siempre visibles (excepto modals).

Estructura para cada rol:

**Constructor:**
```html
<nav class="fixed bottom-0 left-0 right-0 border-t border-outline-variant flex justify-around bg-surface">
  <button class="flex-1 py-4 text-center font-label text-sm">
    <span class="material-symbols-outlined">shopping_cart</span> TIENDA
  </button>
  <button class="flex-1 py-4 text-center font-label text-sm border-l border-r border-outline-variant">
    <span class="material-symbols-outlined">folder</span> PROYECTOS
  </button>
  <button class="flex-1 py-4 text-center font-label text-sm">
    <span class="material-symbols-outlined">handshake</span> CONTRATAR
  </button>
</nav>
```

**Proveedor:**
```html
<nav class="fixed bottom-0 left-0 right-0 border-t border-outline-variant flex justify-around bg-surface">
  <button class="flex-1 py-4 text-center font-label text-sm">
    <span class="material-symbols-outlined">receipt_long</span> PEDIDOS
  </button>
  <button class="flex-1 py-4 text-center font-label text-sm border-l border-r border-outline-variant">
    <span class="material-symbols-outlined">inventory_2</span> INVENTARIO
  </button>
  <button class="flex-1 py-4 text-center font-label text-sm">
    <span class="material-symbols-outlined">bar_chart</span> INTEL
  </button>
</nav>
```

**Maestro:**
```html
<nav class="fixed bottom-0 left-0 right-0 border-t border-outline-variant flex justify-around bg-surface">
  <button class="flex-1 py-4 text-center font-label text-sm">
    <span class="material-symbols-outlined">person</span> PERFIL
  </button>
  <button class="flex-1 py-4 text-center font-label text-sm border-l border-r border-outline-variant">
    <span class="material-symbols-outlined">handshake</span> CONTRATOS
  </button>
  <button class="flex-1 py-4 text-center font-label text-sm">
    <span class="material-symbols-outlined">star</span> CALIFICACIONES
  </button>
</nav>
```

### 6. Backend: Supabase Edge Functions (Node.js)

**Estructura:**

```
/supabase
  /functions
    /auth
      register.ts
      login.ts
      verify-otp.ts
    /products
      list.ts
      detail.ts
      search.ts
    /cart
      get.ts
      add.ts
      update.ts
    /orders
      create.ts
      list.ts
      update-status.ts
```

**Patrón REST:**

```typescript
// /supabase/functions/auth/register.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, name, city, pin, role } = await req.json()

    // Validación
    if (!phone || !name || !city || !pin || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Crear en Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      phone: phone,
      password: pin,  // temp, será reemplazado
      email_confirm: true,
    })

    if (authError) throw authError

    // Crear profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        phone,
        name,
        city,
        role,
        pin_hash: pin,  // Hashed en cliente antes de enviar
      })

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ success: true, user_id: user.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 7. Database: PostgreSQL RLS

**Regla:** Todas las tablas con RLS habilitado. Ver `ZITEO_DATABASE_SCHEMA_COMPLETO.md` para DDL exacto.

```sql
-- CORRECTO:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- INCORRECTO (sin RLS):
-- CREATE TABLE profiles (...)  -- sin RLS
```

### 8. Componentes React (Frontend)

**Estructura (Clean Architecture — features-based):**

```
/src
  /features
    /auth
      /components
        SplashScreen.jsx
        WelcomeScreen.jsx
        LoginForm.jsx
        RegisterForm.jsx
      /hooks
      /store
    /tienda
      /components
        ProductCard.jsx
        CartSummary.jsx
      /hooks
      /store
    /proyectos
      /components
        ProjectList.jsx
        ProjectDetail.jsx
      /hooks
      /store
    /proveedor
      /components
      /hooks
      /store
    /maestro
      /components
      /hooks
      /store
    /contratar
      /components
      /hooks
  /shared
    /components
      BottomNav.jsx
      Modal.jsx
    /hooks
    /utils
  /core
    /services   (API clients)
    /theme      (Tailwind tokens)
```

**Regla:** NUNCA crear `/src/components/Auth/` ni estructuras planas. Siempre usar `/src/features/[feature]/components/`.

**Patrón componente:**

```jsx
// src/features/auth/components/SplashScreen.jsx
import React, { useEffect } from 'react'

export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <main className="relative h-screen w-full flex flex-col items-center justify-center bg-pattern">
      {/* HTML exacto de Stitch aquí */}
    </main>
  )
}
```

**Reglas componente:**
- Props bien tipadas (TypeScript preferido)
- Handlers nombrados: `onSubmit`, `onNavigate`, `onComplete`
- State manejado por React (useState) o Context (para global)
- NO custom CSS — solo Tailwind
- Imports: Material Symbols vía CDN en `index.html`

### 9. State Management

**Pequeño:** useState + useContext  
**Mediano:** Zustand (recomendado)  
**NO Redux** (overkill para MVP)

```javascript
// src/features/auth/store/authStore.js
import create from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
```

### 10. Error Handling

**Frontend:**
```jsx
try {
  const response = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Unknown error')
  setProducts(data)
} catch (error) {
  console.error(error)
  setError(error.message)
}
```

**Backend (Deno):**
```typescript
try {
  // operación
} catch (error) {
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}
```

### 11. Rutas API (Supabase Edge Functions)

**Nombrado:**
```
POST   /auth/register         → registerUser
POST   /auth/login            → loginUser
GET    /tienda/productos      → listProducts
POST   /cart/items            → addToCart
POST   /proyectos             → createProject
PATCH  /maestro/perfil        → updateMaestroProfile
```

**Documentar en:** `ZITEO_API_SPEC_COMPLETO.md` (ya exists)

---

## 📦 Dependencias Permitidas (Lock)

**Frontend:**
```json
{
  "react": "^18.0",
  "react-dom": "^18.0",
  "zustand": "^4.0",
  "@tanstack/react-query": "^5.0"
}
```

**Build:**
```json
{
  "vite": "^5.0",
  "tailwindcss": "^3.0",
  "@tailwindcss/forms": "^0.5",
  "typescript": "^5.0"
}
```

**Backend (Deno):** Ya tiene std lib built-in. NO npm packages en edge functions.

---

## 🔐 Seguridad

### Token Handling
```javascript
// ✅ CORRECTO: Token en header
const response = await fetch('/api/cart', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// ❌ INCORRECTO: Token en URL
fetch(`/api/cart?token=${token}`)
```

### No Hardcodear Secrets
```javascript
// ✅ CORRECTO
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// ❌ INCORRECTO
const SUPABASE_URL = "https://project.supabase.co"
```

### CORS
```
Servidor (Supabase): Permitir origen del frontend
Frontend: Siempre usar modo CORS (credenciales: include si JWT)
```

---

## 🎯 Workflow por Sprint

### Sprint 0: Setup
- [ ] Repo structure creado
- [ ] `tailwind.config.js` con ZITEO tokens
- [ ] Supabase local: `supabase start`
- [ ] Migrations aplicadas
- [ ] Primer endpoint funcional

### Sprint 1-2: Constructor MVP
- [ ] Auth endpoints completos (register, login)
- [ ] ProductCard component renderiza
- [ ] Tienda busca y filtra
- [ ] Carrito persiste (DB)
- [ ] Proyectos CRUD

### Sprint 3: Proveedor
- [ ] Proveedor CRUD productos
- [ ] Órdenes list + status update
- [ ] Dashboard stats

### Sprint 4: Maestro + Pulido
- [ ] Maestro perfil + contratos
- [ ] Accept/reject botones
- [ ] 30+ unit tests
- [ ] E2E tests
- [ ] Performance <200ms

---

## ✅ Pre-Commit Checklist

Antes de hacer push:

- [ ] Eslint / TypeScript errors = 0
- [ ] Tailwind colors = solo ZITEO tokens
- [ ] Icons = Material Symbols
- [ ] HTML estructura = exacta (sin reformateo)
- [ ] Bottom nav = presente en todas las pantallas
- [ ] RLS policies = aplicadas en BD
- [ ] Env vars = en `.env.example`
- [ ] Tests = pasar (si Sprint 4+)

---

## 🚨 Common Mistakes

| Error | Solución |
|-------|----------|
| `text-purple-500` color no reconocido | Usar `text-primary`, `text-on-surface`, etc. |
| Icon emoji `🏗️` | Usar `<span class="material-symbols-outlined">...</span>` |
| `<style>` tag custom | Tailwind solo. Si necesitas custom, `@apply` en archivo de estilos |
| Hardcodear `#a43700` | Usar `bg-primary` / `text-primary` |
| Modal esconde bottom nav | Modal debe tener `fixed` + `z-50`, nav se ve detrás |
| Query params con token | Token siempre en header `Authorization: Bearer` |
| RLS error en Supabase | Verificar JWT tiene `user_id` correcto |

---

## 🎓 Referencias

- **Component map:** `files/ZITEO_COMPONENT_INVENTORY.md`
- **API spec:** `files/ZITEO_API_SPEC_COMPLETO.md`
- **DB schema:** `files/ZITEO_DATABASE_SCHEMA_COMPLETO.md`
- **Design tokens:** `files/ZITEO_DESIGN_MASTER.md`
- **Clean Architecture:** `files/ZITEO_CLEAN_ARCHITECTURE.md`

---

**Antigravity:** Si Claude Code se sale del spec, este documento es tu referencia.

**Claude Code:** Sigue estas 11 reglas y no hay confusión. ✅

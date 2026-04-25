# 🎯 ZITEO Skills: Sistema Modularizado de Habilidades

**Versión:** 1.0 MVP  
**Propósito:** Definir 8-10 skills especializadas con revelación progresiva  
**Modelo:** 3 niveles - Metadatos (100 tokens) → Instrucciones → Recursos

---

## 📐 Arquitectura de Skills

```
┌─ NIVEL 1: METADATOS (siempre cargado)
│  └─ Nombre, descripción, triggers, tokens estimados
│     [~100 tokens total]
│
├─ NIVEL 2: INSTRUCCIONES (on-demand, al activar trigger)
│  └─ Paso-a-paso, patrones, ejemplos, checklist
│     [~300-500 tokens por skill]
│
└─ NIVEL 3: RECURSOS (deep dive, si se necesita)
   └─ Referencias legales, especificaciones técnicas, templates
      [~200-1000 tokens, raramente cargados]
```

**Ventaja:** No saturar contexto de IA. Cargar solo lo necesario para tarea actual.

---

## 🎯 8 SKILLS PRINCIPALES PARA ZITEO MVP

### SKILL #1: `cart-persistence`

**NIVEL 1: Metadatos**
```yaml
id: cart-persistence
name: "Carrito Persistente"
description: "Sincronización localStorage ↔ Supabase, sin perder datos"
category: business-logic
models: [sonnet-4-6, opus-4-6]
triggers:
  - "Implementa carrito que persiste en BD"
  - "Usuario recarga app, carrito sigue ahí"
  - "Sincroniza cart_items en paralelo"
tokens_level2: 400
tokens_level3: 600
dependencies: []
when_loaded: Always (Tier 3, Sprint 1)
```

**NIVEL 2: Instrucciones (al triggear)**
```markdown
## Implementación Carrito Persistente

### Patrón Arquitectónico
- localStorage maneja UI state (rápido)
- Supabase cart_items es source of truth
- Sync cada 5s (debounced) ó al checkoutear
- Realtime subscription para cambios en otras tabs

### Base de Datos (verificar ZITEO_DATABASE_SCHEMA_COMPLETO.md)
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id),
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)  -- Un item por producto
);

-- RLS: Solo ver propio carrito
CREATE POLICY "Users view own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);
```

### Frontend (React + Zustand)
```javascript
// store/cartStore.js
import create from 'zustand';
import { syncCartToSupabase } from '@/services/api';

export const useCartStore = create((set, get) => ({
  items: [],
  
  // Cargar desde localStorage al iniciar
  hydrate: () => {
    const stored = localStorage.getItem('cart_items');
    if (stored) set({ items: JSON.parse(stored) });
  },
  
  // Agregar item + sync automático
  addItem: async (productId, quantity) => {
    const newItems = [...get().items, { productId, quantity }];
    set({ items: newItems });
    localStorage.setItem('cart_items', JSON.stringify(newItems));
    
    // Sync async a Supabase
    await syncCartToSupabase(newItems);
  },
  
  // etc...
}));
```

### Backend (Supabase Edge Function)
```typescript
// functions/cart/sync.ts
export async function POST(req: Request) {
  const { items } = await req.json();
  const userId = auth.uid();
  
  // Vaciar carrito anterior
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  
  // Insertar nuevos items
  const result = await supabase
    .from('cart_items')
    .insert(
      items.map(item => ({
        user_id: userId,
        product_id: item.productId,
        quantity: item.quantity,
      }))
    );
  
  return { success: true };
}
```

### Checklist
- [ ] localStorage guarda items
- [ ] Sync cada 5s sin bloquear UI
- [ ] Realtime subscription escucha cambios
- [ ] Borrar carrito al checkout
- [ ] Validar cantidad > 0
- [ ] Handle errores de sync gracefully
```

**NIVEL 3: Recursos**
```
- Documento legal: "Términos de Manejo de Carrito" (si aplica)
- Especificación técnica: ZITEO_API_SPEC_COMPLETO.md → POST /cart/checkout
- Template contrato: pricing agreement con proveedores
```

---

### SKILL #2: `project-materials`

**NIVEL 1: Metadatos**
```yaml
id: project-materials
name: "Gestión de Materiales por Proyecto"
description: "CRUD de materiales en proyectos, validación de stock"
category: business-logic
models: [sonnet-4-6]
triggers:
  - "Usuario agrega material a proyecto"
  - "Sistema valida stock disponible"
  - "Genera lista de compras desde proyecto"
tokens_level2: 350
tokens_level3: 500
dependencies: [cart-persistence]  # Usa carrito para comprar
when_loaded: Sprint 2
```

**NIVEL 2: Instrucciones**
```markdown
## Gestión de Materiales por Proyecto

### Modelo de Datos
```sql
CREATE TABLE project_materials (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  product_id UUID REFERENCES products(id),
  quantity_planned INT,
  quantity_ordered INT DEFAULT 0,
  status TEXT ('planned', 'ordered', 'delivered'),
  notes TEXT
);
```

### Flujo
1. Usuario crea Proyecto
2. Agrega Materiales (especificación técnica)
3. Sistema valida stock en tienda
4. Crea "lista de compras" recomendada
5. Usuario puede agregar directamente al carrito desde proyecto

### Endpoints
- GET /api/proyectos/:id/materiales
- POST /api/proyectos/:id/materiales
- PATCH /api/proyectos/:id/materiales/:mat_id
- DELETE /api/proyectos/:id/materiales/:mat_id
- POST /api/proyectos/:id/materiales/bulk-to-cart

### Validaciones
- Stock disponible en tienda
- Formato especificación técnica
- Cantidad > 0
```

---

### SKILL #3: `contractor-vetting`

**NIVEL 1: Metadatos**
```yaml
id: contractor-vetting
name: "Verificación de Maestros/Contratistas"
description: "Auditoría de licencias, seguros, historial legal"
category: compliance
models: [opus-4-6, sonnet-4-6]  # Necesita razonamiento
triggers:
  - "Nuevo maestro se registra"
  - "Verificar credenciales antes de contrato"
  - "Auditoría periódica de activo"
tokens_level2: 450
tokens_level3: 800
dependencies: []
when_loaded: Sprint 3-4 (Maestro profile)
```

**NIVEL 2: Instrucciones**
```markdown
## Verificación de Maestros/Contratistas

### Checklist De Verificación (MVP)
1. **Identidad**
   - Validar cédula C.I. (Bolivia)
   - Cross-check con base estatal

2. **Licencias**
   - Verificar licencia profesional activa
   - Especialidad coincide (HVAC, electricidad, plomería, etc.)

3. **Seguros**
   - Responsabilidad civil vigente
   - Cobertura mínima: $50K USD

4. **Historial Legal**
   - Buscar disputas públicas
   - Antecedentes penales (si aplica)

5. **Ratings & Reviews**
   - Promedio de calificaciones
   - Número de proyectos completados
   - Reseñas de clientes

### Base de Datos
```sql
CREATE TABLE maestro_vetting (
  id UUID PRIMARY KEY,
  maestro_id UUID REFERENCES maestro_profiles(id),
  verified_at TIMESTAMP,
  verified_by UUID (admin/auditor),
  license_valid BOOLEAN,
  insurance_valid BOOLEAN,
  legal_clear BOOLEAN,
  notes TEXT,
  status TEXT ('pending', 'verified', 'flagged', 'rejected')
);
```

### Validación Automática (MCP Servers - Post-MVP)
- Consultar bases de datos públicas (Bolivia)
- Validar certificados digitales
- Cross-reference seguros

### En MVP
- Form manual
- Checkboxes de verificación
- Admin dashboard para gestionar

### Artifact Expected
- Vetting report (PDF)
- Checklist completado
- Screenshots de validación
```

---

### SKILL #4: `material-search-filtering`

**NIVEL 1: Metadatos**
```yaml
id: material-search-filtering
name: "Búsqueda y Filtrado de Materiales"
description: "Full-text search, filtros dinámicos, ordenamiento"
category: frontend
models: [sonnet-4-6]
triggers:
  - "Usuario busca 'cemento portland 50kg'"
  - "Aplica filtros: precio, proveedor, ubicación"
  - "Ordena por precio/rating/disponibilidad"
tokens_level2: 300
tokens_level3: 400
dependencies: []
when_loaded: Sprint 1 (Tienda)
```

**NIVEL 2: Instrucciones**
```markdown
## Búsqueda y Filtrado de Materiales

### UI Components
- SearchBar: input + debounce 300ms
- FilterButton: modal con opciones
- SortDropdown: precio ↑↓, rating, disponibilidad

### API Endpoint
GET /api/tienda/productos?
  search=cemento
  category=materiales_construccion
  min_price=100
  max_price=500
  min_rating=4.0
  city=La%20Paz
  sort=price_asc
  limit=20
  offset=0

### Frontend Implementation
- Use React Query (swr/tanstack-query)
- Debounce search 300ms
- Optimistic updates para filtros
- Skeleton loaders mientras carga

### Checklist
- [ ] Search funciona con tilde (á, é, í, ó, ú)
- [ ] Filtros no bloquean UI
- [ ] Paginación con offset
- [ ] Carga imágenes lazily
```

---

### SKILL #5: `api-scaffolding`

**NIVEL 1: Metadatos**
```yaml
id: api-scaffolding
name: "Generación de APIs REST/GraphQL"
description: "Template generation para endpoints, validaciones"
category: backend
models: [sonnet-4-6]
triggers:
  - "Crea CRUD para nueva entidad"
  - "Genera endpoint con validación + RLS"
  - "Crea tipos TypeScript desde schema"
tokens_level2: 400
tokens_level3: 600
dependencies: []
when_loaded: Sprint 1+ (Cualquier endpoint nuevo)
```

**NIVEL 2: Instrucciones**
```markdown
## API Scaffolding para Supabase Edge Functions

### Template Base
```typescript
// functions/[feature]/[action].ts
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
    const { userId } = await req.json()
    
    // TODO: Validación
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // TODO: Lógica
    const supabase = createClient(...)
    
    return new Response(
      JSON.stringify({ success: true, data: ... }),
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

### Validación Schema
- Usar Zod para validar inputs
- Retornar 422 si validación falla
- Log para auditoria

### Checklist
- [ ] Endpoint en ZITEO_API_SPEC_COMPLETO.md
- [ ] Validación con Zod
- [ ] RLS policy en tabla
- [ ] Tests escritos
- [ ] Documentado en OpenAPI spec
```

---

### SKILL #6: `rls-policies`

**NIVEL 1: Metadatos**
```yaml
id: rls-policies
name: "Row Level Security Policies"
description: "Implementar RLS para cada tabla, testear"
category: security
models: [opus-4-6]
triggers:
  - "Crear tabla nueva en Supabase"
  - "Auditar RLS policies existentes"
  - "Permitir compartir proyecto entre usuarios"
tokens_level2: 300
tokens_level3: 500
dependencies: []
when_loaded: Sprint 0+ (Siempre antes de insertar datos)
```

**NIVEL 2: Instrucciones**
```markdown
## Row Level Security Policies

### Principios
1. **Deny by default:** Si no hay política, denegar
2. **Least privilege:** Solo lo necesario
3. **Verificar auth.uid():** Siempre comparar con user_id

### Ejemplo Básico
```sql
-- Tabla: profiles
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### Ejemplo Avanzado (Compartir Proyectos)
```sql
-- Constructor ve sus proyectos O proyectos compartidos
CREATE POLICY "Constructor sees own projects or shared"
  ON projects FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM project_shares
      WHERE project_id = projects.id
        AND shared_with_user_id = auth.uid()
    )
  );
```

### Testear RLS
1. Crear usuario A, usuario B
2. Usuario A inserta en su tabla
3. Usuario B intenta SELECT → DENY ✓
4. Usuario A UPDATE/DELETE → ALLOW ✓

### Checklist
- [ ] Tabla tiene RLS enabled
- [ ] SELECT policy
- [ ] UPDATE policy (si aplica)
- [ ] DELETE policy (si aplica)
- [ ] Test coverage >90%
```

---

### SKILL #7: `notification-system`

**NIVEL 1: Metadatos**
```yaml
id: notification-system
name: "Sistema de Notificaciones"
description: "Notificaciones in-app, email, SMS (post-MVP)"
category: backend
models: [sonnet-4-6]
triggers:
  - "Orden confirmada → notificar proveedor"
  - "Contrato aceptado → notificar maestro"
  - "Licitación cerrada → notificar"
tokens_level2: 350
tokens_level3: 500
dependencies: []
when_loaded: Sprint 2+ (Cuando hay eventos)
```

**NIVEL 2: Instrucciones**
```markdown
## Sistema de Notificaciones MVP

### Tabla
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT ('order', 'contract', 'tender', 'system'),
  title TEXT,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tipos de Notificaciones MVP
| Evento | Trigger | User | Message |
|--------|---------|------|---------|
| Orden confirmada | POST /api/cart/checkout | Proveedor | "Nuevo pedido #456" |
| Contrato aceptado | PATCH /api/maestro/contratos/:id | Maestro | "Contrato aceptado para [proyecto]" |
| Licitación cerrada | Cron job diario | Todos interesados | "Licitación cerrada" |

### Frontend
- Bell icon con badge (cantidad no leídas)
- Notifications page con lista completa
- Marcar como leído (PATCH /api/notificaciones/:id/read)

### Checklist
- [ ] Insert en notifications al evento
- [ ] Frontend muestra badge
- [ ] User puede marcar como leído
- [ ] Email notifications (post-MVP)
```

---

### SKILL #8: `design-consistency`

**NIVEL 1: Metadatos**
```yaml
id: design-consistency
name: "Consistencia de Design Tokens"
description: "Validar colores, tipografía, spacing según ZITEO"
category: frontend
models: [sonnet-4-6]
triggers:
  - "Revisar componente antes de commit"
  - "Validar que use solo tokens ZITEO"
  - "Auditar colores hardcodeados"
tokens_level2: 250
tokens_level3: 300
dependencies: []
when_loaded: Siempre (Cada componente)
```

**NIVEL 2: Instrucciones**
```markdown
## Design Consistency Checker

### Tokens Allowed
- **Colors:** bg-primary, text-on-primary, border-outline, etc.
- **Typography:** font-headline, font-body, text-lg, etc.
- **Spacing:** p-4, m-2, gap-3, etc. (múltiplos de 4px)
- **Border radius:** rounded-lg, rounded-xl, rounded-full

### NOT Allowed
❌ Colores hardcodeados: `bg-[#a43700]`
❌ Custom fonts: `fontFamily: 'Arial'`
❌ Arbitrary values: `p-[23px]`
❌ Emoji icons: `🏗️` (usar Material Symbols)

### Verificación
```bash
# En PR, ejecutar lint
npm run lint:design

# Buscar hardcoded values
grep -r "bg-\[#" src/
grep -r "text-\[" src/
grep -r "fontFamily:" src/
```

### Checklist
- [ ] Colores = tokens Tailwind ZITEO
- [ ] Tipografía = Manrope (800) | Inter (400)
- [ ] Spacing = 4px grid
- [ ] Icons = Material Symbols
- [ ] Responsive = mobile-first (sm/md/lg)
```

---

## 🔄 Cómo Cargar Skills en Antigravity

### Configuración en `.claude/skills.yaml`

```yaml
# .claude/skills.yaml - Archivo que lista skills disponibles
skills:
  - id: cart-persistence
    path: docs/skills/cart-persistence.md
    level1_always: true
    level2_trigger: "carrito|cart|persist"
    
  - id: project-materials
    path: docs/skills/project-materials.md
    level2_trigger: "proyecto|material|compra"
    
  - id: contractor-vetting
    path: docs/skills/contractor-vetting.md
    level2_trigger: "maestro|verificación|vetting"
    
  # ... más skills

# Cómo Antigravity interpreta esto:
# 1. Carga NIVEL 1 (metadatos) siempre → 800 tokens máx
# 2. Al encontrar trigger → carga NIVEL 2 automáticamente
# 3. Si agent pide recurso específico → carga NIVEL 3
```

### Triggers en Acción

```
USER: "Implementa carrito que persista en BD"
     ↓
ANTIGRAVITY: Detecta trigger "carrito"
     ↓
CARGAR: skill cart-persistence NIVEL 2 (400 tokens)
     ↓
AGENT: Implementa con instrucciones + ejemplos
     ↓
ARTIFACT: código listo para revisar
```

---

## 📊 Token Budget por Skill

| Skill | L1 | L2 | L3 | Total | % |
|-------|----|----|----|----|---|
| cart-persistence | 100 | 400 | 600 | 1100 | 13% |
| project-materials | 100 | 350 | 500 | 950 | 11% |
| contractor-vetting | 100 | 450 | 800 | 1350 | 16% |
| material-search | 100 | 300 | 400 | 800 | 9% |
| api-scaffolding | 100 | 400 | 600 | 1100 | 13% |
| rls-policies | 100 | 300 | 500 | 900 | 11% |
| notification-system | 100 | 350 | 500 | 950 | 11% |
| design-consistency | 100 | 250 | 300 | 650 | 8% |
| | | | | **8700** | **100%** |

---

## 🚨 Reglas al Usar Skills

✅ **SIEMPRE:**
- Cargar SKILL correspondiente antes de implementar
- Respetar tokens estimados
- Validar artifact con checklist de skill

❌ **NUNCA:**
- Inventar patrones que no están en skill
- Ignorar validaciones checklist
- Saltarse security/vetting skills

---

**Las skills son el "manual de procedimientos" para agentes. Actualiza según aprendizajes en sprints.**

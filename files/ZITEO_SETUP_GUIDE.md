# 🚀 ZITEO MVP Setup & File Locator

**Propósito:** Guía única de dónde está QUÉ y cómo todo conecta.

**Estado:** Todos los archivos están listos. Antiquravity puede kickoff ahora.

---

## 📁 Estructura de Archivos

### En `/mnt/project/` (Archivos YA EXISTENTES)

Estos son tus **archivos de referencia** que NO cambiaremos, pero adaptaremos:

```
/mnt/project/
├── diseño_completo_de_stitch_.md         ✅ (8406 líneas)
│   └─ SOURCE OF TRUTH para UI components
│   └─ Usado por: Stitch (generar) + Claude Code (extraer HTML)
│
├── ZITEO_COMPONENT_INVENTORY.md          ✅
│   └─ Mapeo exacto: qué línea = qué componente
│   └─ Usado por: Claude Code (saber dónde copiar)
│
├── ZITEO_MULTI_AGENT_PLAN.md             ✅
│   └─ Plan original multi-agente (hecho antes de cambios)
│   └─ Parcialmente actualizado a MVP eficiente
│
├── ZITEO_AUDIT_MVP.md                    ✅
│   └─ Auditoría de qué está completo
│
├── ZITEO_DECISION_LOG.md                 ✅
│   └─ Historial de decisiones
│
├── ZITEO_KICKOFF_EJECUTIVO.md            ✅
│   └─ Resumen ejecutivo original
│
├── Ziteo_v1_docx.pdf                     📄 (master doc WORD)
│   └─ Documento funcional v1.3 (PDF)
│
└── CLAUDE_INVESTIGACION.pdf              📄 (research)
```

---

## 📁 En `/home/claude/outputs/` (Nuevos - Generados HOY)

**Estos 8 archivos son LOS QUE ACABAMOS DE CREAR para el MVP eficiente:**

```
/mnt/user-data/outputs/
├── ZITEO_MAESTRO_ORQUESTACION.md
│   ├─ Visión estratégica 5 semanas
│   ├─ Decisiones confirmadas
│   ├─ Arquitectura (Antigravity + Claude Code + Stitch)
│   ├─ 3 fases principales (Constructor → Proveedor → Maestro)
│   └─ Para: Antigravity (lectura día 1)
│
├── ZITEO_DATABASE_SCHEMA_COMPLETO.md
│   ├─ 13 tablas (profiles, products, projects, orders, maestros, contracts, notifications, etc.)
│   ├─ DDL SQL exacto
│   ├─ RLS policies para cada tabla
│   ├─ Triggers, funciones
│   └─ Para: Claude Code (leer antes de Sprint 0)
│
├── ZITEO_API_SPEC_COMPLETO.md
│   ├─ 40+ endpoints especificados
│   ├─ Payload / Response exactos (JSON)
│   ├─ HTTP status codes
│   ├─ Validaciones
│   └─ Para: Claude Code (leer para cada endpoint)
│
├── ZITEO_SPRINT_EXECUTION_GUIDE.md
│   ├─ Sprint 0: Setup (Antigravity)
│   ├─ Sprint 1-2: Constructor MVP (Claude Code + Stitch)
│   ├─ Sprint 3: Proveedor (Claude Code + Stitch)
│   ├─ Sprint 4: Maestro + Pulido (Claude Code + Stitch)
│   ├─ Tareas granulares por rol
│   └─ Para: Antigravity (lectura antes de cada sprint)
│
├── ZITEO_INDEX_QUICK_REFERENCE.md
│   ├─ Entrada única a todos los docs
│   ├─ Por rol: qué leer
│   ├─ Daily workflow
│   ├─ Troubleshooting
│   └─ Para: Todos (bookmark this)
│
├── ZITEO_STITCH_PROMPT_TEMPLATES.md
│   ├─ Prompts estructurados para Google Stitch 2.0
│   ├─ Un template por pantalla (Auth, Tienda, Proyectos, etc.)
│   ├─ Pre-filled variables
│   └─ Para: Stitch (copy-paste para generar UI)
│
├── claude.md
│   ├─ 11 reglas de codificación para Claude Code
│   ├─ Estructura HTML exacta (no reformatear)
│   ├─ Colores: solo tokens ZITEO
│   ├─ Tipografía, spacing, icons
│   ├─ Backend (Supabase Edge Functions)
│   ├─ Seguridad, errores
│   └─ Para: Claude Code (leer día 1, referencia cada sprint)
│
└── ZITEO_DESIGN_MASTER.md ⭐ (NUEVO)
    ├─ Consolidación de tokens (colores, tipografía, spacing)
    ├─ Extraído de diseño_completo_de_stitch_.md
    ├─ Componentes reusables (Card, Button, Form, Modal, etc.)
    ├─ Breakpoints responsive
    ├─ Spacing reference
    ├─ Design QA checklist
    └─ Para: Claude Code + Stitch (referencia visual constante)
```

---

## 🔗 Cómo TODO Conecta

```
ANTIGRAVITY (Orchestrator)
    ↓ Lee:
    ├─ ZITEO_MAESTRO_ORQUESTACION.md (visión)
    ├─ ZITEO_SPRINT_EXECUTION_GUIDE.md (tareas)
    └─ ZITEO_INDEX_QUICK_REFERENCE.md (troubleshooting)
    ↓ Crea tickets en GitHub basado en:
    └─ ZITEO_SPRINT_EXECUTION_GUIDE.md → "Sprint X - Task Y"

CLAUDE CODE (Backend + Integration)
    ↓ Lee:
    ├─ claude.md (11 reglas, READ FIRST)
    ├─ ZITEO_DATABASE_SCHEMA_COMPLETO.md (entiende schema)
    ├─ ZITEO_API_SPEC_COMPLETO.md (entiende endpoints)
    ├─ ZITEO_DESIGN_MASTER.md (entiende UI constraints)
    └─ ZITEO_COMPONENT_INVENTORY.md (dónde copiar HTML)
    ↓ Referencia:
    ├─ /mnt/project/diseño_completo_de_stitch_.md (source of truth UI)
    └─ ZITEO_SPRINT_EXECUTION_GUIDE.md (task específica del sprint)

STITCH (Frontend UI Generation)
    ↓ Lee:
    ├─ ZITEO_DESIGN_MASTER.md (tokens, componentes)
    └─ ZITEO_STITCH_PROMPT_TEMPLATES.md (copy-paste prompts)
    ↓ Referencia:
    └─ /mnt/project/diseño_completo_de_stitch_.md (si prompts ambiguos)

TODOS:
    ↓ Refieren:
    └─ ZITEO_INDEX_QUICK_REFERENCE.md (índice, troubleshooting)
```

---

## 🎬 Setup Day-by-Day

### **Día 1: Kickoff (Antigravity)**

1. **Lee esto primero:**
   - `ZITEO_MAESTRO_ORQUESTACION.md` (30 min)
   - `ZITEO_INDEX_QUICK_REFERENCE.md` (15 min)

2. **Crea GitHub repo:**
   ```bash
   git init ziteo-mvp
   mkdir -p docs
   cp /mnt/user-data/outputs/*.md docs/
   cp /mnt/project/diseño_completo_de_stitch_.md docs/
   cp /mnt/project/ZITEO_COMPONENT_INVENTORY.md docs/
   ```

3. **Crea Sprint 0 tickets** (basado en `ZITEO_SPRINT_EXECUTION_GUIDE.md` → "Sprint 0"):
   - GitHub Issue #1: Supabase setup
   - GitHub Issue #2: Repo structure
   - GitHub Issue #3: Stitch design extraction
   - etc.

4. **Asigna a Claude Code + Stitch:**
   - Claude Code: Sprint 0 backend tasks
   - Stitch: Sprint 0 UI screens

### **Días 2-3: Claude Code Setup (Backend)**

1. **Leer obligatorio:**
   - `claude.md` (TODO — immutable rules)
   - `ZITEO_DATABASE_SCHEMA_COMPLETO.md` (understand tables)
   - `ZITEO_API_SPEC_COMPLETO.md` (understand endpoints)

2. **Crea estructura:**
   ```
   ziteo-mvp/
   ├── backend/
   │   ├── supabase/
   │   │   └── migrations/
   │   │       └── 001_initial.sql (← copiar de DB_SCHEMA)
   │   ├── functions/
   │   │   ├── auth/
   │   │   ├── products/
   │   │   ├── cart/
   │   │   └── orders/
   │   ├── .env.example
   │   └── package.json
   └── frontend/
       ├── src/
       │   ├── components/
       │   │   ├── Auth/
       │   │   ├── Store/
       │   │   ├── Projects/
       │   │   ├── Shared/
       │   │   └── [otros]
       │   ├── theme/
       │   │   └── tokens.js (← ZITEO colors, fonts)
       │   └── App.jsx
       └── tailwind.config.js (← ZITEO tokens)
   ```

3. **Supabase local:**
   ```bash
   brew install supabase/tap/supabase
   supabase init
   supabase start
   ```

4. **Deploy migrations:**
   ```bash
   # Copiar DDL de ZITEO_DATABASE_SCHEMA_COMPLETO.md
   # Crear: supabase/migrations/001_initial.sql
   supabase migration up
   ```

### **Días 2-3: Stitch Setup (Frontend)**

1. **Leer obligatorio:**
   - `ZITEO_DESIGN_MASTER.md` (entiende tokens)
   - `ZITEO_STITCH_PROMPT_TEMPLATES.md` (aprende estructura)
   - `/mnt/project/diseño_completo_de_stitch_.md` (referencia)

2. **Generar Sprint 0 screens** con Stitch usando templates

3. **Exportar a React:**
   ```bash
   # Stitch genera: splash.html, welcome.html, login.html
   # Claude Code convierte a: SplashScreen.jsx, WelcomeScreen.jsx, LoginForm.jsx
   ```

### **Semana 1: Sprint 1 Ejecución**

- Antigravity: daily standup 15min
- Claude Code: auth endpoints (register, login)
- Stitch: tienda screens (ProductCard, CartSummary)
- Validación: auth flow end-to-end

---

## 📚 Qué Lee Cada Rol

### Antigravity (30 min lecturaTotal)
```
DÍA 1:
├─ ZITEO_MAESTRO_ORQUESTACION.md (skim decisiones + visión)
├─ ZITEO_SPRINT_EXECUTION_GUIDE.md (lee Sprint 0 completo)
└─ ZITEO_INDEX_QUICK_REFERENCE.md (bookmark)

CADA SPRINT:
├─ ZITEO_SPRINT_EXECUTION_GUIDE.md (lee sección del sprint)
└─ ZITEO_INDEX_QUICK_REFERENCE.md (troubleshooting si blockers)
```

### Claude Code (2 horas lectura total)
```
DÍA 1:
├─ claude.md (READ EVERYTHING — locked rules)
├─ ZITEO_DATABASE_SCHEMA_COMPLETO.md (section "Tablas Principales")
├─ ZITEO_API_SPEC_COMPLETO.md (section del endpoint que va a hacer)
└─ ZITEO_DESIGN_MASTER.md (section "Componentes Reusables")

CADA ENDPOINT:
└─ ZITEO_API_SPEC_COMPLETO.md (section del endpoint específico)

CADA COMPONENTE:
├─ ZITEO_DESIGN_MASTER.md (busca el patrón)
├─ /mnt/project/ZITEO_COMPONENT_INVENTORY.md (encuentra línea en Stitch)
└─ /mnt/project/diseño_completo_de_stitch_.md (copia HTML exacto)
```

### Stitch (1 hora lectura total)
```
DÍA 1:
├─ ZITEO_DESIGN_MASTER.md (tokens, breakpoints, componentes)
├─ ZITEO_STITCH_PROMPT_TEMPLATES.md (structure of prompts)
└─ /mnt/project/diseño_completo_de_stitch_.md (visual reference)

CADA PANTALLA:
└─ ZITEO_STITCH_PROMPT_TEMPLATES.md (usa template correspondiente)
```

---

## 🔄 Workflow Sprint

### 1. Antigravity: Planning (Día 1)
```
1. Lee ZITEO_SPRINT_EXECUTION_GUIDE.md → Sección "Sprint X"
2. Crea GitHub tickets (1 por "Task X.Y")
3. Asigna: Claude Code los "Task X.Y" de backend
4. Asigna: Stitch los "Task X.Y" de "Frontend Screens"
```

### 2. Claude Code / Stitch: Execution (Días 2-8)
```
POR CADA TASK:
1. Lee ZITEO_SPRINT_EXECUTION_GUIDE.md → Tu task específica
2. Referencia documentación (DB_SCHEMA, API_SPEC, DESIGN_MASTER, etc.)
3. Implementa
4. Commit + push
5. Slack: "Task X.Y ready for review"
```

### 3. Antigravity: Validation (Día 9)
```
1. Lee "Validación Antigravity" en ZITEO_SPRINT_EXECUTION_GUIDE.md
2. Test: Full flow (auth → tienda → carrito, etc.)
3. Performance benchmark
4. Aprueba sprint ✅ → Planifica siguiente
```

---

## 🎯 Checklist Primeros 30 Minutos

- [ ] Antigravity: Leer `ZITEO_MAESTRO_ORQUESTACION.md`
- [ ] Antigravity: Leer `ZITEO_SPRINT_EXECUTION_GUIDE.md` (Sprint 0)
- [ ] Claude Code: Leer `claude.md` (TODO)
- [ ] Stitch: Leer `ZITEO_DESIGN_MASTER.md`
- [ ] Todos: Bookmark `ZITEO_INDEX_QUICK_REFERENCE.md`
- [ ] Crear GitHub repo + copiar `/docs` con estos archivos
- [ ] Supabase setup: `supabase init` local

---

## 📞 Si algo no está claro

| Pregunta | Referencia |
|----------|-----------|
| ¿Cuál es el plan general? | `ZITEO_MAESTRO_ORQUESTACION.md` |
| ¿Qué debo hacer HOY? | `ZITEO_SPRINT_EXECUTION_GUIDE.md` (tu sprint) |
| ¿Cómo código esto? | `claude.md` (rules) + relevante (DB/API/DESIGN) |
| ¿Qué color uso? | `ZITEO_DESIGN_MASTER.md` (color palette) |
| ¿Dónde está el HTML? | `/mnt/project/diseño_completo_de_stitch_.md` + `ZITEO_COMPONENT_INVENTORY.md` |
| ¿Cuál es el endpoint? | `ZITEO_API_SPEC_COMPLETO.md` |
| ¿Qué tabla necesito? | `ZITEO_DATABASE_SCHEMA_COMPLETO.md` |
| ¿Me quedé atrapado? | `ZITEO_INDEX_QUICK_REFERENCE.md` → "Common Issues & Fixes" |

---

## ✅ Listo para Kickoff

**Todos los archivos están en `/mnt/user-data/outputs/`**

**Antigravity puede comenzar Sprint 0 YA.**

```bash
# Copy to your repo:
cp -r /mnt/user-data/outputs/*.md /your-repo/docs/
cp /mnt/project/diseño_completo_de_stitch_.md /your-repo/docs/
cp /mnt/project/ZITEO_COMPONENT_INVENTORY.md /your-repo/docs/

# Bookmark:
- ZITEO_INDEX_QUICK_REFERENCE.md (daily reference)
- ZITEO_SPRINT_EXECUTION_GUIDE.md (sprint planning)
- claude.md (Claude Code rules)
```

---

**¿Alguna pregunta sobre la estructura o dónde está algo?** 🚀

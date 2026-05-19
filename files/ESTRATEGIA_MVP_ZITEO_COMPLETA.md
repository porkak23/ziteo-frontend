# 🎯 ESTRATEGIA MVP ZITEO: Documento Maestro

**Versión:** 1.0 Kickoff  
**Fecha:** 2026-04-04  
**Estado:** LISTO PARA IMPLEMENTAR  
**Propósito:** Documento único con toda la estrategia del MVP

---

## 📋 ÍNDICE ESTRATÉGICO

1. **VISIÓN & MISSION**
2. **DECISIONES LOCKED** (no cambiar)
3. **ARQUITECTURA ESTRATÉGICA**
4. **ORQUESTACIÓN AGÉNTICA**
5. **TIMELINE & FASES**
6. **MÉTRICAS DE ÉXITO**

---

## 1️⃣ VISIÓN & MISSION

### Visión Producto
```
ZITEO: "La plataforma que construye Bolivia"

Conectar 4 roles en la industria de construcción:
├─ CONSTRUCTOR (buyer/builder)
├─ FERRETERO (hardware vendor)
├─ MAESTRO (skilled laborer)
└─ CHOFER (logistics - POST-MVP)

En un MVP que permite:
├─ Comprar/alquilar materiales (marketplace)
├─ Gestionar proyectos (project management)
├─ Contratar maestros (professional network)
└─ Notificaciones en tiempo real
```

### Tagline & Pillars
```
"La plataforma que construye Bolivia"

ORDEN · PRECISIÓN · FUTURO
```

### Mercado Target
- **Geografía:** Bolivia (inicio: solo Sucre, Potosí y Santa Cruz; el resto de las ciudades están desactivadas hasta que lleguemos a ellas), LatAm post-MVP
- **Constructor promedio:** 40-60 años, móvil, requiere rapidez
- **Ferretero:** PYME (5-20 empleados), quiere más clientes
- **Maestro:** Especialista independiente, necesita visibilidad
- **Chofer:** Post-MVP (Sprint 5+)

---

## 2️⃣ DECISIONES LOCKED (No cambiar sin ADR)

### Backend Stack
```
✅ SUPABASE (PostgreSQL + Auth + Realtime + Storage)
❌ NO Firebase (pagas por lectura, inflexible)
❌ NO custom NodeJS (overkill para MVP, gasto de toil)

Por qué: BaaS + SQL nativo + RLS + Edge Functions = velocidad MVP
```

### Frontend Stack
```
✅ REACT 18 + VITE + TAILWIND CSS
❌ NO Vue (similar, pero menos comunidad LatAm)
❌ NO Flutter (multiplataforma, pero setup lento)

Por qué: React dominante, Tailwind = velocidad UI, Vite = dev experience
```

### Design Lock
```
✅ LIGHT MODE ONLY (MVP)
✅ TAILWIND TOKENS (no custom CSS)
✅ MATERIAL SYMBOLS (icons)
✅ MANROPE 800 (headlines) + INTER 400 (body)
✅ PRIMARY: #A43700 (brown)

Dark mode → POST-MVP
Custom CSS → NOT ALLOWED
```

### 3 Roles Activos en MVP
```
✅ CONSTRUCTOR (full features)
✅ FERRETERO (full features)
✅ MAESTRO (full features)
❌ CHOFER (disabled, POST-MVP after Sprint 5)

Razón: Chofer agrega complejidad logística. MVP es marketplace + hiring.
```

### Auth MVP
```
✅ PIN + OTP (SMS vía Supabase/Twilio)
✅ Google/Apple SSO
✅ Biométrico (opcional, device-level)
❌ 2FA TOTP (POST-MVP, solo pagos)
❌ OAuth custom (Supabase auth es suficiente)

Razón: Simplicidad. Verificar teléfono = suficiente para MVP.
```

### Pagos
```
✅ NO PAGOS EN MVP
   (Pedidos se crean, estado "pending payment")
❌ Stripe/MercadoPago (POST-MVP, Sprint 5+)

Razón: Agregá complexidad legal, compliance, testing. MVP = marketplace de prueba.
```

### Chat/Mensajería
```
✅ NOTIFICACIONES SIMPLES (in-app bell)
❌ CHAT REAL-TIME (POST-MVP)
❌ Whatsapp integration (POST-MVP)

Razón: MVP es transaccional, no conversacional.
```

### IA
```
✅ NO IA EN MVP
❌ Recomendaciones (POST-MVP)
❌ Análisis de precios (POST-MVP)
❌ BIM parser (POST-MVP)

Razón: Agrega tokens, complejidad. MVP es baseline.
```

### Carrito
```
✅ CARRITO PERSISTENTE (localStorage + Supabase sync)
✅ Único item por producto (no duplicados)
✅ Sincronización cada 5s + realtime subscription
✅ Abandonable (sin checkout = sigue en carrito)

Razón: Usuario vuelve, carrito está. UX > conversión.
```

### Proyectos
```
✅ CRUD BÁSICO (crear, editar, eliminar)
✅ Materiales por proyecto (lista de compras)
✅ Compartir proyecto (arquitectura preparada, feature flag OFF)
❌ Compartir (lógica POST-MVP)

Razón: MVP = personal. Compartir = agrega RLS complexity.
```

### Contratos/Maestros
```
✅ ACCEPT/REJECT botones (simple)
✅ Contador de disponibles (simple UI)
❌ Contra-oferta maestro (schema listo, lógica POST-MVP)
❌ Negociación (too complex)

Razón: MVP = transacciones simples. Negociación = Post-MVP.
```

### Hosting
```
✅ Frontend: VERCEL (free, fast)
✅ Backend: SUPABASE HOSTED (managed)
❌ Cloud Migration (POST-MVP, cuando $$$)
❌ Self-hosted (toil, operacional)

Razón: MVP = minimizar ops, maximizar features.
```

---

## 3️⃣ ARQUITECTURA ESTRATÉGICA

### The Sandwich Workflow (3 Fases)

```
┌─────────────────────────────────────────┐
│ FASE 1: PLANNING (Claude Code)          │
│ ├─ Auditoría de descubrimiento          │
│ ├─ Analizar requisitos                  │
│ ├─ Generar SPEC.md                      │
│ └─ Plan ejecutable aprobado             │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ FASE 2: EXECUTION (Antigravity Agents)  │
│ ├─ Parallelizar tareas (8 agentes)      │
│ ├─ Tier 1: arquitectura                 │
│ ├─ Tier 2: frontend                     │
│ ├─ Tier 3: backend                      │
│ ├─ Tier 4: operaciones                  │
│ └─ Generar artifacts en tiempo real     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ FASE 3: VERIFICATION (Doble Bucle)      │
│ ├─ Antigravity: Ghost Runtime (física)  │
│ │  └─ ¿La app corre sin errores?        │
│ ├─ Claude Code: análisis lógico         │
│ │  └─ ¿Cumple spec? ¿Seguro? ¿Limpio?  │
│ └─ Go/No-Go decision                    │
└─────────────────────────────────────────┘
```

### Clean Architecture en ZITEO

```
/ziteo-mvp
├── /docs (Toda documentación)
│   ├── CLAUDE.md (reglas)
│   ├── SPEC.md (especificación)
│   ├── ZITEO_AGENTS.md (orquestación)
│   ├── ZITEO_SKILLS.md (habilidades)
│   └── [otros MDs]
│
├── /.agent & /.claude (Config de agentes)
│   ├── agent-config.yaml
│   └── skill-manifest.yaml
│
├── /frontend (React + Tailwind)
│   └── /src/features
│       ├── /auth (Splash, Login, Register)
│       ├── /tienda (ProductCard, Cart, Checkout)
│       ├── /proyectos (ProjectCRUD, Materials)
│       ├── /contratar (MaestroSearch, HireFlow)
│       ├── /proveedor (Orders, Inventory, Intel)
│       ├── /maestro (Profile, Contracts, Ratings)
│       └── /shared (BottomNav, Modal, etc)
│
└── /backend (Supabase Edge Functions)
    └── /supabase
        ├── /migrations (SQL schemas)
        ├── /functions
        │   ├── /auth (register, login)
        │   ├── /tienda (list, search, filter)
        │   ├── /cart (sync, checkout)
        │   ├── /proyectos (CRUD + materials)
        │   ├── /contratos (CRUD + vetting)
        │   ├── /maestros (profile, search)
        │   ├── /proveedor (CRUD productos)
        │   └── /notifications (CRUD)
        └── /seed (data inicial)
```

### Orquestación: 8 Agentes + Conductor

```
TIER 1 (Arquitectura):
├─ architect-lead: diseña schema, decisiones
├─ security-auditor: audita auth, pagos, RLS
└─ tech-spec-writer: escribe SPEC.md

TIER 2 (Frontend):
├─ frontend-developer-react: componentes
├─ frontend-integration: hooks, API services
└─ stitch-ui-generator: genera UI

TIER 3 (Backend):
├─ backend-api-architect: endpoints REST
├─ database-migration: SQL migrations
└─ business-logic-engineer: lógica compleja

TIER 4 (Operaciones):
├─ devops-automation: CI/CD, scripts
└─ documentation-specialist: docs

CONDUCTOR (Google Antigravity):
└─ Orquesta paralelo, resuelve dependencies
```

### Skill System (Revelación Progresiva)

```
8 Skills Modularizadas:
├─ cart-persistence (localStorage ↔ Supabase)
├─ project-materials (CRUD materiales)
├─ contractor-vetting (verificación maestros)
├─ material-search-filtering (búsqueda)
├─ api-scaffolding (template endpoints)
├─ rls-policies (security)
├─ notification-system (notificaciones)
└─ design-consistency (tokens validation)

3 Niveles:
├─ Nivel 1: Metadatos (~100 tokens, siempre)
├─ Nivel 2: Instrucciones (~400 tokens, on-demand)
└─ Nivel 3: Recursos (~600 tokens, deep dive)
```

---

## 4️⃣ ORQUESTACIÓN AGÉNTICA

### Modelo de Tokens (500K/sprint)

```
TIER 1: 290K (58%) - Decisiones críticas, razonamiento profundo
TIER 2: 140K (28%) - Ejecución frontend, velocidad
TIER 3: 60K (12%)  - Backend modular, eficiencia
TIER 4: 10K (2%)   - Automatización, documentación
────────────────────────
TOTAL:  500K/sprint
```

### Assignment por Sprint

| Sprint | TIER 1 | TIER 2 | TIER 3 | TIER 4 | Enfoque |
|--------|--------|--------|--------|--------|---------|
| **0** | architect-lead + tech-spec-writer | stitch-ui | database-migration | devops | Setup |
| **1** | security-auditor | frontend-dev + stitch | backend-api | devops | Auth + Tienda |
| **2** | architect (review) | frontend-int + stitch | business-logic | — | Proyectos |
| **3** | security-auditor | frontend-dev | backend-api | — | Proveedor |
| **4** | architect (final) | frontend-int | business-logic | docs | Maestro + QA |

### Doble Bucle de Verificación (Sprint 4+)

```
FASE DE QA (Semana 5):

VERIFICACIÓN FÍSICA (Antigravity):
├─ Ghost Runtime: ¿La app corre?
├─ Flujos end-to-end: ¿Sin errores?
├─ Performance: <2s tienda, <200ms API?
└─ Resultados: screenshots, videos

VERIFICACIÓN LÓGICA (Claude Code):
├─ Security audit: ¿Seguro?
├─ Code quality: ¿Limpio?
├─ Test coverage: >80%?
└─ Compliance: ¿Sigue SPEC?

GO/NO-GO Decision:
├─ Si ambas ✅: Merge a staging
├─ Si una ❌: Refactor requerido
└─ Go-Live: producción
```

---

## 5️⃣ TIMELINE & FASES

### 5 Sprints = 5 Semanas → MVP Beta

```
SPRINT 0 (Semana 1): Setup
├─ Supabase project + GitHub repo
├─ Database migrations
├─ Repo structure (Clean Architecture)
├─ CI/CD setup
└─ Resultado: Infraestructura lista

SPRINT 1 (Semana 2): Constructor MVP (Auth + Tienda)
├─ Auth endpoints (register, login, OTP)
├─ Tienda: ProductCard, SearchBar, FilterModal
├─ Carrito: localStorage + Supabase sync
├─ Checkout: crear órdenes
└─ Resultado: Constructor puede comprar

SPRINT 2 (Semana 3): Proyectos + Integración
├─ Proyectos: CRUD
├─ Materiales por proyecto
├─ Agregar proyecto al carrito
└─ Resultado: Constructor gestiona proyectos

SPRINT 3 (Semana 4): Proveedor Dashboard
├─ PEDIDOS tab: órdenes, timers
├─ INVENTARIO tab: CRUD productos
├─ INTEL tab: placeholder
├─ Stats diarios
└─ Resultado: Ferretero vende

SPRINT 4 (Semana 5): Maestro + QA
├─ Maestro: perfil, especialidades
├─ Contratos: aceptar/rechazar
├─ Buscar maestros + contratar
├─ E2E tests, performance, seguridad
└─ Resultado: MVP completo, beta ready

POST-MVP (Roadmap):
├─ Pagos (Stripe/MercadoPago)
├─ Chat/Mensajería
├─ IA (recomendaciones, BIM)
├─ Chofer/Logística
└─ Dark mode
```

### Hitos Clave

```
DÍA 1:   ✅ Repo setup, estructura, primer agente en marcha
DÍA 3:   ✅ Database + Auth endpoints funcionales
DÍA 7:   ✅ Sprint 1 completo (Constructor compra)
DÍA 14:  ✅ Sprint 2-3 completo (Proyectos + Proveedor)
DÍA 21:  ✅ Sprint 4 comenzó (Maestro)
DÍA 28:  ✅ MVP Beta listo para testing
DÍA 35:  ✅ Fixes + producción
```

---

## 6️⃣ MÉTRICAS DE ÉXITO

### MVP Success Criteria

| Métrica | Target | Verificar |
|---------|--------|-----------|
| **Tiempo** | 5 semanas | Completar todo en timeline |
| **Errores críticos** | 0 en beta | Security audit, E2E tests |
| **Performance** | <2s tienda, <200ms API | Lighthouse + load testing |
| **Test coverage** | >80% backend | Jest + integration tests |
| **Code quality** | 0 lint errors | ESLint + TypeScript |
| **Adopción beta** | 100+ constructores | Signup week 1 beta |
| **Uptime** | 99.9% | Monitoring + alerts |

### Quality Gates (Por Sprint)

```
SPRINT 0: ✅ Setup
├─ Supabase running local
├─ GitHub repo structured
└─ CI/CD pipeline green

SPRINT 1: ✅ Auth + Tienda
├─ Auth flow E2E sin errores
├─ Carrito persiste
├─ 50+ unit tests
└─ Performance <2s

SPRINT 2: ✅ Proyectos
├─ CRUD completo
├─ Carrito ↔ Proyectos sincronizado
├─ 30+ integration tests
└─ No memory leaks

SPRINT 3: ✅ Proveedor
├─ Orders CRUD
├─ Inventory searchable
├─ Stats calculan correctamente
└─ RLS policies auditadas

SPRINT 4: ✅ Maestro + QA
├─ E2E completo (auth → compra → contrato)
├─ Security audit = 0 high/critical
├─ Performance benchmarks met
├─ Documentación completa
└─ Beta ready ✅
```

---

## 7️⃣ PRINCIPIOS DE DESARROLLO

### Spec-Driven Development
```
✅ SIEMPRE: Escribir SPEC.md antes de código
✅ SIEMPRE: Agentes verifican contra SPEC
❌ NUNCA: Código sin especificación
❌ NUNCA: Feature creep no aprobado

Por qué: Evita alucinaciones de IA, claridad total.
```

### Design Lock
```
✅ SIEMPRE: Usar ZITEO tokens (colores, fonts, spacing)
✅ SIEMPRE: Material Symbols para icons
✅ SIEMPRE: Tailwind utilities
❌ NUNCA: Hardcodear colores
❌ NUNCA: Custom CSS/fonts

Por qué: Consistencia visual, reducir bugs UI, token efficiency.
```

### Security First
```
✅ SIEMPRE: RLS policies en cada tabla
✅ SIEMPRE: Auditoría de security-auditor
✅ SIEMPRE: Validaciones en backend
❌ NUNCA: Datos sensibles en cliente
❌ NUNCA: SQL injection risk

Por qué: MVP debe ser defendible, no juguete.
```

### Clean Architecture
```
✅ SIEMPRE: Modular por features
✅ SIEMPRE: Services + Stores localizados
✅ SIEMPRE: Types centralizados
❌ NUNCA: Duplicar lógica
❌ NUNCA: God components

Por qué: Agentes navegan intuitivamente, menos errores.
```

### Artifact-Driven
```
✅ SIEMPRE: Agentes generan artifacts (planes, diagramas, code)
✅ SIEMPRE: Fernando revisa artifacts, da feedback
✅ SIEMPRE: Artifacts documentados
❌ NUNCA: "Trust the logs"
❌ NUNCA: Artifacts sin validación

Por qué: Transparencia, control humano, menos alucinaciones.
```

---

## 📌 RESUMEN EJECUTIVO

**ZITEO MVP en 5 semanas:**

```
ARQUITECTURA: Clean Architecture modular por features
STACK: React + Supabase + Tailwind + Google Stitch
AGENTES: 8 especializados en 4 tiers + Conductor (Antigravity)
WORKFLOW: Sandwich (Plan → Ejecutar → Verificar)
GARANTÍAS: Spec-driven, Design-locked, Security-first, Artifact-driven

ROLES ACTIVOS MVP: Constructor, Ferretero, Maestro
FEATURES MVP: Tienda, Proyectos, Contratación, Notificaciones
FEATURES POST-MVP: Pagos, Chat, IA, Chofer, Dark mode

ÉXITO = Timeline + Quality + Adoption + Uptime
```

---

**Este documento es la brújula estratégica. Todo lo demás (AGENTS.md, SKILLS.md, etc.) son detalles de ejecución.**

**¿Está claro? ¿Listos para arquitectura?** 🚀

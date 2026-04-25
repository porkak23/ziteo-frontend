# 🤖 ZITEO Specialized Agents & Tier Organization

**Versión:** 1.0 MVP  
**Propósito:** Definir agentes especializados para orquestación en Antigravity  
**Arquitectura:** 4 Tiers + 1 Conductor (Orquestador Central)

---

## 🏗️ Modelo Jerárquico de Agentes

```
┌─────────────────────────────────────────────────┐
│      CONDUCTOR (Antigravity Agent Manager)       │
│   Orquestador Central - Gestiona flujo general   │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┼────────────┬───────────┐
    │            │            │           │
 TIER 1      TIER 2       TIER 3      TIER 4
Arquitectura Frontend    Backend     Operaciones
    │            │            │           │
    ▼            ▼            ▼           ▼
  [6]          [3]          [3]          [2]
 agentes     agentes      agentes      agentes
```

---

## 📊 TIER 1: ARQUITECTURA & SEGURIDAD

**Modelo Recomendado:** Claude Opus 4.6 / Gemini 3 Pro  
**Especialización:** Diseño de sistemas, auditoría, decisiones arquitectónicas  
**Intervención:** 5-10% (supervisión humana intensa)

### Agent 1.1: **Architect-Lead**
- **Responsabilidad:** Diseño del schema DB, decisiones arquitectónicas clave
- **Entrada:** Requisitos de negocio, decisiones previas
- **Salida:** SPEC.md actualizado, diagramas C4, ADRs (Architecture Decision Records)
- **Skills:** `database-design`, `architecture-patterns`, `security-audit`
- **Activación Sprint:** 0 (Setup)
- **Token Budget:** 150K por sprint
- **Artifacts:** 
  - C4 Context/Container diagrams
  - Database schema diagrams
  - Security review checklist

```yaml
Agent: architect-lead
Model: claude-opus-4-6
Trigger: "Diseña arquitectura para [feature]"
Skills:
  - database-design (Level 2)
  - architecture-patterns (Level 2)
  - security-audit (Level 1)
Dependencies: None (TIER 1)
OutputFormat: ADR document + Diagram (Mermaid)
```

### Agent 1.2: **Security-Auditor**
- **Responsabilidad:** Auditoría de seguridad (auth, pagos, RLS)
- **Entrada:** Código backend, configuración Auth
- **Salida:** Security checklist, vulnerabilidades identificadas, fixes
- **Skills:** `security-audit`, `rls-policies`, `payment-compliance`
- **Activación Sprint:** 1 (Auth endpoints)
- **Token Budget:** 80K por sprint
- **Artifacts:**
  - Security audit report
  - RLS policy validation
  - OWASP checklist

```yaml
Agent: security-auditor
Model: claude-opus-4-6
Trigger: "Audita seguridad de [componente]"
Skills:
  - security-audit (Level 3)
  - rls-policies (Level 2)
  - payment-compliance (Level 1)
Dependencies: architect-lead
OutputFormat: Security report (markdown)
```

### Agent 1.3: **Tech-Spec-Writer**
- **Responsabilidad:** Escribir y mantener SPEC.md detallado
- **Entrada:** Requisitos de negocio, decisiones de arquitectura
- **Salida:** SPEC.md completo y actualizado
- **Skills:** `spec-writing`, `requirement-analysis`, `documentation`
- **Activación Sprint:** 0 (Setup)
- **Token Budget:** 60K por sprint
- **Artifacts:**
  - SPEC.md (especificación técnica)
  - Requirement matrix
  - Glossario de términos

```yaml
Agent: tech-spec-writer
Model: claude-opus-4-6
Trigger: "Escribe especificación para [feature]"
Skills:
  - spec-writing (Level 3)
  - requirement-analysis (Level 2)
  - documentation (Level 2)
Dependencies: architect-lead
OutputFormat: SPEC.md section
```

---

## 🎨 TIER 2: FRONTEND & MOBILE

**Modelo Recomendado:** Claude Sonnet 4.6 / Gemini 3.1  
**Especialización:** UI/UX, React/Flutter, estado global  
**Intervención:** 20-30% (supervisión moderada)

### Agent 2.1: **Frontend-Developer-React**
- **Responsabilidad:** Implementación UI/React para Constructor + Maestro dashboards
- **Entrada:** Stitch designs (HTML), ZITEO_DESIGN_MASTER.md
- **Salida:** Componentes React reutilizables, integración con Zustand
- **Skills:** `react-components`, `tailwind-css`, `state-management`
- **Activación Sprint:** 1 (Tienda home)
- **Token Budget:** 120K por sprint
- **Artifacts:**
  - React component files
  - Component library preview
  - Storybook snippets

```yaml
Agent: frontend-developer-react
Model: claude-sonnet-4-6
Trigger: "Implementa componente [ProductCard]"
Skills:
  - react-components (Level 3)
  - tailwind-css (Level 3)
  - state-management (Level 2)
  - design-master (Level 2)
Dependencies: architect-lead
OutputFormat: .jsx files + test stubs
Parallelizable: Yes (multiple components)
```

### Agent 2.2: **Frontend-Integration-Specialist**
- **Responsabilidad:** Integración APIs ↔ Frontend, manejo de errores, caché
- **Entrada:** API endpoints (ZITEO_API_SPEC_COMPLETO.md), componentes
- **Salida:** Hooks custom, servicios API, integración Zustand
- **Skills:** `api-integration`, `error-handling`, `caching`
- **Activación Sprint:** 1 (Tienda + APIs)
- **Token Budget:** 100K por sprint
- **Artifacts:**
  - Custom hooks (.js)
  - API service layer
  - Integration tests

```yaml
Agent: frontend-integration-specialist
Model: claude-sonnet-4-6
Trigger: "Integra endpoint [GET /tienda/productos]"
Skills:
  - api-integration (Level 3)
  - error-handling (Level 2)
  - caching (Level 2)
Dependencies: frontend-developer-react
OutputFormat: .js hook files + .test.js
```

### Agent 2.3: **Stitch-UI-Generator**
- **Responsabilidad:** Usar Google Stitch 2.0 para generar pantallas
- **Entrada:** ZITEO_STITCH_PROMPT_TEMPLATES.md, ZITEO_DESIGN_MASTER.md
- **Salida:** HTML componentes usando Stitch, código limpio exportable
- **Skills:** `stitch-prompting`, `ui-design`, `responsive-design`
- **Activación Sprint:** 0 (Auth) - paralelo a React dev
- **Token Budget:** 80K por sprint
- **Artifacts:**
  - Stitch-generated HTML
  - Component screenshots
  - Responsive previews (mobile/tablet/desktop)

```yaml
Agent: stitch-ui-generator
Model: gemini-3-1
Trigger: "Genera pantalla [Splash Screen]"
Skills:
  - stitch-prompting (Level 3)
  - ui-design (Level 2)
  - responsive-design (Level 2)
Dependencies: architect-lead
OutputFormat: .html files + Figma links
Parallelizable: Yes (Sprint 0 screens)
```

---

## 🛠️ TIER 3: BACKEND & DATA

**Modelo Recomendado:** Claude Sonnet 4.6 / Gemini 3.1  
**Especialización:** APIs REST, Supabase, Business Logic  
**Intervención:** 30-40% (supervisión regular)

### Agent 3.1: **Backend-API-Architect**
- **Responsabilidad:** Diseño e implementación de endpoints REST/RLS
- **Entrada:** ZITEO_API_SPEC_COMPLETO.md, schema DB
- **Salida:** Edge Functions Supabase, middleware, validaciones
- **Skills:** `api-design`, `supabase-functions`, `rls-policies`
- **Activación Sprint:** 1 (Auth endpoints)
- **Token Budget:** 120K por sprint
- **Artifacts:**
  - Edge Function .ts files
  - API integration tests
  - Postman collection

```yaml
Agent: backend-api-architect
Model: claude-sonnet-4-6
Trigger: "Crea endpoint [POST /auth/register]"
Skills:
  - api-design (Level 3)
  - supabase-functions (Level 3)
  - rls-policies (Level 2)
Dependencies: architect-lead, security-auditor
OutputFormat: .ts (Edge Functions) + tests
Parallelizable: Yes (different endpoints)
```

### Agent 3.2: **Database-Migration-Specialist**
- **Responsabilidad:** Migraciones SQL, índices, triggers, RLS
- **Entrada:** ZITEO_DATABASE_SCHEMA_COMPLETO.md
- **Salida:** SQL migrations, RLS policies, índices optimizados
- **Skills:** `sql-optimization`, `postgres-migrations`, `rls-design`
- **Activación Sprint:** 0 (Setup)
- **Token Budget:** 70K por sprint
- **Artifacts:**
  - Migration .sql files
  - RLS policy files
  - Index optimization reports

```yaml
Agent: database-migration-specialist
Model: claude-sonnet-4-6
Trigger: "Crea migración para tabla [products]"
Skills:
  - sql-optimization (Level 3)
  - postgres-migrations (Level 3)
  - rls-design (Level 2)
Dependencies: architect-lead
OutputFormat: numbered_migration.sql
Parallelizable: Yes (independent features)
```

### Agent 3.3: **Business-Logic-Engineer**
- **Responsabilidad:** Lógica de carrito, proyectos, contratos, notificaciones
- **Entrada:** Requisitos de negocio, schema DB
- **Salida:** Funciones PostgreSQL, servicios business logic
- **Skills:** `business-logic`, `database-functions`, `event-driven`
- **Activación Sprint:** 2 (Lógica compleja)
- **Token Budget:** 100K por sprint
- **Artifacts:**
  - PL/pgSQL functions
  - Business rule validations
  - Event trigger definitions

```yaml
Agent: business-logic-engineer
Model: claude-sonnet-4-6
Trigger: "Implementa lógica [carrito persistente]"
Skills:
  - business-logic (Level 3)
  - database-functions (Level 2)
  - event-driven (Level 2)
Dependencies: backend-api-architect
OutputFormat: .sql (functions) + tests
```

---

## ⚙️ TIER 4: OPERACIONES & SOPORTE

**Modelo Recomendado:** Claude Haiku 4.5 / Gemini Flash  
**Especialización:** Documentación, scripts, QA, deploys  
**Intervención:** 50-60% (supervisión ligera)

### Agent 4.1: **DevOps-Automation-Engineer**
- **Responsabilidad:** CI/CD, scripts deployment, GitHub Actions, environment setup
- **Entrada:** Arquitectura, código backend/frontend
- **Salida:** GitHub Actions workflows, deployment scripts, monitoring setup
- **Skills:** `github-actions`, `deployment-scripts`, `environment-config`
- **Activación Sprint:** 0 (Setup) + 4 (Deploy)
- **Token Budget:** 50K por sprint
- **Artifacts:**
  - GitHub Actions workflows (.yml)
  - Deployment scripts (.sh)
  - Docker configurations

```yaml
Agent: devops-automation-engineer
Model: claude-haiku-4-5
Trigger: "Configura CI/CD para [staging deploy]"
Skills:
  - github-actions (Level 2)
  - deployment-scripts (Level 2)
  - environment-config (Level 2)
Dependencies: backend-api-architect, frontend-developer-react
OutputFormat: .yml + .sh scripts
```

### Agent 4.2: **Documentation-Specialist**
- **Responsabilidad:** Documentación técnica, README, API docs, runbooks
- **Entrada:** Código, specs, decisiones arquitectónicas
- **Salida:** README.md, API documentation, deployment guides
- **Skills:** `technical-writing`, `api-documentation`, `markdown`
- **Activación Sprint:** 4 (Final docs)
- **Token Budget:** 40K por sprint
- **Artifacts:**
  - README.md
  - API documentation (OpenAPI/Swagger)
  - Deployment runbooks

```yaml
Agent: documentation-specialist
Model: claude-haiku-4-5
Trigger: "Documenta API endpoints para [Tier 3]"
Skills:
  - technical-writing (Level 2)
  - api-documentation (Level 2)
  - markdown (Level 2)
Dependencies: all (trabaja al final)
OutputFormat: .md files
```

---

## 🎯 CONDUCTOR: Orquestador Central

**Modelo:** Claude Opus 4.6  
**Responsabilidad:** Gestionar flujo "Sandwich Workflow"  
**Ubicación:** Google Antigravity Agent Manager

### Sandwich Workflow Phases

```
┌─────────────────────────────────────────────┐
│  PHASE 1: PLANNING (Claude Code)            │
│  - Conductor: Auditoría de descubrimiento   │
│  - Analyzer: Requiere TIER 1 aprobación     │
│  - Output: SPEC.md, plan ejecutable         │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│  PHASE 2: EXECUTION (Antigravity Agents)    │
│  - Conductor: Dispara paralelo TIER 2-3     │
│  - Dependencies: resuelve automáticamente    │
│  - Artifacts: genera en tiempo real          │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│  PHASE 3: VERIFICATION (Doble Bucle)        │
│  - Antigravity: Ghost Runtime (física)      │
│  - Claude Code: Análisis lógico             │
│  - Resultado: Go/No-Go para merge           │
└─────────────────────────────────────────────┘
```

### Responsabilidades del Conductor

```yaml
Conductor:
  Model: claude-opus-4-6
  Location: Antigravity Agent Manager
  
  Capabilities:
    - Launch/monitor parallel agents
    - Manage dependencies (TIER 1 → TIER 2/3 → TIER 4)
    - Generate artifacts dashboard
    - Handle feedback loops
    - Block on security audit failures
    - Route escalations to human

  Decision Rules:
    - IF security-auditor rejects → BLOCK deployment
    - IF architect-lead reopens → RESET sprint
    - IF 3+ TIER 4 failures → PAUSE and request input
    - IF all artifacts pass → GREEN to merge
```

---

## 📋 Agent Assignment by Sprint

| Sprint | TIER 1 | TIER 2 | TIER 3 | TIER 4 | Focus |
|--------|--------|--------|--------|--------|-------|
| **0** | architect-lead + tech-spec-writer | stitch-ui-generator | database-migration-specialist | devops-automation | Setup |
| **1** | security-auditor | frontend-developer-react + stitch | backend-api-architect | devops-automation | Auth + Tienda |
| **2** | architect-lead (review) | frontend-integration + stitch | business-logic-engineer | — | Proyectos |
| **3** | security-auditor | frontend-developer-react | backend-api-architect | — | Proveedor |
| **4** | architect-lead (final review) | frontend-integration | business-logic-engineer | documentation-specialist | Maestro + QA |

---

## 🎮 Como Usar Este Documento

### Para ANTIGRAVITY (Orquestador)
1. Lee la tabla "Agent Assignment by Sprint"
2. Dispara agentes según timeline
3. Monitorea artifacts en Agent Manager
4. Implementa feedback loop

### Para AGENTES (Claude Code / Stitch)
1. Identifica tu TIER y número
2. Lee tu "Responsabilidad" y "Skills"
3. Carga `claude.md` + tus SKILL.md específicas
4. Ejecuta respetando "OutputFormat"

### Para HUMANO (Fernando)
1. Supervisa TIER 1 (arquitectura) de cerca
2. Revisa artifacts de TIER 2-3 diariamente
3. Desbloquea solo si security-auditor aprueba
4. Usa artifacts dashboard para status

---

## 📦 Token Budget por Sprint

**Total disponible:** ~500K tokens/sprint

| TIER | Agentes | Budget | % |
|------|---------|--------|---|
| TIER 1 | 3 | 290K | 58% |
| TIER 2 | 3 | 140K | 28% |
| TIER 3 | 3 | 60K | 12% |
| TIER 4 | 2 | 10K | 2% |

**Principio:** Concentrate racionamiento cognitivo (tokens) en decisiones arquitectónicas (TIER 1), ejecución eficiente (TIER 2-3), automatización (TIER 4).

---

## 🚨 Reglas de Oro

✅ **NUNCA:**
- Saltarse seguridad-auditor
- Escribir código sin architect-lead aprobación
- Desactivar RLS policies
- Mergear sin doble bucle de verificación

✅ **SIEMPRE:**
- Generar artifacts documentados
- Respetar parallelización (evita bloqueos innecesarios)
- Mantener skills modularizadas
- Validar con SPEC.md antes de implementar

---

**Este documento es el mapa de operaciones para Antigravity. Actualiza según feedback en sprints.**

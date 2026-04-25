# ⚡ ZITEO DECISION LOG & ACTION ITEMS
**Fecha**: 31/03/2026 | **Decisiones Finales** | **Status**: READY TO START

---

## 🔴 DECISIONES CRÍTICAS (FINAL)

### 1. MVP SCOPE: DESACTIVAR TRANSPORTISTA
**Decisión**: ❌ NO incluir Chofer/Transportista en Phase 1
**Razón**: Simplificar logística, acelerar time-to-market, iterar después
**Impacto Técnico**:
- Eliminar 553 líneas de código (Dashboard Chofer)
- Constructor va a recoger O proveedor entrega a obra
- Reducir complejidad de datos: NO tracking viajes, NO mapas, NO notificaciones GPS
- **Diferencia**: Order status = pending → confirmed → ready → collected (sin intermediario)

**Decisión Aprobada**: ✅ SI (Usuario confirmó)

---

### 2. ARQUITECTURA: MULTI-AGÉNTICO CON CLAUDE CODE
**Decisión**: Usar Claude Code como orchestrator principal + 4 sub-agents especializados
**Estructura**:
```
Claude Code (Main) 
  ├─ Agent-Frontend (Components + UI)
  ├─ Agent-State (Context/Redux)
  ├─ Agent-Backend (API mocks)
  └─ Agent-QA (Testing)
```

**Herramientas**:
- **Claude Code**: Autonomous coding (refactor Stitch → React)
- **Antigravity**: Deployment orchestration (Vercel + Railway)
- **Figma API**: Design token sync (automático)

**Decisión Aprobada**: ✅ SI

---

### 3. TECH STACK (LOCKED)
| Layer | Tech | Reason |
|-------|------|--------|
| **Frontend** | React 18 + TypeScript | Componentes reutilizables, type-safe |
| **Styling** | Tailwind CSS 3 | Design tokens ya definidos |
| **State** | Context API (recommended) / Redux (optional) | Simple, escalable |
| **Backend** | Node.js + Express | Mocks iniciales, fácil iterar |
| **DB** | MongoDB (future) | Schema flexible, JSON-ready |
| **Deployment** | Vercel (FE) + Railway (BE) | Zero-config, auto-scaling |

**Decisión Aprobada**: ✅ SI

---

### 4. DESIGN TOKENS (NO CAMBIAR)
```
Primary Color:    #A43700 (Manrope)
Background:       #F9F9F9 (Light mode)
Project Center:   #FFF0EB (Accent)
Typography:       Manrope 800 (titles), Inter 400 (body)
Payment Style:    PedidosYa reference
```

**Decisión Aprobada**: ✅ SI (Locked)

---

## 📋 IMMEDIATE ACTION ITEMS (Next 24h)

### NOW (Today - 31/03)
- [ ] **Aprobación Final**: Confirmar decisiones 1-4 arriba ← **WAITING**
- [ ] **Create Repos**:
  - [ ] GitHub: `ziteo-platform` (frontend + backend)
  - [ ] Branch: `main`, `develop`, `feature/*`
- [ ] **Inicializar Claude Code session** con archivos:
  - [ ] Stitch completo: `diseño_completo_de_stitch_.md`
  - [ ] Audit Report: `ZITEO_AUDIT_MVP.md`
  - [ ] Multi-Agent Plan: `ZITEO_MULTI_AGENT_PLAN.md`
  - [ ] Este archivo: `ZITEO_DECISION_LOG.md`

### Tomorrow (1/04)
- [ ] **Phase 1 START: Component Extraction**
  - [ ] Agent-Frontend: Parse Stitch, extract 30+ componentes
  - [ ] Estructura carpetas: `src/components/{Auth,Store,Orders,Contractors,Shared}`
  - [ ] Design tokens: `src/theme/tokens.js`
  - [ ] Storybook setup (optional pero recomendado)

- [ ] **Phase 2 START (parallel): Backend Mocks**
  - [ ] Agent-Backend: Crear mock data estructura
  - [ ] Express routes setup: `/api/{auth,products,orders,contractors}`
  - [ ] Postman collection (para testing manual)

### This Week (1-5/04)
- [ ] **Checkpoint 1 (Day 1-2)**: Components extracción ✓
- [ ] **Checkpoint 2 (Day 2-3)**: State + Backend ✓
- [ ] **Checkpoint 3 (Day 3-4)**: Integración 3 flows ✓
- [ ] **Checkpoint 4 (Day 4)**: Alpha testeable ✓

---

## 🔄 THREE CORE FLOWS (PRODUCTION-READY)

### Flow 1: CONSTRUCTOR COMPRA MATERIALES
```
[Constructor] Login → TIENDA → Search/Carrusel → ProductCard 
→ Agregar Carrito (qty) → Checkout (ubicación obra + teléfono)
→ Confirmación (Order ID) 
→ [Ferretero] PEDIDOS (timer, status pendiente)
→ Ferretero prepara (IA: foto/voz/manual, edita inventario, ajusta precio)
→ Marca "Ready"
→ [Constructor] Ve "Ready", retira en horario
→ Marcado "Collected"
```

**KPIs**: Tiempo checkout <1min, Aceptación tasa compra

---

### Flow 2: FERRETERO GESTIONA PEDIDOS (IA Features)
```
[Ferretero] Login → PEDIDOS → Ver orden pendiente
→ Timer visual gradual (countdown estimado)
→ Tap 3 modos carga IA:
   - 📸 Foto: cámara → reconoce productos automático
   - 🎤 Voz: audio → transcribe cantidad/producto
   - ✍️ Manual: text input tradicional
→ Edita inline (sin modal) quantidades/precios
→ Stats día al tope (ingresos, pedidos)
→ Ajusta precio mercado (1 toque)
→ Post-confirmación: "Solicitar camión" option
→ Marca "Ready"
```

**KPIs**: Tiempo preparación <30min, IA accuracy >85%

---

### Flow 3: CONSTRUCTOR CONTRATA MAESTRO
```
[Constructor] Login → CONTRATAR → Search "electricista, plomería, etc"
→ Filtros: disponibilidad, tarifa máx, rating mín
→ ContractorCard muestra: foto, nombre, rating ⭐, especialidad, $/hora
→ Tap card → Ver detalles completo + historial trabajos
→ Tap "Solicitar" → Modal:
   - Fecha inicio/fin (calendar picker)
   - Descripción trabajo (text area)
   - Presupuesto propuesto (input)
   - Submit
→ [Maestro] Notificación + puede aceptar/rechazar
→ Status: pending → accepted → in-progress → completed
```

**KPIs**: Tasa aceptación solicitudes >70%, tiempo matching <2h

---

## 📊 STITCH DECOMPOSITION QUICK REFERENCE

| Section | Lines | Component Count | Status |
|---------|-------|-----------------|--------|
| **AUTH** | 1-1043 | 6 components | ✅ EXTRACT |
| **STORE** | 1045-4377 | 8 components | ✅ EXTRACT |
| **ORDERS** | 4379-7006 | 8 components | ✅ EXTRACT |
| **CONTRACTORS** | 7563-8405 | 4 components | ✅ EXTRACT |
| **CHOFER** | 7008-7561 | 5 components | ❌ SKIP (MVP) |
| **TOTAL** | 8406 | 26+ components | ✅ 30 tokens saved |

---

## 🎯 QUALITY GATES (Before Deployment)

### Code Quality
- [ ] TypeScript strict mode: 0 errors
- [ ] ESLint: 0 warnings
- [ ] Prettier: auto-format
- [ ] Component coverage: >80% (Storybook)

### Functionality
- [ ] E2E Flow 1 (Buy): ✓ passing
- [ ] E2E Flow 2 (Prepare): ✓ passing
- [ ] E2E Flow 3 (Hire): ✓ passing
- [ ] Error handling: 5+ scenarios tested

### Performance
- [ ] Load time: <2s (Lighthouse score >80)
- [ ] Bundle size: <500KB gzipped
- [ ] Mobile responsive: Pixel-perfect on 375px+
- [ ] Accessibility: WCAG AA compliant

### UX
- [ ] User testing (5+ testers): ✓ passed
- [ ] Feedback loop closed
- [ ] Bugs: <5 critical, <10 minor

---

## 🚀 DEPLOYMENT TIMELINE

### Phase 5.1: Alpha (Internal Testing)
- **When**: End of Day 4 (3/04)
- **Where**: Vercel staging + Railway dev
- **Who**: Internal team only
- **Duration**: 2-3 days

### Phase 5.2: Beta (Limited Launch)
- **When**: ~10/04
- **Who**: 50 Constructor + 20 Ferretero + 10 Maestro
- **Where**: Production (Vercel + Railway)
- **Duration**: 1 week (gathering feedback)

### Phase 5.3: General Availability
- **When**: ~17/04
- **Who**: Public
- **Roadmap Post-Launch**:
  1. Real payment integration (Stripe/PedidosYa)
  2. Transportista re-enablement
  3. Chat integrado Constructor ↔ Ferretero
  4. Analytics + dashboard admin

---

## 💾 FILE REFERENCES

### Documentos Principales
1. **ZITEO_AUDIT_MVP.md** ← Estado actual, decisiones, plan
2. **ZITEO_MULTI_AGENT_PLAN.md** ← Detalles técnicos por agent
3. **ZITEO_DECISION_LOG.md** ← Este archivo (executive summary)

### Recursos Existentes
- **Stitch Completo**: `diseño_completo_de_stitch_.md` (8406 líneas)
- **Figma**: 4D25Fz61d1JrsfsNWf1Ydo (design tokens)
- **Functional Doc**: ZITEO_Funcional_v1.3.docx (contextual)

### Nuevos Artifacts (To Create)
- [ ] Repository: `ziteo-platform`
- [ ] API_MOCKS.md (detailed mock endpoints)
- [ ] COMPONENT_INVENTORY.md (all components mapped)
- [ ] DEPLOYMENT_CHECKLIST.md (pre-launch)

---

## ❓ FAQs / COMMON QUESTIONS

**Q: Por qué desactivar Transportista?**  
A: MVP scope limpio. Transportista añade 553 líneas + complejidad logística (mapas, GPS, notificaciones). Constructor a recoger o proveedor entrega a obra es viable para phase 1. Re-enable después con user feedback.

**Q: ¿React o Vue?**  
A: React 18. Componentes reutilizables, ecosystem, performance.

**Q: ¿Context API o Redux?**  
A: Context API (recomendado, simpler). Redux si necesitas time-travel debugging.

**Q: ¿Cuántos tokens aproximados?**  
A: Arquitectura bien definida = tokens eficientes. ~50-70K tokens por agent por día.

**Q: ¿Timeline realista?**  
A: Alpha en 4 días, beta en 10 días. Agresivo pero posible con multi-agéntico.

---

## ✍️ SIGN-OFF (Approval Required)

- [ ] **Usuario**: Aprueba decisiones 1-4 y action items
- [ ] **Technical Lead**: Aprueba tech stack
- [ ] **PM**: Aprueba timeline
- [ ] **QA**: Aprueba quality gates

---

## 📞 ESCALATION

Si hay bloqueos:
1. **Decisión técnica**: Consulta Technical Lead
2. **Cambio scope**: Consulta PM
3. **Error crítico**: Consulta QA Lead
4. **Token budget**: Optimizar con Claude Code

**Emergency Contact**: [Usuario] (discord/slack/email)

---

**LAST UPDATED**: 31/03/2026 14:45 UTC
**NEXT REVIEW**: 01/04/2026 (After Phase 1 complete)
**STATUS**: 🟢 READY FOR EXECUTION

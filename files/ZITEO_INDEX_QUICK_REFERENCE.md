# 🚀 ZITEO MVP — Quick Reference & Index

**Propósito:** Entrada única a todos los recursos. Antipatrón: leer 4 docs. Patrón: leer este, luego ir a lo específico.

**Estructura:** Pregunta → Documento → Línea

---

## 📍 Primeros 5 minutos

### ¿Cuál es la visión?
→ `ZITEO_MAESTRO_ORQUESTACION.md` Sección: "Visión del MVP en 3 fases"

### ¿Cómo se coordina todo?
→ `ZITEO_MAESTRO_ORQUESTACION.md` Sección: "Arquitectura de Orquestación"

### ¿Por dónde empezamos?
→ `ZITEO_SPRINT_EXECUTION_GUIDE.md` Sección: "Sprint 0"

### ¿Qué necesita Claude Code hacer?
→ `ZITEO_DATABASE_SCHEMA_COMPLETO.md` (DDL) + `ZITEO_API_SPEC_COMPLETO.md` (Endpoints)

### ¿Qué necesita Stitch hacer?
→ `ZITEO_SPRINT_EXECUTION_GUIDE.md` Sección relevante (ej: "Stitch — Frontend Screens")

---

## 🗂️ Documentos Maestros

| Doc | Owner | Propósito | Cuándo leer |
|-----|-------|----------|-----------|
| **ZITEO_MAESTRO_ORQUESTACION.md** | Antigravity | Brújula estratégica 5 semanas | Kick-off del proyecto |
| **ZITEO_DATABASE_SCHEMA_COMPLETO.md** | Claude Code | DDL exacto, RLS, triggers | Sprint 0 (setup) |
| **ZITEO_API_SPEC_COMPLETO.md** | Claude Code | Endpoints exactos, payloads, responses | Sprint 1+ (implementación) |
| **ZITEO_SPRINT_EXECUTION_GUIDE.md** | Antigravity | Tareas granulares por sprint | Cada sprint |
| **ZITEO_DESIGN_MASTER.md** | Stitch + Frontend | Tokens, componentes, breakpoints | Sprint 1+ (UI) |

---

## 🎯 Por Rol

### Antigravity (Orchestrator)

**Tu workflow:**
1. Leer: `ZITEO_MAESTRO_ORQUESTACION.md` (visión completa)
2. Leer: `ZITEO_SPRINT_EXECUTION_GUIDE.md` (tareas por sprint)
3. Crear tickets en GitHub basado en "Task X.Y"
4. Asignar a Claude Code / Stitch
5. Daily standup: "¿en qué estamos de Sprint X?"
6. Validar completitud al final de cada sprint

**Key sections:**
- Decisiones confirmadas → Tabla en MAESTRO_ORQUESTACION
- Sprint breakdown → SPRINT_EXECUTION_GUIDE (cada sección de sprint)
- Checklist pre-launch → SPRINT_EXECUTION_GUIDE (última sección)

---

### Claude Code (Backend Executor)

**Tu workflow:**
1. Leer: `ZITEO_DATABASE_SCHEMA_COMPLETO.md` (entiende schema)
2. Leer: `ZITEO_API_SPEC_COMPLETO.md` (entiende qué construir)
3. Leer: `ZITEO_SPRINT_EXECUTION_GUIDE.md` Sección "Claude Code" del sprint actual
4. Codificar:
   - Migrations (SQL de schema)
   - Express endpoints (según spec)
   - RLS policies (según schema)
5. Test: postman/curl contra endpoints

**Quick reference:**
```
Schema tables:     ZITEO_DATABASE_SCHEMA_COMPLETO.md → "Tablas Principales"
Endpoint:          ZITEO_API_SPEC_COMPLETO.md → [Busca por nombre rol]
Task actual:       ZITEO_SPRINT_EXECUTION_GUIDE.md → "Sprint X - Claude Code"
```

**Línea de comandos rápida:**
```bash
# Setup Supabase
supabase init
supabase start  # local development

# Deploy migrations
supabase migration up

# Test endpoint
curl -X GET "http://localhost:3000/api/tienda/productos" \
  -H "Authorization: Bearer TOKEN"
```

---

### Stitch (UI Generator)

**Tu workflow:**
1. Leer: `ZITEO_DESIGN_MASTER.md` (tokens, componentes)
2. Leer: `ZITEO_SPRINT_EXECUTION_GUIDE.md` Sección "Stitch" del sprint actual
3. Leer: `ZITEO_MAESTRO_ORQUESTACION.md` Sección "Tech Stack" (React + Tailwind)
4. Generar screens con Google Stitch 2.0
5. Entregar HTML/React component

**Quick reference:**
```
Colors:          ZITEO_DESIGN_MASTER.md → "Tailwind Color Palette"
Components:      ZITEO_DESIGN_MASTER.md → "Reusable Components"
Typography:      ZITEO_DESIGN_MASTER.md → "Tipografía"
Breakpoints:     ZITEO_DESIGN_MASTER.md → "Responsive"
Task actual:     ZITEO_SPRINT_EXECUTION_GUIDE.md → "Stitch — Frontend Screens"
```

---

## 🔄 Workflows Diarios

### Daily Standup (15 min)

**Antigravity dice:**
- Tarea completada ayer (ticket #)
- Blockers (si existen)
- Tarea hoy
- Status: On track / At risk / Blocked

**Template:**
```
✅ Completed: [Task X.Y] - [brief description]
❌ Blocker: [issue description, if any]
📝 Today: [Task X.Z] - [brief description]
📊 Status: ON TRACK
```

---

### Sprint Review (Jueves final de sprint)

**Checklist:**
- [ ] Todos los tasks de "Claude Code" completados
- [ ] Todos los tasks de "Stitch" completados
- [ ] Integration test passed (full user flow)
- [ ] Performance benchmarks met
- [ ] Documentation updated

**Validar:**
→ `ZITEO_SPRINT_EXECUTION_GUIDE.md` → "Validación Antigravity" de ese sprint

---

### Issues & Debugging

**Problema:** "RLS policy error en /api/cart"
1. Ver: `ZITEO_DATABASE_SCHEMA_COMPLETO.md` → Busca "cart_items"
2. Sección RLS de esa tabla
3. Verifica JWT token tiene user_id correcto
4. Test en Supabase console

**Problema:** "Endpoint retorna 500"
1. Ver: `ZITEO_API_SPEC_COMPLETO.md` → Busca endpoint
2. Response format esperado
3. Error codes posibles
4. Verifica logs en Supabase Edge Functions

**Problema:** "Screen no renderiza correctamente"
1. Ver: `ZITEO_DESIGN_MASTER.md` → Busca componente
2. Verifica Tailwind tokens usados
3. Breakpoints (mobile 320px, tablet 768px)
4. Compara con Figma file

---

## 🚀 Comandos Rápidos

### Setup local (primeras 15 min)

```bash
# 1. Clone repo
git clone <repo> && cd ziteo-mvp

# 2. Install dependencies
npm install

# 3. Setup Supabase CLI
brew install supabase/tap/supabase  # macOS
# or: https://supabase.com/docs/guides/cli

# 4. Start local Supabase
supabase start

# 5. Create .env
cp .env.example .env
# Update: SUPABASE_URL, SUPABASE_ANON_KEY (from Supabase dashboard)

# 6. Apply migrations
supabase migration up

# 7. Start dev server
npm run dev

# 8. Open http://localhost:3000
```

### Deploy to production

```bash
# 1. Test everything locally
npm test

# 2. Build
npm run build

# 3. Deploy frontend
vercel deploy

# 4. Deploy migrations to Supabase prod
supabase db push --db-url postgres://...

# 5. Verify
curl https://ziteo.app/api/tienda/productos
```

---

## 📊 Métricas de Progreso

### Sprint 1 (Semana 1-2)
```
Target: Auth ✅, Tienda ✅, Carrito ✅
Checkpoints:
- Day 3: DB migrations deployed
- Day 5: Auth endpoints working (Postman test)
- Day 7: Frontend tienda rendering
- Day 10: Full flow tested (register → login → tienda → carrito)
```

### Sprint 2 (Semana 2-3)
```
Target: Proyectos ✅, Materiales ✅, Integración ✅
Checkpoints:
- Day 12: Proyectos CRUD endpoints
- Day 14: Proyectos screens rendering
- Day 17: Materiales endpoints
- Day 21: Full flow tested (tienda → agregar a proyecto)
```

### Sprint 3 (Semana 3-4)
```
Target: Proveedor dashboard ✅
Checkpoints:
- Day 22: Productos endpoints
- Day 24: Órdenes endpoints
- Day 26: Dashboard stats
- Day 28: Full flow tested (constructor compra → proveedor ve orden)
```

### Sprint 4 (Semana 4-5)
```
Target: Maestro ✅, Testing ✅, Pulido ✅
Checkpoints:
- Day 29: Maestro endpoints
- Day 31: Buscar maestros + contratar
- Day 33: Aceptar/rechazar contratos
- Day 35: 30+ unit tests
- Day 35: 15+ E2E tests
```

### Pre-Launch (Semana 6, Día 1)
```
All checkpoints met ✅
Performance benchmarks ✅
Security audit ✅
Beta ready for 5 testers ✅
```

---

## 🔗 Referencias Externas

### Supabase

```
Dashboard:     https://app.supabase.com
Docs:          https://supabase.com/docs
Auth:          https://supabase.com/docs/guides/auth
RLS:           https://supabase.com/docs/guides/auth/row-level-security
Realtime:      https://supabase.com/docs/guides/realtime
Storage:       https://supabase.com/docs/guides/storage
CLI:           https://supabase.com/docs/guides/cli
```

### Frontend

```
React 18:      https://react.dev
Tailwind CSS:  https://tailwindcss.com
Material Symbols: https://fonts.google.com/icons
Vercel:        https://vercel.com/docs
```

### Testing

```
Playwright:    https://playwright.dev/docs/intro
Postman:       https://www.postman.com
Jest:          https://jestjs.io/docs/getting-started
```

---

## 🆘 Common Issues & Fixes

| Issue | Causa | Solución |
|-------|-------|----------|
| "CORS error" | Supabase Storage CORS no configurado | Ver Supabase dashboard → Storage → Settings → CORS |
| "401 Unauthorized" | JWT expirado o inválido | Refrescar token con refresh endpoint |
| "RLS policy violation" | User no tiene acceso a row | Verifica JWT user_id coincide con row owner_id |
| "Image upload fails" | Storage bucket no existe | Crear bucket en Supabase Storage UI |
| "Performance slow" | Sin índices | Agregar índices: ZITEO_DATABASE_SCHEMA_COMPLETO.md → "Índices Avanzados" |
| "Migrations won't apply" | Conflicto de orden | `supabase migration repair` |

---

## 📋 Decisiones Clave (No cambiar)

| Decisión | Razón | Change Risk |
|----------|-------|-------------|
| Supabase (no custom backend) | MVP rápido, BaaS completo | ⚠️ ALTO (rewrite 2 semanas) |
| Carrito persistente (DB) | Constructor puede comprar multi-sesión | ⚠️ ALTO |
| 3 roles activos (no chofer) | MVP scope, complexity reduction | ⚠️ ALTO |
| Diseño locked (no cambios) | Stitch consistency, time saving | 🟢 BAJO (UI only) |
| TOTP/2FA post-MVP | Prioridad: fast MVP, security after | ⚠️ MEDIO |
| Sin chat MVP | Complex: realtime, moderation | ⚠️ ALTO |
| Sin IA MVP | Training data, performance | ⚠️ ALTO |

---

## ✅ Launch Readiness Checklist

**48 horas antes de lanzamiento:**

```
[ ] Backups automáticos habilitados (Supabase)
[ ] Error tracking configurado (Sentry)
[ ] Analytics activado (Mixpanel)
[ ] Load testing completado (100 usuarios)
[ ] Security audit aprobado
[ ] All tests green (>80% coverage)
[ ] Staging identical to production
[ ] Rollback plan documentado
[ ] 5 beta testers listos (1 de cada rol)
[ ] Status page (statuspage.io) configurado
```

---

## 📱 Testing en Real Device

```
iOS:
  1. Build para Simulator: npm run build:ios
  2. Conectar device
  3. Xcode: Product → Run

Android:
  1. Build APK: npm run build:apk
  2. Conectar device: adb devices
  3. Install: adb install -r app.apk
```

---

## 🎓 Learning Path (primeros días)

**Si eres nuevo en el proyecto:**

1. **Día 1:** Lee este INDEX + `ZITEO_MAESTRO_ORQUESTACION.md` (30 min)
2. **Día 1-2:** Lee tu rol específico:
   - Antigravity: `ZITEO_SPRINT_EXECUTION_GUIDE.md`
   - Claude Code: `ZITEO_DATABASE_SCHEMA_COMPLETO.md` + `ZITEO_API_SPEC_COMPLETO.md`
   - Stitch: `ZITEO_DESIGN_MASTER.md`
3. **Día 2:** Setup local (comandos arriba)
4. **Día 3:** Primer task del sprint actual

---

## 🔔 Important Notes

> **No hacer cambios a diseño sin aprobación de Fernando.** El design está locked para MVP velocity.

> **Todos los docs son source of truth.** Si hay discrepancia código ↔ doc, el doc gana. Actualizar ambos.

> **Token efficiency > completitud.** Docs usan referencias (línea numbers) para minimizar repetición.

> **Escalabilidad: preparada, no implementada.** E.g., contra-oferta del Maestro tiene schema preparada pero lógica post-MVP.

---

## 📞 Contacts & Escalation

| Rol | Slack | Hora respuesta |
|-----|-------|---|
| **Fernando** (Product Owner) | @fernando | 1 hora |
| **Antigravity** (Orchestrator) | @antigravity | 30 min |
| **Claude Code** | @claude-code | 15 min |
| **Stitch** | @stitch | 15 min |

---

## 🎯 En una frase

> **ZITEO MVP es un marketplace 5-semanas para Constructores compren materiales, Proveedores vendan, Maestros se contraten. MVP sin IA, sin chat, sin pagos (post-launch). Design locked, Sprint 0-4 ejecutados por Antigravity + Claude Code + Stitch. Lanzamiento beta semana 6.**

---

**Próximo paso:** Antigravity, crea tickets Sprint 0 en GitHub. Claude Code + Stitch, preparen setup. 🚀

**Dudas?** Pregunta en Slack. Este doc siempre versiona en `/docs/INDEX.md`.

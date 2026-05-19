# Ziteo · Plan de refactor contra el handoff de Claude Design

> Origen: `C:\Users\pereira\Downloads\ZITEO-handoff-extracted\ziteo\`
> Objetivo: dejar la app **idéntica al handoff** en estructura visual y de navegación, en **PWA** (sin iOS frame), con **light por defecto + dark mode** en todas las pantallas.

---

## Reglas globales (válidas para los 4 agentes)

1. **NO TOCAR** lo global:
   - `App.tsx` (routing principal y screens de auth)
   - Pantallas de auth (`SplashScreen`, `WelcomeScreen`, `LoginForm`, `RegisterForm`, `OtpVerification`, `OnboardingScreen`, `OAuthProfileSetup`, `ForgotPinScreen`)
   - `AppLayout` (header fijo + nav)
   - `DashHeader.tsx` (header fijo con logo + bell + avatar)
   - Avatar-menu y cualquier flujo de cambio de rol vía avatar
2. **SÍ ELIMINAR** el `RoleIndicator` flotante (chip "← Cambiar rol"). El avatar-menu ya cumple esa función.
3. **No usar `IOSDevice`**. La app es PWA fluida; respetar safe-areas con `env(safe-area-inset-*)`.
4. **Tema**: light default (obra bajo sol). Toda pantalla nueva debe soportar dark mode usando exclusivamente las **CSS vars del DS** (`var(--z-*)`). PROHIBIDO escribir hex literales del handoff (`#E8733A`, `#F8F6F2`, `#1A1A2E`, etc.). Usar `Z.orange`, `Z.bg`, `Z.text`, etc. de `src/shared/design/tokens.ts`.
5. **Roles internos del repo** (mantener nombres en código):
   - `constructor` ↔ handoff `constructor`
   - `proveedor` ↔ handoff `vendedor`
   - `maestro` ↔ handoff `trabajador`
   - `chofer` ↔ handoff `repartidor`
6. **Nav**: cada rol exhibe **4 tabs** según el handoff. Toda ruta adicional pasa a sub-pantalla accesible desde Home/CTA, no desde el nav.
7. **Datos**: no inventar mocks; conectar a los stores/hooks existentes (Supabase). Si una sección no tiene datos aún, usar `EmptyState` consistente, no placeholders del prototipo.
8. **Manrope** ya está cargada vía `index.css`; reusar `Z.font`.
9. **Animaciones**: keep `zFadeSlideIn`, `zFadeIn`, `zPulseGlow`, `driverPulse`, `radarSpin` (declaradas en `index.css`).
10. **Verificación obligatoria por agente**: `npm run typecheck`, `npm run lint`, build PWA, y screenshots manuales light + dark de cada tab en viewport 402x874 y 1024x768.

---

## Pre-trabajo (compartido — se hace ANTES de Fase 1)

Esto lo hace un agente único (no paralelo) y desbloquea a los demás:

- [ ] **Borrar** `RoleIndicator` de `src/shared/design/shell/` y todas sus referencias.
- [ ] Revisar `src/shared/design/components/` y agregar primitivas que faltan respecto al handoff (`ziteo-ui.jsx`):
  - `ZSelect`, `ZPinInput`, `ZOTPInput`, `ZRoleCard`, `ZStepBar`, `ZRoleIcon` — verificar; portar si faltan.
- [ ] Revisar `src/shared/design/shell/` y agregar:
  - `ProductCard`, `WorkerCard`, `ProjectCard`, `BidCard`, `ActivityItem` (desde `ziteo-dash-shell.jsx`).
  - `IconStar`, `IconVerified`.
  - Iconos `NavIconStore/Projects/Bids/Cart/Truck/Users/Plus/Msg` si no existen.
- [ ] Asegurar que cada primitive expone variantes light/dark vía `var(--z-*)`.
- [ ] Tipar todas las primitives (TS) con `interface Props`.
- [ ] Exportar todo desde el `index.ts` correspondiente.

---

## FASE 1 · Roles de demanda (2 agentes en paralelo, worktrees independientes)

### Agente 1A · Constructor

**Handoff de referencia** (leer top-to-bottom antes de tocar código):
- `ZITEO Full App.html` → `ConstructorApp` (líneas 239-285)
- `components/ziteo-dash-home.jsx` → `HomeTab`, `TransportScreen`, `WorkerSearchScreen`, `WorkerProfileScreen`
- `components/ziteo-dash-store.jsx` → `TiendaTab` y carrito
- `components/ziteo-dash-projects.jsx` → `ProyectosTab`, `LicitacionesTab`, `NewProjectForm`

**Tabs finales del constructor** (4): `home`, `tienda`, `proyectos`, `licitaciones`.

**Archivos a reescribir**:
- `src/features/constructor/ConstructorApp.tsx` — host de 4 tabs, sin `IOSDevice`.
- `src/features/constructor/ConstructorHomeTab.tsx` — greeting dinámico, search bar, CTA gradiente "Ir a la Tienda", CTA "Solicitar Transporte", botones `Nuevo Proyecto` / `Contratar Maestros`, `SummaryCard` x3, `ActivityItem` list.
- `src/features/constructor/ConstructorTiendaTab.tsx` — filtros pill bar + grid de `ProductCard`.
- `src/features/constructor/ConstructorProyectosTab.tsx` — list de `ProjectCard` con badges de estado.
- `src/features/constructor/ConstructorLicitacionesTab.tsx` — list de `BidCard`.

**Sub-pantallas** (accesibles desde Home, no del nav):
- `src/features/transporte/components/SolicitarTransporteScreen.tsx` — refactor al diseño `TransportScreen` (tipo cards + map placeholder + textarea + CTA disabled lógico).
- `src/features/contratar/components/ContratarScreen.tsx` + `MaestroProfileScreen.tsx` — refactor a `WorkerSearchScreen` + `WorkerProfileScreen` (filter pills + lista + perfil con banner, portfolio, herramientas, habilidades, CTA WhatsApp).
- `src/features/proyectos/components/...NewProjectForm` — refactor al `NewProjectForm` del handoff.

**No tocar**: `App.tsx`, `AppLayout`, `DashHeader`, `DashNav` (solo verificar que las 4 tabs sean exactamente las del handoff; si no, ajustar SOLO la lista de tabs del constructor).

**Datos**: `useProductsQuery`, `useProjectsQuery`, `useLicitacionesQuery` (revisar nombres reales en `src/features/.../hooks/`).

**Checklist de cierre**:
- [ ] 4 tabs montadas, sin tab extra.
- [ ] Light + dark verificado en cada tab.
- [ ] Sub-pantallas se abren con animación `zFadeSlideIn` y vuelven con back.
- [ ] Cero `#xxxxxx` literales en archivos tocados.
- [ ] `typecheck` y `lint` pasan.

---

### Agente 1B · Proveedor (vendedor)

**Handoff de referencia**:
- `ZITEO Full App.html` → `VendedorApp` (líneas 379-429)
- `components/ziteo-vendedor-tabs.jsx` (575 líneas — leer completo)

**Tabs finales del proveedor** (4): `home`, `inventario`, `pedidos`, `cotizaciones`.

**Archivos a reescribir**:
- `src/features/proveedor/VendedorApp.tsx` (o `ProveedorApp.tsx` si existe) — host de 4 tabs.
- `src/features/proveedor/HomeTabVendedor.tsx` — métricas de negocio + accesos rápidos (según handoff).
- `src/features/proveedor/components/InventarioScreen.tsx` → renombrar tab y aplicar diseño `InventarioTab` del handoff.
- `src/features/proveedor/components/PedidosProveedorScreen.tsx` → `PedidosTabVendedor` del handoff.
- `src/features/proveedor/components/CotizacionesScreen.tsx` → `CotizacionesTabVendedor` del handoff.

**Sub-pantallas** accesibles desde Pedidos:
- `src/features/proveedor/components/LogisticaScreen.tsx` → refactor al `LogisticaScreen` del handoff (status timeline + driver info + map placeholder).
- `IntelScreen.tsx` → si no existe en el handoff, archivar tras un flag o moverla bajo "más opciones" de perfil.

**Rutas a remover del nav** (mover a sub-pantallas o eliminar): `intel`, `logistica`, `cotizaciones`-como-tab si conflictúa.

**Checklist** idéntico al 1A.

---

## FASE 2 · Roles de oferta (2 agentes en paralelo, después de Fase 1)

### Agente 2A · Maestro (trabajador)

**Handoff de referencia**:
- `ZITEO Full App.html` → `TrabajadorApp` (líneas 336-376)
- `components/ziteo-trabajador-tabs.jsx` (565 líneas)

**Tabs finales** (4): `home`, `licitaciones`, `proyectos`, `perfil`.

**Archivos a reescribir**:
- `src/features/trabajador/TrabajadorApp.tsx` (o `features/maestro/...`) — host de 4 tabs + `ChatFab`.
- `src/features/trabajador/HomeTabTrabajador.tsx` — métricas (proyectos activos, ganancia mes, rating), CTAs.
- `src/features/trabajador/LicitacionesTabTrabajador.tsx` — feed `BidCard` con filtros.
- `src/features/trabajador/ProyectosTabTrabajador.tsx` — list `ProjectCard` (perspectiva trabajador).
- `src/features/trabajador/PerfilTabTrabajador.tsx` — perfil propio editable (banner, portafolio, herramientas, habilidades).

**Rutas a consolidar**: `habilidades`, `trabajos`, `mi-perfil` → todo cae bajo Perfil tab o sub-secciones.

**Checklist** idéntico.

---

### Agente 2B · Chofer (repartidor)

**Handoff de referencia**:
- `ZITEO Full App.html` → `RepartidorApp` (líneas 288-333) — fíjate en el modo Radar con `RepartidorHeaderNav` overlay.
- `components/ziteo-repartidor-tabs.jsx` (571 líneas)

**Tabs finales** (4): `radar`, `pedidos`, `ganancias`, `perfil`.

**Archivos a reescribir**:
- `src/features/repartidor/RepartidorApp.tsx` — host con lógica especial para tab `radar` (overlay sobre map, no usa `DashHeader` opaco).
- `src/features/repartidor/RadarScreen.tsx` → `RadarTab` del handoff (map full-screen + driverPulse + radarSpin + chip de estado online/offline).
- `src/features/repartidor/PedidosTabRepartidor.tsx` — list de viajes asignados.
- `src/features/repartidor/GananciasScreen.tsx` → `GananciasTab` (gráfico mock + métricas + historial).
- `src/features/repartidor/PerfilRepartidor.tsx` — perfil con vehículo, rating, billetera.

**Rutas a consolidar**: `viajes` → `pedidos`. `historial` → dentro de Ganancias. `billetera` → dentro de Perfil o Ganancias. `transporte-pesado/ligero` quedan fuera del flujo del chofer (son del constructor).

**Importante**: el tab `radar` usa `RepartidorHeaderNav` (overlay transparente con logo + avatar) en lugar del `DashHeader` normal. Esa es la **única** excepción permitida al header global, y ya está prevista por el handoff.

**Checklist** idéntico.

---

## Ejecución

### Lanzamiento de Fase 1 (paralelo)
```
Agent(1A) en worktree → Constructor
Agent(1B) en worktree → Proveedor
```
Esperar a que ambos pasen typecheck + lint + screenshots. Merge a `main` con commits separados.

### Lanzamiento de Fase 2 (paralelo, tras Fase 1)
```
Agent(2A) en worktree → Maestro
Agent(2B) en worktree → Chofer
```
Mismo proceso de merge.

### Cierre
- Smoke test E2E (Playwright) de los 4 dashboards + auth flow intacto.
- Verificar lighthouse mobile (PWA, perf, a11y).
- Tag de release.

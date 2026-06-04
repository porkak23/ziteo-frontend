# Consolidation Decision: repartidor/ vs transportista/

**Date:** 2026-06-04  
**Author:** Supervisor Agent (Phase 4A pre-work)  
**Status:** Decision locked — awaiting execution

---

## Decision Final

**BASE GANADORA: `transportista/`**  
**PERDEDORA (eliminar): `repartidor/`** (excepto los archivos en la lista de rescate)

---

## Criterios evaluados

### Prioridad 1 — Datos mock (criterio eliminatorio)

| Aspecto | `repartidor/` | `transportista/` |
|---|---|---|
| GananciasScreen | **MOCK TOTAL**: `const DATA = { Hoy: {...}, Semana: {...}, Mes: {...} }` hardcodeado | **REAL**: `useDriverEarnings()` calcula de `useMyDeliveries()` via Supabase. Soporta comisión real (12%), breakdown diario, semanal. |
| PedidosTab (historial) | **MOCK TOTAL**: `const TRIP_HISTORY = [...]` hardcodeado en RepartidorApp.tsx (líneas 83-88) y además duplicado en RadarScreen.tsx (líneas 48-51) | **REAL**: `HistorialScreen` usa `useMyDeliveries()` con filtros por rango y búsqueda full-text. |
| RadarScreen fallback jobs | **MOCK como fallback**: `MAP_JOBS` (4 jobs hardcodeados) se usan cuando no hay datos reales. Intenta Supabase pero cae a mock. | N/A — TransportistaScreen nunca cae a datos mock. Si el pool está vacío, muestra `EmptyZone()`. |
| Métricas offline | **MOCK**: "Bs 125 hoy", "2 viajes hoy", "6.3 km" hardcodeados en RadarScreen (panel offline). | **REAL**: `today.net`, `completedToday` vienen de `useDriverEarnings()` / `useMyDeliveries()`. |
| Calificación y viajes en PerfilRepartidor | **MOCK**: "4.9" y "247 viajes" hardcodeados en el componente StatsPill. | N/A — transportista/ no tiene componente de perfil propio; reutiliza `PerfilRepartidor.tsx` que ya importa hooks de `transportista/`. |

**Veredicto Prioridad 1: `transportista/` gana sin discusión.** `repartidor/` tiene datos mock en 3 archivos distintos.

### Prioridad 2 — Completitud de hooks

| Hook / Feature | `repartidor/` | `transportista/` |
|---|---|---|
| Deliveries disponibles | `useAvailableDeliveries(vehicleType)` — solo pending, solo filtro light/heavy | `usePendingDeliveries(cargoCapability)` — pending con filtro, realtime (INSERT), limit 50, join con orders |
| Mis deliveries | No existe (solo mock) | `useMyDeliveries()` — driver_id, realtime (UPDATE), historial completo |
| Aceptar delivery | `useAcceptDelivery()` — llama RPC `accept_delivery` | `useAcceptDelivery()` — llama RPC `accept_delivery`, invalida POOL_KEY y MY_JOBS_KEY |
| Actualizar estado | No existe | `useUpdateDeliveryStatus()` — avanza in_transit / delivered / failed via RPC |
| Earnings | No existe (mock) | `useDriverEarnings()` — gross/commission(12%)/net, breakdown diario, semanal |
| Driver profile | Importa de `transportista/` directamente | `useDriverProfile()` + `useSaveVehicleType()` en su propio directorio |
| Geolocation | No existe | `useGeolocation(isOnline)` — activa GPS solo cuando online |
| Auto-arrival | No existe | `haversineDistance` a 200m del dropoff → banner automático |
| Transport requests | `usePendingTransportRequests` + `useAcceptTransportRequest` (importado de transporte/) | Mismo: `usePendingTransportRequests` + `useAcceptTransportRequest` |
| Realtime subscriptions | Solo INSERT en deliveries | INSERT en pool + UPDATE en mis deliveries (canal separado por driver_id) |

**Veredicto Prioridad 2: `transportista/` gana claramente.**

### Prioridad 3 — Facilidad para portar Google Maps

| Aspecto | `repartidor/RadarScreen.tsx` | `transportista/TransportistaScreen.tsx` |
|---|---|---|
| Mapa actual | Leaflet real (`MapContainer`, `TileLayer`, `Marker`, `Circle`) — 603 líneas acopladas al mapa | Radar SVG cosmético — **cero dependencia de mapa**. El radar es SVG puro animado. |
| Acoplamiento mapa/datos | Alto: `MapLayer`, `MapInvalidateSize`, `makeJobIcon`, `driverIcon`, `destIcon` son componentes Leaflet específicos mezclados con la lógica de negocio | Nulo: la lógica de negocio (pool de jobs, aceptar, estado) está separada del SVG decorativo |
| Trabajo para migrar a Google Maps | Hay que reemplazar TODO el mapa Leaflet por GoogleMaps, más reescribir la hoja inferior, más eliminar mocks | Solo hay que **añadir** un componente `LiveMap` opcional encima del radar SVG; el resto no cambia |

**Veredicto Prioridad 3: `transportista/` es muchísimo más fácil para la migración a Google Maps.**

---

## Plan de migración

La migración consiste en:
1. Cablear `TransportistaScreen` en App.tsx en lugar de `RepartidorApp`.
2. Rescatar `PerfilRepartidor.tsx` de `repartidor/` (ya es la implementación correcta y ya importa hooks de `transportista/`).
3. Verificar que el tab de Perfil del nuevo shell llame a `PerfilRepartidor`.
4. Eliminar el módulo `repartidor/` completo.
5. Eliminar la dependencia `leaflet` / `react-leaflet` del proyecto.

---

## Elementos de `repartidor/` que deben portarse ANTES de eliminar

### Rescatar (portar a `transportista/` o mantener como shared):

1. **`PerfilRepartidor.tsx`** — Ya es la implementación canónica y correcta. Ya importa hooks de `transportista/`. Moverla a `transportista/components/PerfilScreen.tsx` o dejarla como `shared/components/PerfilRepartidor.tsx`. El stats pill tiene calificación/viajes hardcodeados (4.9, 247) — conectar a datos reales antes de producción.

2. **`JobAlertToast`** (en RepartidorApp.tsx, líneas 173-211) — Componente de alerta flotante al recibir un trabajo nuevo. Si se quiere mantener esta UX de notificación push-style al recibir deliveries en tiempo real, hay que portarla. Es opcional dado que `TransportistaScreen` usa el banner de "Llegaste al destino" en su lugar.

3. **`TransportPoolScreen`** (en RepartidorApp.tsx, líneas 213-301) — Lista de solicitudes de transporte con aceptar. En `TransportistaScreen` este flujo ya está integrado como modo `'transporte'` con `TransportRequestCard`. No necesita portarse; está cubierto.

4. **Los íconos SVG de nav** (RNavIconRadar, RNavIconList, etc.) — Reutilizables. Sin embargo `transportista/` usa Material Symbols. Descartar o unificar criterio. La decisión de íconos está en la nota de memoria global (lucide-react OK, emojis NO).

### No rescatar (descartar):

- `TRIP_HISTORY` — datos mock, descartar.
- `MAP_JOBS` — datos mock de fallback del mapa, descartar.
- `GananciasScreen.tsx` — completamente mock (DATA, WEEK_BARS). Reemplazada por `BilleteraScreen`.
- `PedidosTab` (en RepartidorApp) — mock. Reemplazada por `HistorialScreen`.
- `RadarScreen.tsx` — lógica de Leaflet. La migración a Google Maps se hace sobre `TransportistaScreen` añadiendo `LiveMap` en el slot del radar SVG.
- El icono de estado offline/online con toggle switch — la UX del botón "CONECTARME" de `TransportistaScreen` es superior.

---

## Archivos a eliminar (módulo `repartidor/` completo)

```
src/features/repartidor/RepartidorApp.tsx
src/features/repartidor/RadarScreen.tsx
src/features/repartidor/GananciasScreen.tsx
src/features/repartidor/PerfilRepartidor.tsx   ← SOLO después de mover el componente
src/features/repartidor/hooks/useDeliveries.ts
src/features/repartidor/                       ← directorio completo
```

---

## Cambios de ruteo en App.tsx

**Línea 38 (App.tsx):**
```typescript
// ELIMINAR:
const RepartidorApp = lazy(() => import('./features/repartidor/RepartidorApp').then(m => ({ default: m.RepartidorApp })))

// AGREGAR:
const TransportistaApp = lazy(() => import('./features/transportista/components/TransportistaScreen').then(m => ({ default: m.TransportistaScreen })))
```

**Líneas 224-237 (App.tsx):**
```typescript
// REEMPLAZAR:
if (currentUser?.active_role === 'chofer') {
  return (
    <>
      <ThemeInitializer />
      <NetworkStatusBanner />
      <Suspense fallback={<TabSkeleton />}>
        <RepartidorApp />          // ← eliminar
      </Suspense>
      ...
    </>
  )
}

// CON:
if (currentUser?.active_role === 'chofer') {
  return (
    <>
      <ThemeInitializer />
      <NetworkStatusBanner />
      <Suspense fallback={<TabSkeleton />}>
        <TransportistaApp />       // ← nueva
      </Suspense>
      ...
    </>
  )
}
```

**Nota arquitectónica:** `TransportistaScreen` es una pantalla self-contained (maneja su propio estado offline/online) y no requiere el shell de tabs (`RoleDashNav`). Los tabs de Billetera, Historial y Perfil deberían integrarse como un shell propio para el rol chofer, encapsulando `TransportistaScreen`, `BilleteraScreen`, `HistorialScreen` y `PerfilRepartidor` en una estructura de tab navigation análoga a la que tiene `RepartidorApp` hoy. Esto es parte del trabajo de la Fase 4A.

---

## Dead Code & Tech Debt Adicional

### Leaflet — dependencia a eliminar

Leaflet está importado ÚNICAMENTE en:
```
src/features/repartidor/RadarScreen.tsx  (líneas 4-6)
  import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
  import L from 'leaflet'
  import 'leaflet/dist/leaflet.css'
```

Al eliminar `repartidor/`, `leaflet` y `react-leaflet` quedan sin consumidores. Deben eliminarse de `package.json` para reducir bundle size (Leaflet es ~150 KB sin comprimir).

**Acción:** `npm uninstall leaflet react-leaflet @types/leaflet` después de eliminar `repartidor/`.

### Datos hardcodeados detectados fuera de `repartidor/`

1. **`src/features/repartidor/PerfilRepartidor.tsx` líneas 290-297** — stats pill con calificación `4.9` y `247 viajes` hardcodeados. Este componente SE RESCATA, pero necesita conectarse a datos reales antes de ir a producción.

2. **`src/features/transportista/components/TransportistaScreen.tsx` líneas 76-84** — `dots` del radar SVG son posiciones hardcodeadas, usadas para animar puntos en el radar cosmético. Esto es INTENCIONAL y aceptable: son coordenadas de display visual, no datos de negocio. No requiere acción.

3. **`src/features/transportista/components/BilleteraScreen.tsx` línea 37** — botón "Registrar cuenta bancaria" con `disabled` y `title="Próximamente"`. Tech debt conocido, no datos mock.

### Archivos en `transportista/` que no son importados por nadie todavía

- `src/features/transportista/index.ts` — exporta `TransportistaScreen`, `HistorialScreen`, `BilleteraScreen`. Nadie en `src/` importa de este barrel. Esto se resolverá al conectar el módulo en App.tsx.
- `src/features/transportista/components/BilleteraScreen.tsx` — no importada en ningún sitio activo.
- `src/features/transportista/components/HistorialScreen.tsx` — no importada en ningún sitio activo.

Estos archivos NO son dead code — son el módulo completo que se activará en Fase 4A. Su no-importación es consecuencia de que el módulo está huérfano hoy.

### TODOs implícitos detectados en la lectura

| Archivo | Línea aprox. | Deuda |
|---|---|---|
| `PerfilRepartidor.tsx` | ~290 | Stats pill hardcodeadas (calificación, total viajes) |
| `BilleteraScreen.tsx` | ~133 | "Registrar cuenta bancaria" deshabilitado |
| `repartidor/RadarScreen.tsx` | ~23 | `DRIVER_POS` hardcodeada (-17.7833, -63.1821) — la posición del conductor no viene del GPS real |
| `repartidor/GananciasScreen.tsx` | ~17 | Todo el objeto DATA es mock |
| `repartidor/RepartidorApp.tsx` | ~83 | TRIP_HISTORY mock duplicado (también en RadarScreen) |

---

## Resumen ejecutivo para el agente de ejecución

1. **BASE:** `transportista/` es la implementación ganadora. Tiene cero mocks, hooks completos con realtime, flujo de delivery completo (pending→accepted→in_transit→delivered), earnings calculadas de datos reales, geolocalización y auto-arrival.

2. **SHELL REQUERIDO:** `TransportistaScreen` necesita ser envuelta en un shell de tabs (radar/billetera/historial/perfil) análogo a `RepartidorApp`. Este shell debe construirse como `ChofersApp` o similar, ensamblando `TransportistaScreen` + `BilleteraScreen` + `HistorialScreen` + `PerfilRepartidor`.

3. **PerfilRepartidor.tsx se rescata:** Moverla a `transportista/components/` antes de borrar `repartidor/`.

4. **App.tsx cambia un import y un JSX:** `<RepartidorApp />` → `<ChofersApp />` (nuevo shell).

5. **Leaflet se elimina del proyecto** tras borrar `repartidor/`.

6. **Orden de operaciones:**
   a. Crear `ChofersApp` ensamblando los 4 tabs con los componentes de `transportista/`.
   b. Mover `PerfilRepartidor.tsx` a `transportista/components/`.
   c. Actualizar imports en App.tsx.
   d. Verificar funcionamiento.
   e. Borrar directorio `repartidor/` completo.
   f. `npm uninstall leaflet react-leaflet @types/leaflet`.
   g. Borrar `package-lock.json` y reinstalar.

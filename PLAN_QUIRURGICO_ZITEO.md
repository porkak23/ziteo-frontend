# PLAN QUIRÚRGICO ZITEO
**Auditoría ejecutada por:** Senior Staff Engineer + Security Auditor + UX Accessibility Expert
**Fecha:** 2026-06-25
**Proyecto:** Ziteo — Marketplace de construcción en Bolivia (React 19 + Capacitor + Supabase)
**Metodología:** Diagnóstico profundo con 3 exploraciones paralelas + verificación en vivo contra BD (`yvqbubjfhmuztknmhyvd`)

---

## RESUMEN EJECUTIVO

El ciclo transaccional **Constructor → Proveedor → Chofer** está cableado correctamente. Los botones de acción críticos tienen handlers reales — **no hay botones sordos.** Sin embargo el flujo se rompe funcionalmente en la pierna del Chofer (entregas llegan sin dirección) y existe un hueco de privilegios por cambio de rol sin validación. Además: emojis que violan las reglas de diseño, accesibilidad insuficiente para usuarios senior, rating de chofer placeholder y deriva de esquema entre el repo y producción.

**CORRECCIÓN IMPORTANTE:** los subagentes de exploración reportaron inicialmente que las columnas `cargo_type / delivery_address / delivery_lat / delivery_lng` no existían en `orders`. Verificado contra la BD en vivo: **esas columnas SÍ existen** (creadas vía dashboard). El problema real no es esquema faltante, sino (a) que la UI nunca captura la dirección de entrega, y (b) que esas columnas no están documentadas en migraciones del repo.

---

## 🔴 BLOQUEANTE

### B-1 — La dirección de entrega nunca se captura → Radar del Chofer sin destino

**Severidad:** BLOQUEANTE — rompe el path completo Constructor→Chofer

**Descripción:**
- `CheckoutScreen.tsx` (`ziteo-frontend/src/features/tienda/components/CheckoutScreen.tsx`) no tiene formulario de dirección de entrega.
- `usePlaceOrder` (`ziteo-frontend/src/features/tienda/hooks/useOrders.ts:48-108`) solo parcha `cargo_type`; nunca setea `delivery_address / delivery_lat / delivery_lng` en `orders`.
- El trigger `auto_create_delivery_on_processing` (`supabase/migrations/20260618_fix_delivery_address_propagation.sql:21-23`) copia `NEW.delivery_address → dropoff_address`. Como ese campo nunca se setea, el chofer recibe trabajos con `dropoff_address = NULL`.

**Flujo actual (roto):**
```
Constructor confirma pedido → place_order() INSERT orders ✓
  → PATCH cargo_type en orders (fire-and-forget, sin dirección) ✓
Proveedor cambia status → 'processing' ✓
  → Trigger auto_create_delivery_on_processing dispara ✓
  → INSERT deliveries con dropoff_address = NULL ← AQUÍ SE ROMPE
Chofer ve trabajo pero sin destino → no puede navegar
```

**Fix requerido:**
1. Agregar campo de dirección de entrega en `CheckoutScreen.tsx` (input de texto + opcionalmente geolocalización del dispositivo).
2. Modificar `usePlaceOrder` para aceptar `deliveryAddress` como parámetro y hacer PATCH a `orders` con `await` + manejo de error.
3. Hacer el cargo_type PATCH también con `await` (eliminar fire-and-forget).

---

## 🟠 ALTO

### A-1 — Escalada de rol: cambio sin validación en cliente + RPCs sin chequeo server-side

**Severidad:** ALTO — vulnerabilidad de privilegios

**Descripción:**
- `handleRoleSelect` (`ziteo-frontend/src/shared/components/AvatarMenu.tsx:54-63`):
  ```typescript
  const handleRoleSelect = async (role: UserRole) => {
    if (role !== user.active_role) {
      setActiveRole(role)          // ← Estado cambia ANTES de validar
      setTab('home')
      supabase.from('profiles')    // ← fire-and-forget, sin await
        .update({ active_role: role })
        .eq('user_id', user.user_id)
        .then(({ error }) => { if (error) console.error(...) })
    }
    onClose()
  }
  ```
- Mismo patrón en `PerfilScreen.tsx` (`features/perfil/components/PerfilScreen.tsx`).
- `accept_delivery` (`supabase/migrations/20260422_fix_audit_and_logistics.sql:218-254`) y `update_delivery_status` usan `auth.uid()` pero **no validan que el usuario tenga el rol `chofer`** contra `user_roles`.
- Un usuario puede editar `localStorage['ziteo-auth']`, cambiar `active_role` a `chofer`, y tomar entregas que no le corresponden.

**Fix requerido:**
1. Guard en cliente antes de cambiar rol: `if (!user.roles.includes(role)) return`
2. Hacer `await` el UPDATE a `profiles` + revertir en caso de error.
3. Migración que añada validación de rol en los RPCs SECURITY DEFINER contra `user_roles`.

### A-2 — Deriva de esquema: `orders` y columnas clave no están en migraciones

**Severidad:** ALTO — entorno no reproducible, riesgo de DR

**Descripción:**
- No existe ningún `CREATE TABLE orders` ni `ALTER TABLE orders ADD COLUMN cargo_type / delivery_address / delivery_lat / delivery_lng` en `supabase/migrations/`.
- Las columnas existen en producción (creadas vía dashboard).
- Migraciones como `20260618_fix_delivery_address_propagation.sql` referencian columnas no versionadas.
- Un `supabase db reset` desde el repo destruiría la tabla principal.

**Columnas presentes en prod que faltan en migraciones:**
| Columna | Tipo | Crítica |
|---------|------|---------|
| `cargo_type` | text | Sí — usada por trigger |
| `delivery_address` | text | Sí — usada por trigger |
| `delivery_lat` | double precision | Sí — usada por trigger |
| `delivery_lng` | double precision | Sí — usada por trigger |
| `delivery_method` | text | Media |
| `estimated_delivery_at` | timestamptz | Media |

**Fix requerido:**
Crear migración idempotente `20260625_document_orders_schema.sql` con `ADD COLUMN IF NOT EXISTS` para todas las columnas que existen en prod pero no en migraciones.

---

## 🟡 MEDIO

### M-1 — Emojis en badges de vehículos (viola reglas de diseño)

**Regla violada:** CLAUDE.md — solo iconos vectoriales (lucide-react / SVG personalizados). Emojis prohibidos en UI.

**Ubicaciones:**
| Archivo | Línea(s) | Emoji(s) | Contexto |
|---------|----------|----------|---------|
| `TransportistaScreen.tsx` | 18-21 | 🛵🚗🚛🛻 | Array `VEHICLE_OPTS` |
| `TransportistaScreen.tsx` | ~188 | 🚛🛵 | `JobCard` indicador cargo |
| `TransportistaScreen.tsx` | ~579 | 🚛🛵 | Badges pool "Pesados/Ligeros" |

**Fix:** Reutilizar los SVG vectoriales `IconMoto / IconCamioneta / IconPickup / IconCamion` **ya definidos** en `PerfilChoferScreen.tsx:14-71`. No crear nuevos componentes.

### M-2 — Accesibilidad senior insuficiente

**Contexto:** El público objetivo incluye empresarios y contratistas mayores que usan la app en obra y oficina. WCAG AA mínimo.

**Problemas de contraste (TransportistaScreen.tsx):**
| Línea(s) aprox. | Clase actual | Relación contraste | Acción |
|-----------------|-------------|-------------------|--------|
| ~149 | `text-white/30` | ~3.5:1 ❌ | → `text-white/70` |
| ~155 | `text-white/50` | ~4.5:1 ⚠️ | → `text-white/70` |
| ~324, ~378 | `text-white/40` | ~4:1 ⚠️ | → `text-white/70` |
| ~346, ~353, ~402 | `text-white/25` | ~2.5:1 ❌ | → `text-white/65` |

**Touch targets <44px:**
| Archivo | Línea(s) | Elemento | Clase actual | Fix |
|---------|----------|---------|-------------|-----|
| `ProductCard.tsx` | ~96, ~106 | Toggle "Por unidad/Por bulto" | `px-2 py-0.5` | → `px-3 py-2` |
| `MisLicitacionesScreen.tsx` | ~73 | Botón "Ver perfil" | `px-2 py-1` | → `px-3 py-2.5` |
| `MisLicitacionesScreen.tsx` | ~96, ~103 | Botones "Aceptar/Rechazar" | `py-2` | → `py-3` |

**Fuentes demasiado pequeñas en datos importantes:**
| Archivo | Línea(s) | Clase actual | Fix |
|---------|----------|-------------|-----|
| `ProductCard.tsx` | ~71, ~77, ~126 | `text-[10px]` | → `text-xs` |
| `EarningsPanel.tsx` | múltiples | `text-[10px]` | → `text-xs` |

### M-3 — Rating del Chofer hardcodeado "Nuevo"

**Descripción:**
- `PerfilChoferScreen.tsx:295-307` muestra "Nuevo" hardcodeado.
- La tabla `reviews` (`supabase/migrations/20260409_create_reviews.sql`) existe pero **no se consulta** para choferes.
- El código incluso comenta en línea ~165: *"La calificación no tiene fuente de datos todavía"*.

**Fix:** Agregar query de promedio de `reviews` filtrado por `reviewed_id = driver_id`. Mostrar promedio numérico si hay reseñas; mantener "Nuevo" como fallback solo si `count = 0`.

---

## 🟢 BAJO

### L-1 — `useUpdateOrderStatus` sin filtro `provider_id` en WHERE
**Archivo:** `features/proveedor/hooks/useProveedorOrders.ts:133-149`
**Fix:** Agregar `.eq('provider_id', providerId)` al UPDATE — actualmente cubierto por RLS pero conviene defensa en profundidad.

### L-2 — Patch de `cargo_type` a `deliveries` en checkout es código muerto
**Archivo:** `ziteo-frontend/src/features/tienda/hooks/useOrders.ts:103-106`
**Razón:** La delivery no existe aún cuando se hace checkout (se crea al pasar a `processing`). El UPDATE no afecta ninguna fila.
**Fix:** Eliminar esas 4 líneas.

### L-3 — PATCH de `cargo_type` a `orders` sin `await` ni error handling
**Archivo:** `ziteo-frontend/src/features/tienda/hooks/useOrders.ts:96-101`
**Fix:** Convertir a `await` con `try/catch`. Una escritura crítica no debe ser fire-and-forget.

---

## MAPA DE BOTONES TRANSACCIONALES (ESTADO VERIFICADO)

Todos los botones críticos tienen handlers reales. **NO hay botones sordos.**

| Componente | Botón | Handler | Estado |
|------------|-------|---------|--------|
| `ProductDetailScreen` | "Agregar al carrito" | `handleAddToCart()` → `useCart.addItem()` | ✅ |
| `CartScreen` | "Proceder al pago" | `onCheckout()` | ✅ |
| `CheckoutScreen` | "Confirmar pedido" | `handleConfirm()` → `usePlaceOrder()` → `rpc place_order` | ✅ |
| `PedidosProveedorScreen` | "Procesar" | `updateStatus(pending→processing)` | ✅ |
| `PedidosProveedorScreen` | "Marcar enviado" | `updateStatus(processing→shipped)` | ✅ |
| `PedidosProveedorScreen` | "Confirmar entrega" | `updateStatus(shipped→delivered)` | ✅ |
| `DeliveryDetailScreen` | "Aceptar viaje" | `acceptDelivery()` → RPC `accept_delivery` | ✅ |
| `DeliveryDetailScreen` | "Confirmar recogida" | `updateStatus(accepted→in_transit)` | ✅ |
| `DeliveryDetailScreen` | "Confirmar entrega" | `updateStatus(in_transit→delivered)` | ✅ |

El problema no es el cableado — es el **dato de dirección** (B-1) y la **validación de rol** (A-1).

---

## PROPUESTA DE ANALÍTICA DE COMPORTAMIENTO

### Estado actual
| Herramienta | Estado | Config |
|-------------|--------|--------|
| **PostHog** | ✅ Implementado | `src/lib/analytics.ts` — eventos auth/shop/licitaciones/delivery, `maskAllText: true` |
| **Sentry + Session Replay** | ✅ Implementado | `main.tsx` — 10% muestreo prod, error replay 100% |
| **Google Analytics 4** | ❌ No implementado | Sin gtag ni `VITE_GA4_ID` |
| **Microsoft Clarity** | ❌ No implementado | Sin snippet ni `VITE_CLARITY_ID` |

### Microsoft Clarity — Heatmaps + Rage Clicks (recomendado para auditar UX senior)

```html
<!-- ziteo-frontend/index.html — gated por variable de entorno -->
<script>
  if (import.meta.env.VITE_CLARITY_ID) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "%%VITE_CLARITY_ID%%");
  }
</script>
```
Agregar `VITE_CLARITY_ID=` a `.env.example`.
**Uso:** identificar zonas de frustración (rage clicks en botones sin respuesta visible), dropoffs en el flujo de checkout, y patrones de uso en usuarios senior.

### Google Analytics 4 — Conversiones para Google Ads

```html
<!-- ziteo-frontend/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=%%VITE_GA4_ID%%"></script>
<script>
  if (import.meta.env.VITE_GA4_ID) {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', import.meta.env.VITE_GA4_ID);
  }
</script>
```
Reusar los nombres de evento de `analytics.ts` para no duplicar taxonomía:
- `order_placed` → conversión principal
- `registration_complete` → conversión de adquisición
- `licitacion_published` → conversión de activación Maestro

---

## REGLAS DE PREVENCIÓN
*(Para agregar a `CLAUDE.md` tras corregir los issues)*

```markdown
### Reglas de Prevención (aprendidas de auditoría 2026-06-25)

1. **Esquema siempre versionado:** Toda columna/tabla nueva DEBE crearse vía migración
   (`ADD COLUMN IF NOT EXISTS`). Prohibido cambios de esquema solo-dashboard.

2. **Dato capturado antes de merge:** Ningún flujo que dependa de un dato del usuario (ej. 
   dirección de entrega) puede mergearse sin la UI que lo captura y el PATCH que lo persiste.

3. **Validación de rol doble:** Cambios de `active_role` DEBEN verificar 
   `user.roles.includes(role)` en cliente Y pertenencia de rol en los RPCs SECURITY DEFINER 
   contra `user_roles`.

4. **Sin emojis en UI:** Usar exclusivamente iconos vectoriales (lucide-react o SVG del 
   proyecto). Emojis prohibidos en archivos .tsx/.jsx.

5. **Accesibilidad senior:** Targets táctiles ≥44px, fuentes ≥`text-xs` en datos clave, 
   contraste mínimo WCAG AA (4.5:1 texto normal, 3:1 texto grande). Público incluye adultos 
   mayores en obra.

6. **Escrituras críticas con await:** Toda escritura a Supabase en flujos de negocio DEBE 
   usar `await` + manejo de error. Prohibido fire-and-forget en paths transaccionales.
```

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

| Prioridad | Fix | Archivos | Esfuerzo |
|-----------|-----|----------|---------|
| 1 | B-1 Dirección de entrega en checkout | `CheckoutScreen.tsx`, `useOrders.ts` | Alto |
| 2 | A-1 Validación de rol | `AvatarMenu.tsx`, `PerfilScreen.tsx`, nueva migración | Medio |
| 3 | A-2 Migración schema drift | Nueva migración SQL | Bajo |
| 4 | M-1 Emojis → iconos SVG | `TransportistaScreen.tsx` | Bajo |
| 5 | M-2 Accesibilidad | `TransportistaScreen.tsx`, `ProductCard.tsx`, `MisLicitacionesScreen.tsx`, `EarningsPanel.tsx` | Medio |
| 6 | M-3 Ratings chofer | `PerfilChoferScreen.tsx` | Medio |
| 7 | L-1,L-2,L-3 | `useProveedorOrders.ts`, `useOrders.ts` | Bajo |

---

*Generado automáticamente por ciclo de diagnóstico — Ziteo Engineering Audit 2026-06-25*

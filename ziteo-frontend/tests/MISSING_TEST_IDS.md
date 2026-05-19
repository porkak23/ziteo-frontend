# Missing data-testid Attributes

This document lists every `data-testid` attribute that must be added to
components so the E2E tests in `tests/` can use stable, implementation-
agnostic selectors instead of relying on text content or CSS selectors.

---

## Auth — LoginForm.tsx

| data-testid | Element | Notes |
|---|---|---|
| `login-phone-input` | `<input type="tel" placeholder="7XX XXX XX">` | The 8-digit phone input after the "+591" prefix span |
| `login-pin-hidden-input` | `<input type="tel" maxLength={8} style={{opacity:0}}>` | Hidden input backing the 8 PIN boxes |
| `login-submit-btn` | `<button type="submit">` containing text "Ingresar" | The login CTA |
| `login-api-error` | `<div aria-live="polite">` wrapping the API error message | Error banner |

## Auth — WelcomeScreen.tsx

| data-testid | Element | Notes |
|---|---|---|
| `welcome-login-btn` | `<button onClick={() => onNavigate('login')}>` "Inicia Sesion" | Entry point to the login form |
| `welcome-register-btn` | `<button onClick={() => onNavigate('register')}>` "Crear Cuenta" | Entry point to registration |

---

## Proveedor (VendedorApp) — VendedorApp.tsx

| data-testid | Element | Notes |
|---|---|---|
| `vendedor-home-greeting` | `<h2>` greeting text in HomeTab | Visible immediately after proveedor login |
| `vendedor-nav-inventario` | The "Inventario" `<button>` inside RoleDashNav | Bottom-nav tab |
| `vendedor-nav-pedidos` | The "Pedidos" `<button>` inside RoleDashNav | Bottom-nav tab |
| `vendedor-nav-cotizaciones` | The "Cotizaciones" `<button>` inside RoleDashNav | Bottom-nav tab |

### InventarioTab (inside VendedorApp.tsx)

| data-testid | Element | Notes |
|---|---|---|
| `inventario-heading` | `<h2>Inventario</h2>` | Section heading |
| `inventario-agregar-btn` | "Agregar" `<button>` in the top-right of the Inventario tab | Opens the add-product form |
| `inventario-empty-state` | Container `<div>` showing "Tu inventario esta vacio" | Rendered when products list is empty |
| `inventario-product-list` | Container `<div>` wrapping all product cards | Rendered when products exist |
| `inventario-product-card` | Each product card `<div key={p.id}>` | For `.nth(0)` selection |

### Add-Product Form (inside InventarioTab)

| data-testid | Element | Notes |
|---|---|---|
| `form-agregar-producto` | Full-screen overlay `<div>` | Root of the add-product form |
| `form-nombre-input` | `<input>` rendered by `<ZInput label="Nombre">` | Product name field |
| `form-precio-input` | `<input>` rendered by `<ZInput label="Precio (Bs.)">` | Price field |
| `form-stock-input` | `<input>` rendered by `<ZInput label="Stock">` | Stock quantity field |
| `form-categoria-select` | `<select>` for category | The native select element |
| `form-guardar-btn` | `<ZButton>Guardar producto</ZButton>` | Submit button for the form |

### Toast (shared/components/Toast.tsx)

| data-testid | Element | Notes |
|---|---|---|
| `toast-success` | Toast container when type is `'success'` | Currently identified only by text |
| `toast-error` | Toast container when type is `'error'` | |

---

## Constructor — ConstructorApp.tsx

| data-testid | Element | Notes |
|---|---|---|
| `constructor-nav-tienda` | "Tienda" `<button>` inside RoleDashNav | Bottom-nav tab |
| `constructor-nav-proyectos` | "Proyectos" `<button>` inside RoleDashNav | Bottom-nav tab |
| `constructor-nav-licitaciones` | "Licitar" `<button>` inside RoleDashNav | Bottom-nav tab |

### ConstructorTiendaTab — ConstructorTiendaTab.tsx

| data-testid | Element | Notes |
|---|---|---|
| `tienda-section-heading` | Main heading/title of the Tienda tab | For load confirmation |
| `tienda-product-card` | Each product card root element | For `.nth(0)` selection |
| `tienda-add-to-cart-btn` | Add-to-cart button on each product card | Triggers cart increment |
| `tienda-cart-badge` | Cart item count badge in the header | Numeric indicator |
| `tienda-cart-btn` | Button to open the cart / proceed to checkout | |

### CheckoutScreen — tienda/components/CheckoutScreen.tsx

| data-testid | Element | Notes |
|---|---|---|
| `checkout-heading` | `<h1>Confirmar pedido</h1>` in the header bar | Load confirmation |
| `checkout-confirmar-btn` | The "Confirmar" / "Pagar" submit button | Places the order |
| `checkout-qr-modal` | Root of `<QrPagoModal>` | Appears after successful order placement |

---

## Maestro (Trabajador) — TrabajadorApp.tsx

| data-testid | Element | Notes |
|---|---|---|
| `trabajador-nav-licitaciones` | "Trabajos" `<button>` inside RoleDashNav | key='licitaciones', label='Trabajos' |
| `trabajador-nav-proyectos` | "Proyectos" `<button>` inside RoleDashNav | |
| `trabajador-nav-perfil` | "Mi Perfil" `<button>` inside RoleDashNav | |

### LicitacionesTabTrabajador — trabajador/LicitacionesTabTrabajador.tsx

| data-testid | Element | Notes |
|---|---|---|
| `licitaciones-filter-bar` | FilterBar wrapper div | Contains "Disponibles", "Mis Ofertas", "Historial" |
| `licitacion-card` | Each job-request card root div | For `.nth(0)` selection |
| `licitacion-info-btn` | Info / expand button on each card | Opens the detail view |
| `licitacion-oferta-btn` | "Enviar Oferta" button | Opens the bid input |
| `licitacion-oferta-input` | Bid amount input field | |
| `licitacion-detail-heading` | Heading in the detail/expanded view | |

---

## Chofer (Repartidor) — RepartidorApp.tsx

| data-testid | Element | Notes |
|---|---|---|
| `repartidor-nav-radar` | "Radar" `<button>` inside RoleDashNav | Default active tab |
| `repartidor-nav-pedidos` | "Pedidos" `<button>` inside RoleDashNav | |
| `repartidor-nav-ganancias` | "Ganancias" `<button>` inside RoleDashNav | |

### RadarScreen — repartidor/RadarScreen.tsx

| data-testid | Element | Notes |
|---|---|---|
| `radar-activar-btn` | `<button onClick={handleGoOnline}>ACTIVAR RADAR</button>` | Primary CTA in offline panel |
| `radar-status-badge` | `<span>` showing "EN LINEA" or "OFFLINE" | In floating controls overlay |
| `radar-toggle` | Toggle `<div role="button" aria-label="Conectarse">` | In floating controls overlay |
| `radar-offline-panel` | The offline info panel `<div>` | Slides in/out with CSS transform |
| `radar-online-sheet` | The online bottom sheet `<div>` | Visible when mode !== 'offline' |

---

## Shared

### RoleDashNav — shared/design/shell/RoleDashNav.tsx

The nav renders a `<button>` for each tab. In addition to per-role
testids above, the component itself could accept a `testIdPrefix` prop
and render `data-testid={testIdPrefix + '-' + tab.key}` on each button.

### DashHeader — shared/design/shell/DashHeader.tsx

| data-testid | Element | Notes |
|---|---|---|
| `dash-header-profile-btn` | Avatar / profile button | Opens AvatarMenu |
| `dash-header-chat-btn` | Chat / bell button | |

---

## How to add data-testids

For inline-style elements (most of this codebase), add the attribute
directly to the JSX element:

```tsx
// Before
<button onClick={handleGoOnline} style={{ ... }}>
  ACTIVAR RADAR
</button>

// After
<button
  data-testid="radar-activar-btn"
  onClick={handleGoOnline}
  style={{ ... }}
>
  ACTIVAR RADAR
</button>
```

For ZInput / ZButton shared components, either:
  1. Pass `data-testid` as a spread prop if the component forwards it, or
  2. Add a `testId` prop to the component that sets `data-testid` on the
     inner element.

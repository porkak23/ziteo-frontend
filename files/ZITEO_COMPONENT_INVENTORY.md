# 📦 ZITEO COMPONENT INVENTORY & EXTRACTION MAP
**Referencia**: `diseño_completo_de_stitch_.md` (8406 líneas totales)
**Propósito**: Mapeo exacto para extracción eficiente por Claude Code

---

## 🔐 AUTH SECTION (Lines 1-1043)

### 1. Splash Screen
- **File**: `src/components/Auth/SplashScreen.jsx`
- **Lines in Stitch**: ~1-200 (estimate from structure)
- **Features**:
  - Patrón geométrico background
  - Tres pillars: ORDEN·PRECISIÓN·FUTURO
  - Loading bar temática (animated)
  - Animation trigger: 3s loop → welcome screen
- **Props**: `onComplete: () => void`
- **State**: `loadingProgress: 0-100` (animated)

### 2. Welcome Screen
- **File**: `src/components/Auth/WelcomeScreen.jsx`
- **Lines in Stitch**: ~200-350
- **Features**:
  - Foto obrero boliviano (background)
  - Heading + subtitle (ZITEO tagline)
  - 2 CTAs: "Login" | "Register"
- **Props**: `onNavigate: (action: 'login' | 'register') => void`
- **Design**: Hero full-height, mobile-first

### 3. Login Form
- **File**: `src/components/Auth/LoginForm.jsx`
- **Lines in Stitch**: ~350-600
- **Features**:
  - Número input (validation: +591 format)
  - PIN input (mask: *****)
  - Biometría toggle (optional)
  - Google/Apple SSO buttons
  - Error messaging
- **Props**: `onSubmit: (phone, pin, biometric) => Promise`
- **State**: `loading, error, biometricAvailable`

### 4. Register Form (3 Steps)
- **File**: `src/components/Auth/RegisterForm.jsx`
- **Lines in Stitch**: ~600-850
- **Sub-components**:
  - `RegisterStep1.jsx` (número + OTP)
  - `RegisterStep2.jsx` (nombre + ciudad + PIN)
  - `RegisterStep3.jsx` (selección rol)
- **Features**:
  - Step indicator (progress bar)
  - OTP verification (SMS)
  - Rol selector: Constructor, Ferretero, Maestro, Chofer (disable Chofer UI but keep data structure)
- **Props**: `onComplete: (userData) => Promise`

### 5. PIN Recovery
- **File**: `src/components/Auth/PINRecovery.jsx`
- **Lines in Stitch**: ~850-900
- **Features**:
  - Número input
  - SMS OTP send
  - New PIN creation
- **Props**: `onSuccess: () => void`

### 6. Role Selector / Avatar Panel
- **File**: `src/components/Auth/RoleSelector.jsx`
- **Lines in Stitch**: ~900-1043
- **Features**:
  - Avatar display (user photo)
  - Rol cards: Constructor, Ferretero, Maestro, Chofer
  - Switch rol button (para users con múltiples roles)
  - Logout button
- **Props**: `user: User, onSelectRole: (role) => void`

---

## 🏪 STORE SECTION (Lines 1045-4377) - CONSTRUCTOR DASHBOARD

### 7. Store Dashboard (Main Layout)
- **File**: `src/components/Store/StoreDashboard.jsx`
- **Lines in Stitch**: ~1045-1150
- **Features**:
  - Header con logo + avatar
  - Navigation tabs: TIENDA·PROYECTOS·CONTRATAR
  - Main content area (scrollable)
  - Cart floating button
- **Props**: `initialTab: string`
- **State**: `activeTab, cartCount`

### 8. Search Bar
- **File**: `src/components/Store/SearchBar.jsx`
- **Lines in Stitch**: ~1150-1250
- **Features**:
  - Text input (debounced search)
  - Filter button (abre filter modal)
  - Category quick filters
- **Props**: `onSearch: (query) => void, onFilter: (filters) => void`

### 9. Product Card
- **File**: `src/components/Store/ProductCard.jsx`
- **Lines in Stitch**: ~1250-1350
- **Features**:
  - Producto image
  - Nombre + descripción (1-2 líneas)
  - Precio (buy/rent toggle)
  - Cantidad selector (spinner)
  - "Agregar al carrito" button
  - Ferretería badge (nombre + rating)
- **Props**: `product: Product, onAddCart: (qty) => void`
- **Design**: Card con shadow, responsive grid

### 10. Category Carousel
- **File**: `src/components/Store/CategoryCarousel.jsx`
- **Lines in Stitch**: ~1350-1600
- **Features**:
  - 4 categorías: Materiales, Herramientas, Electrónica, Otros
  - Horizontal scroll (mobile-friendly)
  - Category icons
  - Active indicator
- **Props**: `categories: Category[], onSelectCategory: (id) => void`
- **Design**: Tailwind scroll snap

### 11. Projects Active Section
- **File**: `src/components/Store/ProjectsSection.jsx`
- **Lines in Stitch**: ~1600-1800
- **Features**:
  - "Tus Proyectos" heading
  - Project cards: nombre, ubicación, progreso %
  - Quick project switch
- **Props**: `projects: Project[], onSelectProject: (id) => void`

### 12. Buy / Rent Toggle
- **File**: `src/components/Store/BuyRentToggle.jsx`
- **Lines in Stitch**: ~1800-1900
- **Features**:
  - Segmented control: "Comprar" | "Alquilar"
  - State-driven (affects product cards pricing)
  - Animation on switch
- **Props**: `value: 'buy' | 'rent', onChange: (value) => void`

### 13. Offers Carousel
- **File**: `src/components/Store/OffersCarousel.jsx`
- **Lines in Stitch**: ~1900-2200
- **Features**:
  - Promotional banner carousel
  - Discount badge
  - CTA button per offer
- **Props**: `offers: Offer[]`

### 14. Maestros Section
- **File**: `src/components/Store/MaestrosSection.jsx`
- **Lines in Stitch**: ~2200-2400
- **Features**:
  - "Maestros disponibles" title
  - Maestro mini cards: foto, nombre, especialidad, rating, $/hora
  - Horizontal scroll
  - Tap → profile detail
- **Props**: `maestros: Contractor[], onSelectMaestro: (id) => void`

### 15. Ferreterías Section
- **File**: `src/components/Store/FerreteriasSection.jsx`
- **Lines in Stitch**: ~2400-2600
- **Features**:
  - "Ferreterías Cercanas" title
  - Ferretería cards: logo, nombre, ubicación, rating, distancia
  - Horizontal scroll
- **Props**: `ferreterias: Ferreria[], onSelectFerreteria: (id) => void`

### 16. Transporte Section
- **File**: `src/components/Store/TransporteSection.jsx`
- **Lines in Stitch**: ~2600-2700
- **Features**:
  - "Transporte Disponible" title
  - Transport options cards (disabled in MVP)
  - Note: "Próximamente"
- **Props**: None (static)

### 17. Cart Summary / Checkout Button
- **File**: `src/components/Store/CartSummary.jsx`
- **Lines in Stitch**: ~2700-3000
- **Features**:
  - Cart items list (qty, name, price)
  - Subtotal + taxes + total
  - "Proceder a Checkout" button
  - Tap → checkout flow
- **Props**: `items: CartItem[], onCheckout: () => void`
- **State**: `expanded: boolean`

### 18. Checkout Form
- **File**: `src/components/Store/CheckoutForm.jsx`
- **Lines in Stitch**: ~3000-3200
- **Features**:
  - Ubicación obra input (location picker / text)
  - Teléfono contacto
  - Notas adicionales (textarea)
  - Método pago selector (PedidosYa style)
  - Terminos y condiciones checkbox
  - "Confirmar Orden" button
- **Props**: `onSubmit: (checkoutData) => Promise, loading: boolean`

### 19. Order Confirmation
- **File**: `src/components/Store/OrderConfirmation.jsx`
- **Lines in Stitch**: ~3200-3377
- **Features**:
  - Success message
  - Order ID (copyable)
  - Order summary recap
  - Pickup instructions
  - "Ver mis órdenes" button
  - "Volver a comprar" button
- **Props**: `order: Order`

---

## 📦 ORDERS SECTION (Lines 4379-7006) - FERRETERO DASHBOARD

### 20. Orders Dashboard (Main Layout)
- **File**: `src/components/Orders/OrdersDashboard.jsx`
- **Lines in Stitch**: ~4379-4500
- **Features**:
  - Header + Navigation: PEDIDOS·INVENTARIO(center)·INTEL
  - Tab content (dinamico)
  - Action buttons
- **Props**: `initialTab: string`

### 21. Order Card (Ferretero View)
- **File**: `src/components/Orders/OrderCard.jsx`
- **Lines in Stitch**: ~4500-4700
- **Features**:
  - Constructor name + avatar
  - Items list (simple: product × qty)
  - Total amount
  - Status badge (pending, confirmed, ready, collected)
  - Action buttons (edit, confirm, ready, collect)
  - Timer countdown (if pending)
- **Props**: `order: Order, onUpdateStatus: (status) => void`
- **Design**: Card con border colored por status

### 22. Timer Visual
- **File**: `src/components/Orders/TimerVisual.jsx`
- **Lines in Stitch**: ~4700-4900
- **Features**:
  - Countdown timer (CSS animation or library: react-countdown)
  - Color gradient: green → yellow → red (based on time remaining)
  - Percentage circle / bar
  - "Tiempo restante" label
- **Props**: `estimatedTime: Date, onExpired: () => void`

### 23. Loading Modes (IA Features)
- **File**: `src/components/Orders/LoadingModes.jsx`
- **Lines in Stitch**: ~4900-5200
- **Features**:
  - 3 buttons: 📸 Foto | 🎤 Voz | ✍️ Manual
  - Cada modo desplega:
    - **Foto**: Camera input → image upload → "Reconocer productos" button (mock IA)
    - **Voz**: Audio recorder → play back → "Transcribir" button (mock)
    - **Manual**: Text input (traditional)
  - Result display: producto list con quantities
- **Props**: `onLoadingComplete: (products: ProductQuantity[]) => void`
- **State**: `activeMode, loading, error, results`

### 24. Inventory Editor (Inline)
- **File**: `src/components/Orders/InventoryEditor.jsx`
- **Lines in Stitch**: ~5200-5500
- **Features**:
  - Order items list (editable)
  - Cada item: producto + qty (input inline)
  - Precio unitario (editable inline)
  - Total line (calculado automático)
  - "Aplicar cambios" button
  - Sin modal (inline editing)
- **Props**: `items: CartItem[], onApply: (items) => void`
- **Design**: Table-like layout, mobile responsive

### 25. Stats Panel
- **File**: `src/components/Orders/StatsPanel.jsx`
- **Lines in Stitch**: ~5500-5700
- **Features**:
  - "Estadísticas del Día" section
  - Metrics:
    - Órdenes procesadas (count)
    - Ingresos (sum)
    - Tiempo promedio (avg)
  - Simple cards / grid layout
- **Props**: `stats: DayStats`

### 26. Price Adjuster
- **File**: `src/components/Orders/PriceAdjuster.jsx`
- **Lines in Stitch**: ~5700-5900
- **Features**:
  - "Ajuste de Precios" button (1-tap trigger)
  - Modal popup:
    - "Precio mercado hoy" display (mock data)
    - Product → precio original vs sugerido
    - Aplicar botón
  - Rápido (< 5 segundos from click to apply)
- **Props**: `onApply: (pricingAdjustment) => void`

### 27. Truck Request
- **File**: `src/components/Orders/TruckRequest.jsx`
- **Lines in Stitch**: ~5900-6100
- **Features**:
  - "Solicitar Camión" button (appears post-confirmation)
  - Modal con:
    - Cantidad items
    - Tamaño camión selector (pequeño, mediano, grande)
    - Horario entrega preferido (time picker)
    - Constructor address (pre-filled from order)
    - "Solicitar" button
  - Confirmation message
- **Props**: `orderId: string, onSubmit: (request) => Promise`

### 28. Inventory Tab Content
- **File**: `src/components/Orders/InventoryTab.jsx`
- **Lines in Stitch**: ~6100-6400
- **Features**:
  - Product inventory list
  - Campos: producto, qty en stock, precio, última actualización
  - Filter by category
  - Edit qty button per item
  - Upload inventory from CSV (future feature)
- **Props**: `inventory: InventoryItem[]`

### 29. Intel Tab Content
- **File**: `src/components/Orders/IntelTab.jsx`
- **Lines in Stitch**: ~6400-7006
- **Features**:
  - Analytics dashboard (basic)
  - Gráficos: órdenes over time, productos populares, clientes frecuentes
  - Filtros: date range, product category
  - Export button (CSV)
- **Props**: `data: IntelData`
- **Design**: Chart library (Chart.js or Recharts)

---

## 👷 CONTRACTORS SECTION (Lines 7563-8405) - CONTRACTOR HIRING

### 30. Contractors Dashboard
- **File**: `src/components/Contractors/ContractorsDashboard.jsx`
- **Lines in Stitch**: ~7563-7650
- **Features**:
  - Header + Navigation: CONTRATAR (with search)
  - Main contractor list / search results
  - Filter sidebar (optional on mobile)
- **Props**: `initialSearch: string`

### 31. Contractor Search Bar
- **File**: `src/components/Contractors/ContractorSearch.jsx`
- **Lines in Stitch**: ~7650-7750
- **Features**:
  - Text input: nombre, especialidad
  - Filter chips: disponibilidad, tarifa máx, rating mín
  - "Buscar" button (or debounced instant search)
- **Props**: `onSearch: (query, filters) => void`

### 32. Contractor Card (List View)
- **File**: `src/components/Contractors/ContractorCard.jsx`
- **Lines in Stitch**: ~7750-7900
- **Features**:
  - Avatar / photo
  - Nombre
  - Especialidad(es) tag(s)
  - Rating ⭐ (e.g., 4.8)
  - Número trabajos completados
  - Tarifa por hora
  - Disponibilidad status (verde = disponible hoy)
  - Tap → detail modal
- **Props**: `contractor: Contractor, onSelect: (id) => void`
- **Design**: Horizontal card, mobile-first

### 33. Contractor Detail Modal
- **File**: `src/components/Contractors/ContractorDetail.jsx`
- **Lines in Stitch**: ~7900-8000
- **Features**:
  - Full profile view:
    - Avatar + nombre + especialidades
    - Rating + reviews count
    - Bio / descripción
    - Trabajos completados (count + últimas fechas)
    - Precios por especialidad
    - Disponibilidad calendar
  - "Solicitar servicio" button → hire modal
  - "Contactar" button (future: chat)
- **Props**: `contractorId: string, onHire: () => void`

### 34. Hire Request Modal
- **File**: `src/components/Contractors/HireModal.jsx`
- **Lines in Stitch**: ~8000-8250
- **Features**:
  - Form fields:
    - Tipo de trabajo (selector / text)
    - Descripción detallada (textarea)
    - Fecha inicio (date picker)
    - Fecha fin (date picker)
    - Presupuesto propuesto (input)
    - Ubicación obra (text / location picker)
  - Contractor profile preview (pequeño recap)
  - "Enviar solicitud" button
  - Confirmation message
- **Props**: `contractor: Contractor, onSubmit: (jobDetails) => Promise`

### 35. Contractor My Jobs (Maestro View - Optional for Constructor to see status)
- **File**: `src/components/Contractors/HireRequestList.jsx`
- **Lines in Stitch**: ~8250-8405
- **Features**:
  - "Mis solicitudes de trabajo" list
  - Cada item: contractor name, job title, status (pending, accepted, in-progress, completed)
  - Status colors / icons
  - Tap → detail / chat
  - Feedback / rating prompt (post-completion)
- **Props**: `requests: HireRequest[]`

---

## 🚫 CHOFER SECTION (Lines 7008-7561) - SKIP IN MVP
- **Status**: Desactivado
- **No extraer**: Dashboard Chofer, Viaje Card, Ruta Map, GPS tracking
- **Conservar**: Nombre de rol en data structure (para futura re-enable)
- **Líneas omitidas**: ~553 líneas
- **Token savings**: ~15-20% contexto liberado

---

## 📱 SHARED COMPONENTS (Across all dashboards)

### 36. Navigation Bar
- **File**: `src/components/Shared/Navigation.jsx`
- **Features**:
  - Constructor: TIENDA·PROYECTOS·CONTRATAR
  - Ferretero: PEDIDOS·INVENTARIO·INTEL
  - Maestro: TRABAJOS·DISPONIBLES·PERFIL
  - Active state styling
  - Responsive (mobile: hamburger menu optional)
- **Props**: `role: UserRole, activeTab: string, onNavigate: (tab) => void`

### 37. Header / App Bar
- **File**: `src/components/Shared/Header.jsx`
- **Features**:
  - Logo (ZITEO)
  - Titulo/breadcrumb (dinámico per page)
  - Avatar dropdown (user menu)
  - Notification bell (future)
- **Props**: `title: string, user: User, onLogout: () => void`

### 38. Button Variants
- **File**: `src/components/Shared/Button.jsx`
- **Variants**: primary, secondary, destructive, outline
- **Sizes**: sm, md, lg
- **States**: default, loading, disabled
- **Props**: `variant, size, loading, disabled, onClick, children`

### 39. Modal / Dialog
- **File**: `src/components/Shared/Modal.jsx`
- **Features**:
  - Backdrop (dismissible)
  - Header + body + footer
  - Close button
  - Size variants: sm, md, lg
- **Props**: `isOpen, onClose, title, children, size`

### 40. Toast / Notification
- **File**: `src/components/Shared/Toast.jsx`
- **Features**:
  - Auto-dismiss (3s)
  - Position: top-right
  - Types: success, error, warning, info
  - Icons per type
  - Close button manual
- **Props**: `message, type, duration, onClose`

### 41. Input Field
- **File**: `src/components/Shared/Input.jsx`
- **Types**: text, number, email, password, tel, date
- **Features**:
  - Label + placeholder
  - Error message display
  - Disabled state
  - Icon (left/right optional)
- **Props**: `type, label, placeholder, error, disabled, value, onChange`

### 42. Form Field
- **File**: `src/components/Shared/FormField.jsx`
- **Features**:
  - Wrapper: label + input + error
  - Consistent styling
  - Required indicator (*)
- **Props**: `label, required, error, children`

### 43. Card
- **File**: `src/components/Shared/Card.jsx`
- **Features**:
  - Container con padding + border + shadow
  - Variants: elevated, outlined, filled
- **Props**: `variant, children, onClick`

### 44. Loading Spinner
- **File**: `src/components/Shared/Spinner.jsx`
- **Features**:
  - Animated circle / loader
  - Sizes: sm, md, lg
  - Colors: primary, secondary
- **Props**: `size, color`

### 45. Empty State
- **File**: `src/components/Shared/EmptyState.jsx`
- **Features**:
  - Icon + title + description
  - CTA button (optional)
  - Illustration / SVG
- **Props**: `icon, title, description, action`

---

## 📊 TOTALS & ORGANIZATION

| Category | Count | Files | Lines Est. |
|----------|-------|-------|-----------|
| **Auth** | 6 | 6 | ~1043 |
| **Store** | 13 | 13 | ~3332 |
| **Orders** | 10 | 10 | ~2627 |
| **Contractors** | 6 | 6 | ~842 |
| **Shared** | 10 | 10 | ~500 |
| **TOTAL (MVP)** | **45** | **45** | **~8344** |
| **SKIPPED (Chofer)** | 5 | 5 | ~553 |

---

## 🎯 EXTRACTION STRATEGY

### Sequential (Recommended for Claude Code)
1. **Day 1 - Auth** (6 components, ~1043 líneas)
2. **Day 1 - Shared** (10 components, ~500 líneas) 
3. **Day 2 - Store** (13 components, ~3332 líneas)
4. **Day 2 - Orders** (10 components, ~2627 líneas)
5. **Day 3 - Contractors** (6 components, ~842 líneas)
6. **Day 3 - Integration & Testing**

### Parallel (If using multiple agents)
- **Agent 1**: Auth + Shared (1-2 days)
- **Agent 2**: Store (1-2 days)
- **Agent 3**: Orders (1-2 days)
- **Agent 4**: Contractors (1 day)

---

## 🔗 COMPONENT DEPENDENCIES

```
StoreDashboard
├── Navigation (Shared)
├── Header (Shared)
├── SearchBar
├── CategoryCarousel
├── ProductCard → Button, Card (Shared)
├── BuyRentToggle (Shared)
├── ProjectsSection → Card (Shared)
├── OffersCarousel
├── MaestrosSection → ContractorCard (minimal)
├── FerreteriasSection
├── CartSummary → CartIcon (Shared)
└── Checkout → Modal, Input, Button (Shared)

OrdersDashboard
├── Navigation (Shared)
├── Header (Shared)
├── OrderCard → TimerVisual, StatusBadge
├── LoadingModes → Button, Modal (Shared)
├── InventoryEditor → Input, Button (Shared)
├── StatsPanel → Card (Shared)
├── PriceAdjuster → Modal, Input, Button (Shared)
└── TruckRequest → Modal, Input, Button (Shared)

ContractorsDashboard
├── Navigation (Shared)
├── Header (Shared)
├── ContractorSearch → Input, Button (Shared)
├── ContractorCard → Card, Button (Shared)
├── ContractorDetail → Modal, Button (Shared)
└── HireModal → Form fields, Button (Shared)
```

---

## ✅ EXTRACTION CHECKLIST

- [ ] Auth components (6) extracted + tested
- [ ] Shared components (10) extracted + tested
- [ ] Store components (13) extracted + tested
- [ ] Orders components (10) extracted + tested
- [ ] Contractors components (6) extracted + tested
- [ ] Design tokens applied to all
- [ ] Storybook stories created (optional)
- [ ] No hardcoded data (all props-driven)
- [ ] TypeScript types defined
- [ ] 0 ESLint warnings

---

**Generated**: 31/03/2026
**For**: ZITEO Multi-Agent Development
**Status**: Ready for Extraction

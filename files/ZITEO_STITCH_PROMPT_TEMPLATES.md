# 🎨 ZITEO Stitch Prompt Templates

**Propósito:** Prompts estructurados para que Google Stitch genere screens consistentes con el design locked.

**Cómo usar:**
1. Copiar template relevante
2. Reemplazar `[VARIABLES]` con valores específicos
3. Enviar a Google Stitch 2.0
4. Validar output contra design en Figma

---

## 🏗️ Prompt Base (Siempre incluir)

```
You are generating a screen for ZITEO, a mobile-first construction marketplace app.

CRITICAL DESIGN CONSTRAINTS:
- Color primary: #A43700 (brown)
- Background: #F9F9F9 (light gray)
- Accent (projects center circle): #FFF0EB (peach)
- Font: Manrope 800 (titles), Inter 400 (body)
- Icons: Material Symbols (line icons, stroke 1.5px, no emoji)
- Layout: Mobile-first (320px minimum), light mode only
- Navigation: Bottom nav (3 buttons) is persistent on ALL screens except modals
- Device: iOS 15+ / Android 11+

DESIGN REFERENCE FILE: https://www.figma.com/file/4D25Fz61d1JrsfsNWf1Ydo/ZITEO

Use ONLY Tailwind CSS with ZITEO custom color tokens:
- primary-600: #A43700
- accent-light: #FFF0EB
- gray-light: #F9F9F9

Do NOT:
- Add custom colors outside ZITEO palette
- Use emoji for icons
- Add dark mode
- Change typography scale
- Deviate from bottom nav structure

RESPONSIVE BREAKPOINTS:
- Mobile: 320px
- Tablet: 768px
- Adjust components vertically, NOT horizontally (mobile-first stacking)
```

---

## 🔐 Autenticación

### Splash Screen

```
Generate a splash screen for ZITEO (construction marketplace).

LAYOUT:
- Full screen (320x812 for mobile)
- Background: Geometric pattern in #A43700 (brown) with 30% opacity
- Center: ZITEO logo (text "ZITEO" in Manrope 800, 48px, white)
- Below logo: Tagline "La plataforma que construye Bolivia" in Inter 400, 16px, white
- Bottom: Animated loading bar
  - Gradient: #F5A97A (orange) → #F5C8B0 (amber)
  - Height: 4px
  - Width: 60% of screen, centered
  - Animation: 3 seconds fill duration

NO bottom navigation.
NO interactive elements (splash only).
Duration: Display for 3 seconds before transition to Welcome.
```

### Welcome Screen

```
Generate the Welcome screen for ZITEO.

LAYOUT:
- Full screen (320x812)
- Background image: Photograph of Bolivian worker (construction context, professional)
- Dark overlay: 40% opacity black on top of image
- Center-bottom section (white background):
  - Padding: 24px
  - Radius: 24px top-left and top-right
  - Title: "Bienvenido a ZITEO" in Manrope 800, 28px
  - Subtitle: "La plataforma que construye Bolivia" in Inter 400, 16px, gray-600
  - 2 CTAs (stacked, full width):
    1. "Soy Constructor" (primary button, #A43700)
    2. "Soy Proveedor o Maestro" (secondary button, outline)
  - Link at bottom: "¿Ya tengo cuenta?" → color #A43700

NO bottom navigation on Welcome.
Buttons trigger:
- Constructor → Registration Step 1
- Proveedor/Maestro → Registration Step 1
- Existing account → Login screen
```

### Login Screen

```
Generate the Login screen for ZITEO.

LAYOUT:
- Header: Back button + "Ingresar" title
- Form section (white card, 16px padding):
  - Input 1: Phone number
    - Placeholder: "+591 XXXX XXXX"
    - Type: tel
    - Mask applied: +591-[digits]
  - Input 2: PIN
    - Placeholder: "Código PIN (5 dígitos)"
    - Type: password (dots mask)
    - Validation: exactly 5 digits
  - CTA: "Ingresar" button (primary, full width)
  - OR divider: "O continúa con"
  - Social login: Google icon + Apple icon (rounded squares)
- Bottom section:
  - Link 1: "¿Olvidé mi PIN?" (red text, #DC2626)
  - Link 2: "Crear cuenta" (primary color)

NO bottom navigation.
Validation:
- Phone format validated
- PIN = 5 digits
- Error messages in red below inputs
- Show/hide password toggle in PIN field
```

### Registration Step 1: Phone + OTP

```
Generate Registration Step 1 screen for ZITEO.

LAYOUT:
- Header: Back button + "Paso 1 de 3" + progress bar (1/3 filled, #A43700)
- Form section:
  - Title: "Tu teléfono" in Manrope 800, 24px
  - Input: Phone number (same mask as login)
  - CTA: "Enviar código" button (primary)
- After OTP sent:
  - Hide phone input
  - Show: "Ingresa el código de 6 dígitos"
  - Input: OTP (6 digits, number type)
  - Validation feedback inline
  - CTA: "Continuar" (enabled when OTP = 6 digits)
- Resend link: "¿No recibiste código?" (gray, becomes active after 30s)

NO bottom navigation.
Validation: OTP valid from Twilio/Supabase Auth.
```

### Registration Step 2: Data Entry

```
Generate Registration Step 2 screen for ZITEO.

LAYOUT:
- Header: Progress bar (2/3 filled, #A43700)
- Title: "Cuéntanos de ti" in Manrope 800, 24px
- Form section:
  - Input 1: Full name (placeholder: "Nombre completo")
  - Dropdown: City (options: La Paz, Cochabamba, Santa Cruz, Sucre, Tarija, Oruro, Potosí, Beni, Pando)
  - Input 2: PIN (5 digits, password masked)
  - Input 3: Confirm PIN (5 digits, password masked)
  - Validation messages (red) below each field
- CTA: "Siguiente" button (primary)

NO bottom navigation.
```

### Registration Step 3: Role Selection

```
Generate Registration Step 3 screen for ZITEO.

LAYOUT:
- Header: Progress bar (3/3 filled, #A43700)
- Title: "¿Quién eres?" in Manrope 800, 24px
- Subtitle: "Selecciona el rol que mejor te describe" in Inter 400, 14px
- 3 Role cards (full width, stacked):
  1. CONSTRUCTOR
     - Icon: "shopping_cart" (Material Symbol)
     - Title: "Constructor"
     - Description: "Busco materiales y contrato mano de obra"
     - Radio button (right side)
  2. PROVEEDOR
     - Icon: "store" (Material Symbol)
     - Title: "Proveedor"
     - Description: "Vendo materiales y productos"
     - Radio button
  3. MAESTRO
     - Icon: "build" (Material Symbol)
     - Title: "Maestro"
     - Description: "Ofrezco mano de obra especializada"
     - Radio button
- Card styling:
  - Border: 2px solid (selected = #A43700, unselected = #E5E7EB)
  - Padding: 16px
  - Radius: 12px
  - Cursor: pointer (highlight on hover)
- CTA: "Crear cuenta" button (primary, full width, bottom)

NO bottom navigation.
After selection: API call to POST /api/auth/register, then auto-login.
```

---

## 🛍️ Constructor: Tienda & Carrito

### Tienda Home (Constructor Main)

```
Generate the Constructor Tienda (Store) home screen for ZITEO.

LAYOUT:
- Sticky header (white, 16px padding):
  - Left: "ZITEO" logo (text, Manrope 800, 24px, primary)
  - Right: Cart icon (Material Symbol "shopping_cart") with badge
    - Badge: Circular, background #A43700, white text (count)
    - Position: top-right of icon
- Bottom navigation (sticky, white background, border-top #E5E7EB):
  - 3 tabs: TIENDA (highlight) | PROYECTOS (center, circle with #FFF0EB border) | CONTRATAR
  - Active indicator: underline #A43700

MAIN CONTENT (scrollable vertical):
1. Carrusel publicitario (first)
   - 3-4 hero banners
   - Auto-scroll every 5s
   - Dots pagination (bottom)
   - Height: 180px

2. "Tus proyectos activos" section
   - Title: "Tus proyectos activos" in Manrope 800, 18px
   - Grid: 2 columns
   - Each project card:
     - Image: project photo (or placeholder)
     - Title: project name
     - Location: city
     - Status badge (small, top-right)
     - Click → Proyecto detalle

3. Comprar / Alquilar switch (minimal, NO container)
   - Toggle: "Comprar" (default) | "Alquilar"
   - Currently: Alquilar disabled, show "Próximamente"
   - Only visible on Tienda tab

4. 4 Category carousels (horizontal scroll):
   a) Herramientas
   b) Materiales
   c) Equipos
   d) Maestros
   
   For each carousel:
   - Title: category name (Manrope 800, 18px)
   - Link: "Ver más →" (primary color, right-aligned)
   - Cards: horizontal scroll, 1.5 visible per width
   - Each card:
     - Image: product photo
     - Title: product name
     - Price: "$150" or "200 Bs/día"
     - Rating: stars (placeholder 4.8)
   - Click card → Producto detalle

5. "Ofertas especiales" carousel
   - Same structure as category carousels
   - Icon: "flash_on" (Material Symbol, yellow)
   - Title: "Ofertas especiales"
   - Cards: limited time offers

6. "Maestros destacados" section
   - Title: "Maestros destacados" in Manrope 800, 18px
   - Grid: 1 column, large cards
   - Each card:
     - Avatar: profile photo (circular)
     - Name: maestro name
     - Specialties: chips (small, gray)
     - Rate: "200 Bs/día"
     - Rating: stars
     - Click → Maestro profile

7. "Ferreterías cercanas" section
   - Title: "Ferreterías cercanas" in Manrope 800, 18px
   - Grid: 1 column
   - Each card:
     - Name: store name
     - Location: distance + address
     - Rating: stars
     - Click → Provider profile

8. "Transporte disponible" section
   - Title: "Transporte disponible" (currently empty)
   - Placeholder: "Próximamente"

Bottom padding: 80px (space for bottom nav + safe area)

NO modals. Click on elements navigates to detail screens.
Pull-to-refresh: enabled (spinner at top).
```

### Producto Detalle

```
Generate Product Detail screen for ZITEO (Constructor view).

LAYOUT:
- Header:
  - Back button (left)
  - Title: "Detalle" (center)
  - Share button (right, currently disabled, icon "share")
- Hero image (full width, 240px height):
  - Product photo
  - Image carousel dots (bottom-left)
- Details section (white card, 16px padding, rounded 20px top):
  - Title: product name (Manrope 800, 20px)
  - Rating: "4.8 ⭐ (125 reviews)" in gray
  - Price: "$150" (Manrope 800, 24px, primary)
  - Unit: "por bolsa" (Inter 400, 14px, gray)
  - Stock status:
    - If > 0: "En stock ✓" (green)
    - If = 0: "Sin stock" (red)
  - Provider card (horizontal):
    - Avatar: provider photo (circular, 48px)
    - Name: provider name
    - City: city name
    - Rating: stars (small)
    - Button: "Ver más" (secondary, small)
  - Specs section:
    - Title: "Especificaciones" in Manrope 800, 16px
    - List: key-value pairs from JSON (gray text)
    - Example:
      Marca: Fancesa
      Tipo: Portland
      Resistencia: 42.5 MPa
  - Descripción:
    - Title: "Descripción" in Manrope 800, 16px
    - Text: product description (Inter 400, gray)
- Quantity selector (sticky at bottom):
  - [−] button (material symbol "remove")
  - Input: number (width: 60px, center-aligned)
  - [+] button (material symbol "add")
  - Default quantity: 1
- CTAs (stacked, full width, sticky):
  1. "Agregar al carrito" (primary, #A43700)
  2. "Ver similares" (secondary, outline)

Bottom navigation: Show (on scrolling, sticky).

Clicking "Agregar al carrito":
- API call: POST /api/cart/items { product_id, quantity }
- Toast feedback: "Agregado al carrito" (2s, green)
- Keep screen open, update quantity selector
```

### Carrito Modal/Screen

```
Generate Cart screen for ZITEO (Constructor).

LAYOUT:
- Header:
  - Back button or close (X) if modal
  - Title: "Carrito" (center)
  - Badge: item count (right side, gray)
- Cart items list (scrollable):
  - If empty: Show placeholder "Carrito vacío" + "Continuar comprando" button
  - If items: Each item row (white card, 16px padding, margin-bottom 8px):
    - Image: product photo (48x48px, left)
    - Details (left section):
      - Product name (Manrope 800, 14px)
      - Provider name (Inter 400, 12px, gray)
      - Price per unit (Inter 400, 12px, primary)
    - Quantity control (right section):
      - [−] [input] [+] selector
      - Subtotal below (Manrope 800, 14px, primary)
    - Delete button: X (Material Symbol, red on hover)
- Summary section (sticky at bottom, white, border-top #E5E7EB):
  - Line: "Items: 3"
  - Line: "Total: $450" (Manrope 800, 18px, primary)
  - CTA: "Proceder al checkout" (primary, full width)
  - Link: "Continuar comprando" (secondary, center)

Quantity control behavior:
- [−] disables if quantity = 1
- [+] disables if quantity = stock
- Change triggers API PATCH /api/cart/items/:id

Delete button:
- Click: API DELETE /api/cart/items/:id
- Toast: "Item eliminado"

"Proceder al checkout":
- Navigate to Checkout screen
- Pass cart items to checkout

Bottom navigation: Show.
```

### Checkout Screen (Workflow)

```
Generate Checkout screen for ZITEO (Constructor).

LAYOUT:
- Header: "Confirmar compra" (center)
- Progress indicator:
  - Step 1: Proyecto (completed checkmark)
  - Step 2: Revisar (current, highlight)
  - Step 3: Confirmar (grayed out)
- Review section:
  - Title: "Revisa tu orden" (Manrope 800, 18px)
  - Card: Project selection
    - Dropdown: "Selecciona proyecto" → list of user's projects
    - Or: "Sin proyecto" (default)
  - Orders grouped by provider:
    - Provider name (bold)
    - Items from that provider (indented list)
    - Subtotal for provider
- Notes field:
  - Placeholder: "Notas especiales (opcional)"
  - Textarea (4 lines)
- Summary:
  - "Total: $750" (Manrope 800, 20px, primary)
- CTAs (sticky, bottom):
  - "Confirmar compra" (primary, full width)
  - "Editar carrito" (secondary, full width below)

On "Confirmar compra":
- API call: POST /api/cart/checkout { project_id, notes }
- Response: list of created orders
- Navigate to Checkout confirmation
- Clear cart (API DELETE handled server-side)

Bottom navigation: Hidden.
```

---

## 📋 Constructor: Proyectos

### Proyectos Tab / List

```
Generate Projects tab for ZITEO Constructor.

LAYOUT:
- Header:
  - Title: "Mis proyectos" (Manrope 800, 24px)
  - CTA: "Nuevo proyecto" button (primary, right-aligned)
- Filter segment (below header):
  - Tabs: Todos | Activos | Completados
  - Active indicator: underline #A43700
- Projects grid (1 column, scrollable):
  - If empty: Placeholder "Sin proyectos" + CTA "Crear proyecto"
  - Each project card (white, 16px padding, rounded 12px, margin-bottom 12px):
    - Image: project photo (full width, 160px height, rounded 8px)
    - Name: project name (Manrope 800, 16px)
    - Location: city + address (Inter 400, 12px, gray)
    - Status badge: (top-right corner, small)
      - "Planning" = gray
      - "Active" = green
      - "Completed" = blue
      - "Paused" = orange
    - Meta: "5 materiales | $2,500" (Inter 400, 12px, gray, bottom)
    - Click → Proyecto detalle

- Delete action:
  - Long press on card → context menu:
    - "Editar" → Editar proyecto modal
    - "Eliminar" → confirmation → API DELETE

Bottom navigation: Show.
Pull-to-refresh: enabled.
```

### Crear Proyecto Modal

```
Generate Create Project modal for ZITEO Constructor.

LAYOUT:
- Header:
  - Close button (X, left)
  - Title: "Nuevo proyecto" (center, Manrope 800, 18px)
- Form section (white, scrollable):
  - Input 1: Project name
    - Placeholder: "Nombre del proyecto"
    - Validation: required
  - Input 2: Description
    - Placeholder: "Describe tu proyecto (opcional)"
    - Type: textarea (4 lines)
  - Input 3: Location
    - Option A: Text input (address)
    - Option B: Map picker (optional, post-MVP)
    - Placeholder: "Ubicación"
  - Input 4: Presupuesto estimado
    - Placeholder: "Ej: $5,000"
    - Type: number
    - Validation: optional
  - Date inputs:
    - Start date (date picker)
    - End date (date picker)
  - Upload: Project photo
    - Icon: "cloud_upload" (Material Symbol)
    - Drag-drop area (or click to select)
    - Preview: thumbnail
    - Max size: 10MB
- CTAs (sticky, bottom):
  - "Crear proyecto" (primary, full width)
  - "Cancelar" (secondary)

On "Crear proyecto":
- Validate form
- Upload photo if provided
- API call: POST /api/proyectos { name, description, location_address, ... }
- Toast: "Proyecto creado"
- Close modal
- Refresh projects list

NO bottom navigation in modal.
```

### Proyecto Detalle

```
Generate Project Detail screen for ZITEO Constructor.

LAYOUT:
- Header:
  - Back button (left)
  - Menu icon (right, 3-dots)
    - Options: Editar | Compartir (disabled, feature flag) | Eliminar
- Hero section:
  - Project photo (full width, 200px height)
  - Status badge (top-right)
- Details card (white, 16px padding, rounded 20px top):
  - Title: project name (Manrope 800, 20px)
  - Location: city + address (Inter 400, 14px, gray)
  - Status: dropdown (edit inline)
    - Options: Planning | Active | Paused | Completed
  - Budget:
    - "Presupuesto: $5,000" (Inter 400, 14px)
  - Dates:
    - "Inicio: 15/04/2026" (Inter 400, 12px, gray)
    - "Fin: 15/06/2026" (Inter 400, 12px, gray)
- Tabs (segmented control):
  - Materiales (default)
  - Órdenes
  - Contratos
- MATERIALES TAB:
  - If empty: Placeholder "Sin materiales" + CTA "Agregar material"
  - List (scrollable):
    - Each material item (white card, 12px padding, margin-bottom 8px):
      - Image: product photo (32x32px, left)
      - Details:
        - Product name (Manrope 800, 14px)
        - Quantity: "5 bolsas" (Inter 400, 12px, gray)
        - Subtotal: "$750" (Manrope 800, 14px, primary)
      - Delete: X button (red on hover)
    - Total: "Total materiales: $2,500" (Manrope 800, 16px, primary, sticky top of this section)
  - CTA: "Agregar material" (primary, bottom)
- ÓRDENES TAB:
  - If empty: Placeholder "Sin órdenes"
  - List: Orders linked to this project
    - Each order: provider name, total, status, date
    - Click → Order detalle (if exists)
- CONTRATOS TAB:
  - If empty: Placeholder "Sin contratos"
  - List: Contracts linked to this project
    - Each contract: maestro name, monto, status, date
    - Click → Contract detalle

Bottom navigation: Show.

Clicking "Agregar material":
- Navigate to "Agregar material modal" (similar to Add to Cart, but for project)
```

### Agregar Material Modal

```
Generate "Add Material to Project" modal for ZITEO Constructor.

LAYOUT (identical structure to product search in Tienda):
- Header:
  - Close button (X, left)
  - Title: "Agregar material" (center)
- Search & filter section:
  - Search input: Placeholder "Busca producto..."
  - Filter button: Material Symbol "tune"
    - Dropdown: Category, Price range
- Products list (scrollable):
  - Grid: 2 columns or list (1 column)
  - Each product card:
    - Image: product photo
    - Name: product name
    - Provider: provider name (small, gray)
    - Price: price per unit
    - Stock: "En stock" or "Sin stock"
  - Click on product → expands to quantity selector:
    - Product name (header)
    - Image
    - Quantity selector: [−] [input] [+]
    - Subtotal: calculated
    - CTAs:
      - "Agregar a proyecto" (primary)
      - "Agregar al carrito" (secondary)
      - "Cancelar" (close and go back to list)

On "Agregar a proyecto":
- API call: POST /api/proyectos/:id/materiales { product_id, quantity, notes }
- Toast: "Material agregado al proyecto"
- Close modal
- Refresh proyecto detalle

NO bottom navigation in modal.
```

---

## 🏪 Proveedor Dashboard

### Proveedor Home (Dashboard)

```
Generate Proveedor home screen for ZITEO.

LAYOUT:
- Header (sticky):
  - Left: "ZITEO Proveedor" logo
  - Right: Menu icon (3-dots)
    - Option: Editar perfil
- Bottom navigation:
  - PEDIDOS | INVENTARIO (center circle, #FFF0EB) | INTEL
  - Active tab: underline #A43700

MAIN CONTENT:
1. Stats grid (2 columns, white cards, 16px padding each):
   - Card 1:
     - Icon: "shopping_cart" (Material Symbol)
     - Label: "Órdenes pendientes"
     - Value: "5" (Manrope 800, 24px)
     - Subtitle: "Total: $3,500" (Inter 400, 12px, primary)
   - Card 2:
     - Icon: "check_circle" (Material Symbol)
     - Label: "Confirmadas"
     - Value: "12"
     - Subtitle: "Total: $8,200"
   - Card 3:
     - Icon: "inventory" (Material Symbol)
     - Label: "Productos activos"
     - Value: "150"
   - Card 4:
     - Icon: "warning" (Material Symbol, orange)
     - Label: "Stock bajo"
     - Value: "8"

2. "Órdenes recientes" section:
   - Title: "Órdenes recientes" (Manrope 800, 16px)
   - Grid: 1 column (list style)
   - Each order card (white, 16px padding, rounded 12px, margin-bottom 8px):
     - Constructor name (Manrope 800, 14px)
     - Items count: "5 items"
     - Total: "$750" (primary)
     - Status badge (top-right)
       - "Pending" = yellow
       - "Confirmed" = green
       - "Shipped" = blue
       - "Delivered" = gray
     - Date: "hace 2 horas" (Inter 400, 12px, gray)
     - Click → Order detalle

Bottom padding: 80px (for bottom nav + safe area).

Bottom navigation: Show.
```

### PEDIDOS Tab

```
Generate PEDIDOS (Orders) tab for ZITEO Proveedor.

LAYOUT:
- Header: "Mis pedidos" (Manrope 800, 24px)
- Filter segment (tabs):
  - Todas | Pendientes | Confirmadas | Entregadas
  - Active: underline #A43700
- Orders list (scrollable, 1 column):
  - If empty: Placeholder "Sin órdenes en esta categoría"
  - Each order card (white, 16px padding, rounded 12px, margin-bottom 8px):
    - Constructor name (Manrope 800, 14px)
    - Order ID: "#ORD-12345" (Inter 400, 12px, gray)
    - Items count + total: "3 items | $750" (Inter 400, 12px)
    - Status (editable dropdown, if pending/confirmed):
      - Current status (badge)
      - Dropdown options: pending → confirmed → shipped → delivered
      - On change: API PATCH /api/proveedor/ordenes/:id/status
      - Toast: "Estado actualizado"
    - Date: "hace 2 horas" (Inter 400, 12px, gray)
    - Click card (anywhere except dropdown) → Order detalle modal

Bottom navigation: Show.
```

### Orden Detalle Modal

```
Generate Order Detail modal for ZITEO Proveedor.

LAYOUT:
- Header:
  - Close button (X, left)
  - Title: "Orden #ORD-12345" (center, Manrope 800, 16px)
- Content (scrollable):
  - Constructor info card (white, 16px padding):
    - Avatar + Name (Manrope 800, 14px)
    - Phone (clickable, calls constructor)
    - City (gray text)
  - Project info (if exists):
    - Title: project name
    - Location: city + address
  - Items list:
    - Title: "Items" (Manrope 800, 14px)
    - Table or list:
      - Product | Qty | Price | Subtotal
      - Each row: product name, quantity, unit price, subtotal
  - Notes section:
    - If exists: "Notas: [constructor notes]"
  - Summary:
    - "Total: $750" (Manrope 800, 18px, primary)
  - Status control:
    - Dropdown: Current status
    - Options: Pending | Confirmed | Shipped | Delivered (only forward transitions)
    - Timestamp of last status change (gray)
  - Notes field:
    - Placeholder: "Agregar notas (opcional)"
    - Type: textarea
- CTAs (sticky, bottom):
  - "Guardar cambios" (primary, full width)
  - "Cancelar" (secondary)

On "Guardar cambios":
- API call: PATCH /api/proveedor/ordenes/:id/status { status, notes }
- Toast: "Orden actualizada"
- Close modal
- Refresh orders list

NO bottom navigation in modal.
```

### INVENTARIO Tab

```
Generate INVENTARIO (Inventory) tab for ZITEO Proveedor.

LAYOUT:
- Header:
  - Title: "Mi inventario" (Manrope 800, 24px)
  - CTA: "Nuevo producto" (primary, right)
- Filter segment (tabs):
  - Todos | Activos | Sin stock
  - Active: underline #A43700
- Search bar:
  - Placeholder: "Busca producto..."
- Products list (scrollable, 1 column):
  - If empty: Placeholder "Sin productos"
  - Each product card (white, 16px padding, rounded 12px, margin-bottom 8px):
    - Image: product photo (48x48px, left)
    - Details:
      - Name (Manrope 800, 14px)
      - Category (Inter 400, 12px, gray)
      - Price: "$150" (Inter 400, 12px)
    - Stock status (right side):
      - Quantity: "100 bolsas" (Manrope 800, 12px)
      - Status indicator:
        - > 50 = green circle
        - 10-50 = orange circle
        - < 10 = red circle
      - Inline editable: click to update quantity
        - Input pops up (inline)
        - Type new quantity
        - Press Enter or lose focus: API PATCH
        - Toast: "Stock actualizado"
    - Actions (right, icons):
      - Edit icon: Material Symbol "edit" → Edit modal
      - Delete icon: Material Symbol "delete" (red on hover) → Confirmation → API DELETE
  - Long-press on card: context menu
    - Edit
    - Delete
    - Duplicate

Bottom navigation: Show.

Clicking "Nuevo producto":
- Navigate to "Crear producto modal"
```

### Crear/Editar Producto Modal

```
Generate Create/Edit Product modal for ZITEO Proveedor.

LAYOUT:
- Header:
  - Close button (X, left)
  - Title: "Nuevo producto" or "Editar producto" (center, Manrope 800, 16px)
- Form (white, scrollable):
  - Input 1: Product name
    - Placeholder: "Nombre del producto"
    - Validation: required, max 200 chars
  - Input 2: Description
    - Placeholder: "Descripción (opcional)"
    - Type: textarea (4 lines)
  - Dropdown 1: Category
    - Options: Herramientas, Materiales, Equipos, etc.
    - Validation: required
  - Input 3: Price per unit
    - Placeholder: "Precio"
    - Type: number (> 0)
    - Validation: required
  - Dropdown 2: Unit type
    - Options: bolsa, metro, kg, litro, unidad, etc.
    - Validation: required
  - Input 4: Stock quantity
    - Placeholder: "Cantidad en stock"
    - Type: number (>= 0)
    - Validation: required
  - Specs section (key-value pairs):
    - Title: "Especificaciones (opcional)" (Manrope 800, 12px)
    - Rows: [key] [value] [delete button]
    - "Agregar especificación" link (primary color, small)
    - Examples: Marca, Tipo, Resistencia
  - Upload section:
    - Icon: "cloud_upload" (Material Symbol)
    - Drag-drop area OR click to select file
    - Accepted: .jpg, .png (max 10MB)
    - Preview: thumbnail (if exists)
    - Button: "Cambiar imagen" (if editing existing product with image)
  - Toggle: Activo / Inactivo
    - Label: "¿Publicar este producto?" (gray text below)
- CTAs (sticky, bottom):
  - "Guardar" (primary, full width)
  - "Cancelar" (secondary, full width)

Validation (client-side):
- All required fields filled (show error red below field)
- Price > 0
- Stock >= 0
- Image size < 10MB

On "Guardar":
- If creating: API call POST /api/proveedor/productos { ... }
- If editing: API call PATCH /api/proveedor/productos/:id { ... }
- Upload image to Supabase Storage (if new image selected)
- Toast: "Producto guardado" (green)
- Close modal
- Refresh inventario list

NO bottom navigation in modal.
```

### INTEL Tab (Placeholder MVP)

```
Generate INTEL tab placeholder for ZITEO Proveedor (MVP, disabled).

LAYOUT:
- Header: "Inteligencia de precios" (Manrope 800, 24px)
- Center section (empty state):
  - Icon: "trending_up" (Material Symbol, gray, 64px)
  - Title: "Análisis de precios próximamente" (Manrope 800, 18px)
  - Text: "Herramientas para optimizar tus precios y competitividad estarán disponibles después del lanzamiento." (Inter 400, 14px, gray)
- CTA: "Notificarme cuando esté listo" (secondary, optional)

NO bottom navigation for this empty state; bottom nav still visible globally.
```

---

## 👨‍🔧 Maestro: Perfil & Contratos

### Maestro Perfil Tab

```
Generate Maestro profile screen for ZITEO.

LAYOUT:
- Header:
  - Title: "Mi perfil" (Manrope 800, 24px)
  - CTA: "Editar" button (secondary, right)
- Profile card (white, 16px padding, rounded 12px, centered):
  - Avatar: circular photo (120px diameter)
  - Name: maestro name (Manrope 800, 18px)
  - City (Inter 400, 14px, gray)
  - Phone: displayed with call icon (clickable)
  - Specialties: chips (blue background, small)
    - Electricista, Plomería, Carpintería, etc.
  - Rate display:
    - "200 Bs / día" (Manrope 800, 16px, primary)
    - Or "50 Bs / hora" depending on rate_type
  - Experience:
    - "10 años de experiencia" (Inter 400, 12px, gray)
  - Bio:
    - Quote or description (Inter 400, 14px, gray, italics)
  - Portfolio:
    - Link: "Ver portafolio" (primary color, underlined)
- Ratings section:
  - Title: "Calificaciones" (Manrope 800, 14px)
  - Stars: 4.8 / 5.0 (yellow stars)
  - Count: "25 reseñas" (gray)
- Availability:
  - Toggle: Available | Not available
  - Label below: "Los constructores pueden contactarte" (gray, small)
- Bottom CTAs (sticky):
  - "Editar perfil" (primary, full width)

Clicking "Editar" or "Editar perfil":
- Navigate to Maestro edit modal

Bottom navigation: Show.
```

### Maestro Perfil Edit Modal

```
Generate Maestro profile edit modal for ZITEO.

LAYOUT:
- Header:
  - Close button (X, left)
  - Title: "Editar perfil" (center, Manrope 800, 16px)
- Form (white, scrollable):
  - Avatar upload:
    - Current: circular thumbnail
    - Button: "Cambiar foto" → file picker
  - Input 1: Full name
    - Current value prefilled
    - Validation: required
  - Input 2: Bio/Description
    - Placeholder: "Cuenta sobre ti"
    - Type: textarea (4 lines)
  - Specialties selector:
    - Multi-select chips: Electricista, Plomería, Carpintería, etc.
    - Selected: highlighted with primary color
    - Unselected: gray
  - Rate type dropdown:
    - Options: Per day | Per hour | Per project
  - Rate amount:
    - Input: number (Bs/día, Bs/hora, or Bs/proyecto)
    - Placeholder: "Ej: 200"
  - Experience years:
    - Input: number
    - Placeholder: "Ej: 10"
  - Portfolio URL:
    - Input: URL (optional)
    - Placeholder: "https://tu-portafolio.com"
  - Availability toggle:
    - "¿Estoy disponible para trabajos?" (with explanation below)
  - Max concurrent projects:
    - Dropdown or input: 1, 2, 3, 5, etc.
- CTAs (sticky, bottom):
  - "Guardar cambios" (primary, full width)
  - "Cancelar" (secondary)

Validation:
- Name required
- Rate amount > 0
- At least 1 specialty selected

On "Guardar cambios":
- API call: PATCH /api/maestro/perfil { ... }
- Upload avatar if changed
- Toast: "Perfil actualizado"
- Close modal
- Refresh profile view

NO bottom navigation in modal.
```

### Maestro Contratos Tab

```
Generate Maestro Contratos tab for ZITEO.

LAYOUT:
- Header: "Mis trabajos" (Manrope 800, 24px)
- Filter segment (tabs):
  - Todos | Pendientes | Aceptados | Completados
  - Active: underline #A43700
- Contracts list (scrollable, 1 column):
  - If empty: Placeholder "Sin trabajos en esta categoría"
  - Each contract card (white, 16px padding, rounded 12px, margin-bottom 8px):
    - Constructor name (Manrope 800, 14px)
    - Project name (Inter 400, 12px, gray)
    - Contract title: "Electricidad - Instalación" (Manrope 800, 13px)
    - Amount: "$500" (primary, Manrope 800, 14px)
    - Status badge (top-right):
      - "Pending" = yellow
      - "Accepted" = green
      - "Completed" = gray
    - Dates: "15/04 - 25/04" (Inter 400, 11px, gray)
    - Click → Contract detalle

Bottom navigation: Show.
```

### Contrato Detalle (Pending Status)

```
Generate Contract Detail screen for ZITEO Maestro (when status='pending').

LAYOUT:
- Header:
  - Back button (left)
  - Menu icon (right, 3-dots)
    - Option: Delete contract
- Content (scrollable):
  - Constructor info card (white, 16px padding):
    - Avatar + Name (Manrope 800, 14px)
    - Phone (clickable)
    - City
  - Project info:
    - Title: "Remodelación Casa Las Flores" (Manrope 800, 14px)
    - Location: city + address (gray)
  - Contract details:
    - Title: contract title (Manrope 800, 16px)
    - Description: scope (Inter 400, 13px)
    - Amount offered: "$500" (Manrope 800, 18px, primary)
    - Rate type: "Por proyecto" (gray)
  - Scope details:
    - Section: "Alcance del trabajo" (Manrope 800, 13px)
    - List: tasks (bullet points)
    - Requirements (if any)
    - Timeline: "10 días" (gray)
  - Dates:
    - Start: 15/04/2026 (gray)
    - End: 25/04/2026 (gray)
  - Notes (if provided):
    - "Notas del cliente: ..." (italic, gray)

- ACTION SECTION (sticky, bottom, highlighted with #FFF0EB background):
  - Status label: "Contrato pendiente" (Manrope 800, 14px, gray)
  - 2 CTAs (stacked, full width):
    1. "Aceptar trabajo" (primary, #A43700, green on hover)
       - Confidence button with spinner
    2. "Rechazar trabajo" (secondary, red text)
       - Confirmation modal: "¿Rechazar este trabajo?" + [Rechazar] [Cancelar]

  - [ARCHITECTURE] Hidden button (disabled, grayed out):
    - "Hacer contra-oferta" (comment: "feature post-MVP")
    - Tooltip on hover: "Disponible después del lanzamiento"

On "Aceptar trabajo":
- API call: PATCH /api/maestro/contratos/:id/status { status: 'accepted' }
- Show spinner while loading
- Success: Toast "Trabajo aceptado"
- Change button state to "Accepted ✓" (disabled, gray)
- Constructor receives notification

On "Rechazar trabajo":
- Show confirmation modal
- On confirmation: API call PATCH with status: 'rejected'
- Toast: "Trabajo rechazado"
- Navigate back to contracts list

NO bottom navigation on this screen.
```

### Búsqueda de Maestros (Constructor Perspective)

```
Generate Maestro search/discovery screen for ZITEO Constructor (Contratar tab).

LAYOUT:
- Header: "Busca maestros" (Manrope 800, 24px)
- Search & filter section:
  - Search input: Placeholder "Busca por especialidad..."
  - Filter chips (horizontal scroll):
    - Electricista, Plomería, Carpintería, Albañil, etc.
    - Selected chip: primary background
    - Unselected: gray background
  - Advanced filter button: Material Symbol "tune"
    - Dropdown menu:
      - City: dropdown
      - Rate range: slider (100-500 Bs)
      - Availability: toggle
      - Sort by: Rating, Price, Experience
- Maestros grid (1 column, scrollable):
  - If no results: Placeholder "No hay maestros disponibles con esos filtros"
  - Each maestro card (white, 16px padding, rounded 12px, margin-bottom 8px):
    - Avatar: circular photo (48px)
    - Name (Manrope 800, 14px)
    - Specialties: chips (small, 2-3 visible)
    - Rate: "200 Bs/día" (Inter 400, 12px, primary)
    - Rating: "4.8 ⭐ (25)" (yellow stars, gray text)
    - Availability: "Disponible" (green dot + text) or "No disponible"
    - Click → Maestro detalle modal

Bottom navigation: Show ("CONTRATAR" tab active).
```

### Maestro Detalle & Contratar Modal

```
Generate Maestro Detail modal for ZITEO Constructor.

LAYOUT (scrollable content):
- Header:
  - Close button (X, left)
  - Title: maestro name (Manrope 800, 16px)
- Profile section:
  - Avatar: large circular photo (80px)
  - Name (Manrope 800, 18px)
  - City (gray text, small)
  - Specialties: chips (2-3 rows)
  - Rate: "200 Bs/día" (Manrope 800, 16px, primary)
  - Rating: "4.8 ⭐ (25 reseñas)" (yellow stars)
  - Bio / Description (Inter 400, 13px, gray)
  - Experience: "10 años de experiencia"
  - Portfolio: "Ver portafolio" link (if exists)
- Reviews section (optional):
  - Title: "Reseñas" (Manrope 800, 13px)
  - First 3 reviews (max):
    - Reviewer name (gray, small)
    - Rating (stars)
    - Comment (italic, gray, 1-2 lines)
    - Date (gray, tiny)
- CTA (sticky, bottom):
  - "Contratar a [name]" (primary, full width, #A43700)

Clicking "Contratar a [name]":
- Navigate to "Crear contrato" modal

NO bottom navigation in modal.
```

### Crear Contrato Modal

```
Generate Create Contract modal for ZITEO Constructor (hiring maestro).

LAYOUT:
- Header:
  - Close button (X, left)
  - Title: "Contratar a [maestro name]" (center, Manrope 800, 16px)
- Form (white, scrollable):
  - Maestro info (read-only display):
    - Name + Avatar
    - Specialties (chips)
    - Rate: "200 Bs/día" (gray text)
  - Input 1: Project selection
    - Dropdown: "Selecciona un proyecto"
    - Options: list of user's projects
    - Validation: required
  - Input 2: Contract title
    - Placeholder: "Ej: Instalación eléctrica cocina"
    - Validation: required
  - Input 3: Description
    - Placeholder: "Describe el trabajo que necesitas"
    - Type: textarea (4 lines)
  - Input 4: Proposed amount
    - Placeholder: "Precio" (pre-filled with maestro.rate_amount if applicable)
    - Type: number (> 0)
    - Label below: "Basado en tarifa: 200 Bs/día" (gray, small, optional)
    - Validation: required
  - Scope/Details section:
    - Title: "Alcance del trabajo" (Manrope 800, 12px)
    - Rows: add tasks (key-value pairs)
      - Task input (placeholder: "Ej: Instalar 15 puntos de luz")
      - Delete button (X)
      - "Agregar tarea" link (primary, small)
  - Date selection:
    - Start date (date picker)
    - End date (date picker)
  - Notes field:
    - Placeholder: "Notas especiales (opcional)"
    - Type: textarea (3 lines)
- CTAs (sticky, bottom):
  - "Enviar contrato" (primary, full width)
  - "Cancelar" (secondary)

Validation:
- All required fields filled (show error below field)
- Amount > 0
- Start date < End date

On "Enviar contrato":
- API call: POST /api/maestros/:id/contratos { title, description, project_id, initial_amount, scope, start_date, end_date, notes }
- Spinner while loading
- Success: Toast "Contrato enviado. [Maestro name] lo revisará pronto"
- Close modal
- Refresh contracts list
- Maestro receives notification

NO bottom navigation in modal.
```

---

## 🔔 Notificaciones

### Notificaciones Icon & Badge (Global Header)

```
Generate notification bell icon for global header (all screens).

LAYOUT:
- Icon: Material Symbol "notifications" (24px, primary color)
- Badge (if unread notifications > 0):
  - Circular, background #A43700, white text
  - Position: top-right corner of icon
  - Size: 20px diameter
  - Number: count of unread (1-99, or "99+" if >= 100)
- Interaction: Click → Open notifications dropdown

Dropdown menu (on click):
- Position: top-right of icon, 300px width
- Max height: 400px (scrollable)
- List: up to 5 most recent notifications
  - Each notification item:
    - Icon (left): order, contract, message, etc.
    - Title (Manrope 800, 13px)
    - Message snippet (Inter 400, 11px, gray, 1 line)
    - Timestamp: "hace 2 horas" (gray, tiny, right)
    - Unread indicator: blue dot (left of icon)
    - Hover: light background (#F9F9F9)
    - Click: navigate to related entity
- Link at bottom: "Ver todas" (primary color) → Full notifications page
- Empty state: "Sin notificaciones nuevas" (gray text, centered)

Notification types & icons:
- Order: "shopping_cart"
- Contract: "handshake"
- Message: "mail" (N/A MVP)
- System: "info"
```

### Full Notificaciones Page

```
Generate full notifications page for ZITEO (all roles).

LAYOUT:
- Header: "Notificaciones" (Manrope 800, 24px)
- Filter tabs:
  - Todas | Órdenes | Contratos | Mensajes (grayed out MVP)
  - Active: underline #A43700
- Notifications list (1 column, scrollable):
  - If empty: Placeholder "Sin notificaciones" + "Aquí aparecerán tus notificaciones"
  - Each notification card (white, 16px padding, rounded 12px, margin-bottom 8px):
    - Icon (left, 40x40px, gray background circular)
      - Material symbol based on type
    - Details (left, next to icon):
      - Title (Manrope 800, 14px)
      - Message (Inter 400, 12px, gray)
      - Timestamp (Inter 400, 10px, lighter gray)
    - Actions (right side):
      - Unread indicator (blue dot, if is_read=false)
      - Delete button: X (red on hover)
    - Click anywhere (except X) → navigate to related entity
      - If order: go to order detalle
      - If contract: go to contract detalle
      - If message: go to chat (N/A MVP)

- Bulk actions (optional, sticky top):
  - "Marcar todo como leído" link (primary, small)
  - "Eliminar leídos" link (primary, small, right)

- Interaction:
  - Click on notification: mark as read + navigate
  - Click X: delete + API DELETE
  - Click "Marcar todo como leído": API PATCH all to is_read=true

Bottom navigation: Show.
```

---

## 🎨 General Notes for All Screens

### Consistency Rules

1. **Colors:** Use ONLY ZITEO palette (see Base Prompt)
2. **Typography:**
   - Titles: Manrope 800
   - Body/labels: Inter 400
   - No custom font sizes beyond Tailwind scale
3. **Spacing:** 16px padding standard on cards, 24px on page sections
4. **Radius:** 12px on cards, 24px on large sections (ej: proyecto detalle)
5. **Icons:** Material Symbols only (stroke 1.5px, 24px default size)
6. **Bottom nav:** Always persistent (except in modals/fullscreen flows)
7. **Responsive:** Mobile 320px primary, tablet 768px fallback

### Mobile Interactions

- Tap targets: minimum 44px height
- Long-press: context menus (delete, edit, etc.)
- Swipe: dismiss modals (iOS standard)
- Pull-to-refresh: on scrollable lists
- Haptic feedback: (if device supports, on confirmation actions)

### Accessibility

- Alt text on all images
- Color not only differentiator (use status badges, icons)
- Sufficient contrast (WCAG AA minimum)
- Focus indicators on interactive elements

---

**Use these templates to generate Stitch prompts consistently throughout the project.**

**Fernando's rule:** If output deviates from design locked, use Figma file as source of truth, then update this template.

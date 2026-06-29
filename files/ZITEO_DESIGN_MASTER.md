# 🎨 ZITEO Design Master

**Versión:** 1.0 MVP  
**Fuente de verdad:** `diseño_completo_de_stitch_.md` (8406 líneas)  
**Owner:** Fernando (Design Lock) + Claude Code (Implementation)

---

## 🎯 Design Philosophy

- **Light mode only** (MVP) — Dark mode tokens reserved for post-launch
- **Mobile-first** → Tablet 768px → Desktop
- **Component reusability** — Stitch generates once, export to React library
- **Consistency** — No custom colors, fonts, spacing outside this spec
- **Accessibility** — WCAG AA minimum (sufficient contrast, readable text sizes)

---

## 🎨 Color Palette (Tailwind Config)

**Fuente:** `tailwind.config.js` extraída de `diseño_completo_de_stitch_.md`

### Primary Orange Ramp (handoff `Z` tokens)
```
primary:                   #a43700  (orangeDark — Main CTA / filled buttons)
accent / active:           #e8733a  (orange — accent, active states, gradient start)
brand gradient:            linear-gradient(135deg, #e8733a 0%, #a43700 100%)
primary-container:         #cd4700  (Darker, hover states)
primary-fixed:             #ffdbcf  (Light backgrounds)
primary-fixed-dim:         #ffb59a  (Dimmed primary)
on-primary:                #ffffff  (Text on primary bg)
on-primary-fixed:          #380d00  (Text on primary-fixed bg)
on-primary-fixed-variant:  #802a00  (Secondary text on primary-fixed)
inverse-primary:           #ffb59a  (Inverse mode, post-MVP)
```

### Secondary Blue Ramp
```
secondary:                 #4c616c  (Secondary actions)
secondary-container:       #cfe6f2  (Secondary backgrounds)
secondary-fixed:           #cfe6f2  (Light secondary bg)
secondary-fixed-dim:       #b4cad6  (Dimmed secondary)
on-secondary:              #ffffff  (Text on secondary)
on-secondary-container:    #526772  (Text in secondary container)
on-secondary-fixed:        #071e27  (Text on secondary-fixed)
on-secondary-fixed-variant:#354a53  (Secondary text)
```

### Tertiary Gold Ramp
```
tertiary:                  #7b5500  (Accents, highlights)
tertiary-container:        #9b6b00  (Tertiary backgrounds)
tertiary-fixed:            #ffdeac  (Light tertiary)
tertiary-fixed-dim:        #ffba38  (Dimmed tertiary)
on-tertiary:               #ffffff  (Text on tertiary)
on-tertiary-container:     #fffbff  (Text in container)
on-tertiary-fixed:         #281900  (Text on tertiary-fixed)
on-tertiary-fixed-variant: #604100  (Secondary text)
```

### Neutral Ramp (Backgrounds, Borders)
```
background:                #f9f9f9  (Main background, card bg)
surface:                   #f9f9f9  (Surfaces, same as background MVP)
surface-bright:            #f9f9f9  (Bright surfaces)
surface-dim:               #dadada  (Dimmed surfaces)
surface-container:         #eeeeee  (Container backgrounds)
surface-container-low:     #f3f3f3  (Low emphasis containers)
surface-container-high:    #e8e8e8  (High emphasis containers)
surface-container-highest: #e2e2e2  (Highest emphasis)
surface-container-lowest:  #ffffff  (Lowest, near white)
surface-variant:           #e2e2e2  (Variant surfaces)
surface-tint:              #a83900  (Tint overlay, rarely used)

on-background:             #1a1c1c  (Text on background)
on-surface:                #1a1c1c  (Primary text on surfaces)
on-surface-variant:        #5a4138  (Secondary text)
```

### Status & Semantic
```
error:                     #ba1a1a  (Errors, destructive actions)
error-container:           #ffdad6  (Error backgrounds)
on-error:                  #ffffff  (Text on error)
on-error-container:        #93000a  (Text in error container)
```

### Borders & Outlines
```
outline:                   #8f7066  (Default border stroke)
outline-variant:           #e3bfb2  (Light borders, dividers)
```

### Project Center Circle (Exclusive ZITEO)
```
project-center:            #FFF0EB  (Peach, center circle PROYECTOS tab)
```

---

## 📝 Typography

### Font Families (Imported via Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
```

### Font Stack
```css
font-headline: ["Space Grotesk"]  /* 500, 600, 700 weights — display headlines */
font-body:     ["Manrope"]        /* 400–800 weights — body */
font-label:    ["Manrope"]        /* 400–600 weights — labels */
```

### Size & Weight Scale

| Use Case | Font | Size | Weight | CSS Class |
|----------|------|------|--------|-----------|
| Hero title | Space Grotesk | 3.75rem (60px) | 700 | `text-6xl font-headline font-bold` |
| Page heading | Space Grotesk | 2rem (32px) | 700 | `text-3xl font-headline font-bold` |
| Section title | Space Grotesk | 1.5rem (24px) | 600 | `text-2xl font-headline font-semibold` |
| Card title | Manrope | 1rem (16px) | 700 | `text-lg font-bold` |
| Body text | Manrope | 1rem (16px) | 400 | `text-base` |
| Label/caption | Manrope | 0.875rem (14px) | 400 | `text-sm` |
| Small text | Manrope | 0.75rem (12px) | 400 | `text-xs` |
| Overline | Manrope | 0.75rem (12px) | 600 | `text-xs font-semibold` |

### Line Height
```
Headlines: 1.2 (tight)
Body: 1.5 (relaxed)
Labels: 1.4 (default)
```

---

## 🔲 Spacing (Tailwind)

```javascript
spacing: {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
}
```

**Aplicación:**
- **Padding card:** `p-4` (16px) o `px-4 py-3`
- **Margin elemento:** `mb-4` (16px), `gap-4`
- **Border radius:** `rounded-lg` (12px standard)

---

## ⭕ Border Radius

```javascript
borderRadius: {
  DEFAULT: "0.25rem",  // 4px (micro)
  lg: "0.5rem",        // 8px (standard)
  xl: "0.75rem",       // 12px (medium)
  full: "9999px",      // pill shape
}
```

**Uso:**
- Micro details: default
- Cards, inputs: `rounded-lg`
- Buttons, containers: `rounded-xl`
- Pills (circular badges): `rounded-full`

---

## 📏 Responsive Breakpoints

```javascript
screens: {
  'sm': '640px',   // tablet
  'md': '768px',   // tablet large
  'lg': '1024px',  // desktop
  'xl': '1280px',  // desktop large
}
```

**Mobile-first approach:**
```html
<!-- Default: mobile 320px -->
<div class="w-full h-48">
  <!-- tablet+: change height -->
  <div class="md:h-64">Content</div>
</div>

<!-- Example: grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 1 column mobile, 2 tablet, 3 desktop -->
</div>
```

---

## 🧩 Reusable Components

### 1. Bottom Navigation (Persistent)

**Constructor:**
```html
<nav class="fixed bottom-0 left-0 right-0 border-t border-outline-variant flex justify-around bg-surface">
  <button class="flex-1 py-4 text-center font-label text-sm hover:bg-surface-container transition-colors">
    <span class="material-symbols-outlined block mx-auto mb-1 text-primary">shopping_cart</span>
    <span>TIENDA</span>
  </button>
  <button class="flex-1 py-4 text-center font-label text-sm border-l border-r border-outline-variant hover:bg-surface-container transition-colors">
    <span class="material-symbols-outlined block mx-auto mb-1 text-primary">folder</span>
    <span>PROYECTOS</span>
  </button>
  <button class="flex-1 py-4 text-center font-label text-sm hover:bg-surface-container transition-colors">
    <span class="material-symbols-outlined block mx-auto mb-1 text-primary">handshake</span>
    <span>CONTRATAR</span>
  </button>
</nav>
```

**Safe area padding (bottom of main content):**
```html
<main class="pb-20">
  <!-- Content scrolls above bottom nav -->
</main>
```

### 2. Product Card

```html
<div class="rounded-lg bg-surface-container p-4 hover:shadow-md transition-shadow">
  <!-- Image -->
  <div class="w-full h-40 bg-surface-container-low rounded-lg mb-3 overflow-hidden">
    <img class="w-full h-full object-cover" src="..." alt="producto"/>
  </div>
  
  <!-- Title -->
  <h3 class="font-headline font-bold text-lg text-on-surface mb-2">Cemento Portland 50kg</h3>
  
  <!-- Provider (gray, secondary text) -->
  <p class="font-body text-sm text-on-surface-variant mb-3">Ferretería La Paz</p>
  
  <!-- Price (primary color, bold) -->
  <div class="flex items-baseline gap-2 mb-4">
    <span class="font-headline font-bold text-xl text-primary">$150</span>
    <span class="font-body text-xs text-on-surface-variant">por bolsa</span>
  </div>
  
  <!-- Stock status badge -->
  <span class="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-label mb-3">
    En stock ✓
  </span>
  
  <!-- Quantity selector (inline on card) -->
  <div class="flex items-center gap-2">
    <button class="px-2 py-1 border border-outline rounded text-on-surface-variant">−</button>
    <input type="number" min="1" value="1" class="w-12 text-center border border-outline rounded"/>
    <button class="px-2 py-1 border border-outline rounded text-on-surface-variant">+</button>
  </div>
</div>
```

### 3. Form Input

```html
<div class="mb-4">
  <label class="block font-label text-sm font-semibold text-on-surface mb-2">
    Nombre completo
  </label>
  <input 
    type="text"
    placeholder="Juan Pérez"
    class="w-full px-4 py-3 border border-outline rounded-lg font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
  />
</div>
```

### 4. Button Variants

**Primary (CTA):**
```html
<button class="w-full px-4 py-3 bg-primary text-on-primary font-label font-semibold rounded-lg hover:bg-primary-container transition-colors">
  Agregar al carrito
</button>
```

**Secondary (outline):**
```html
<button class="w-full px-4 py-3 border-2 border-primary text-primary font-label font-semibold rounded-lg hover:bg-primary-fixed transition-colors">
  Ver similares
</button>
```

**Tertiary (text-only):**
```html
<button class="px-4 py-2 text-primary font-label font-semibold hover:underline">
  Más opciones
</button>
```

**Disabled:**
```html
<button disabled class="w-full px-4 py-3 bg-surface-container text-on-surface-variant font-label font-semibold rounded-lg cursor-not-allowed">
  Continuar
</button>
```

### 5. Modal / Bottom Sheet

```html
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
  <div class="w-full bg-surface rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-headline font-bold text-2xl text-on-surface">Título</h2>
      <button class="text-on-surface-variant hover:text-on-surface">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    
    <!-- Content -->
    
    <!-- CTAs at bottom (sticky) -->
    <div class="fixed bottom-6 left-6 right-6 flex gap-3">
      <button class="flex-1 ...">Cancelar</button>
      <button class="flex-1 ...">Confirmar</button>
    </div>
  </div>
</div>
```

### 6. Status Badge

```html
<!-- Success -->
<span class="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-label font-semibold">
  <span class="material-symbols-outlined text-sm">check_circle</span> Entregado
</span>

<!-- Pending -->
<span class="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-label font-semibold">
  <span class="material-symbols-outlined text-sm">schedule</span> Pendiente
</span>

<!-- Error -->
<span class="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-label font-semibold">
  <span class="material-symbols-outlined text-sm">error</span> Rechazado
</span>
```

### 7. Rating Stars

```html
<div class="flex items-center gap-1">
  <span class="material-symbols-outlined text-amber-500">star</span>
  <span class="material-symbols-outlined text-amber-500">star</span>
  <span class="material-symbols-outlined text-amber-500">star</span>
  <span class="material-symbols-outlined text-amber-500">star</span>
  <span class="material-symbols-outlined text-surface-variant">star</span>
  <span class="font-label text-sm text-on-surface-variant ml-2">4.8 (125 reseñas)</span>
</div>
```

---

## 🎬 Animations & Transitions

**Utilizar solo Tailwind utilities:**

```html
<!-- Hover effect -->
<button class="hover:bg-primary-container transition-colors duration-200">Cambiar color</button>

<!-- Opacity -->
<div class="opacity-0 hover:opacity-100 transition-opacity">Fade in</div>

<!-- Scale -->
<button class="hover:scale-105 active:scale-95 transition-transform">Presionable</button>

<!-- Animated loading -->
<div class="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
  <div class="h-full bg-primary w-1/3 rounded-full animate-pulse"></div>
</div>
```

**NO custom animations** (excepto en Sprint 4+ si se aprueba).

---

## 🌳 Component Tree (MVP)

```
App
├── Auth (Splash, Welcome, Login, Register)
│   └── LoginForm / RegisterForm
├── Layout (Main shell)
│   ├── Header
│   ├── TabNav (persistent bottom nav)
│   └── Content (scrollable)
├── Constructor Dashboard
│   ├── Tienda
│   │   ├── SearchBar
│   │   ├── CategoryCarousel
│   │   │   └── ProductCard
│   │   └── Cart (modal)
│   ├── Proyectos
│   │   ├── ProjectList
│   │   │   └── ProjectCard
│   │   └── ProjectDetail
│   │       └── MaterialsList
│   └── Contratar
│       ├── MaestroSearch
│       │   └── MaestroCard
│       └── ContractDetail
├── Proveedor Dashboard
│   ├── Pedidos
│   │   └── OrderCard (con timer)
│   └── Inventario
│       ├── ProductList
│       └── ProductForm
└── Maestro Dashboard
    ├── Perfil
    ├── Contratos
    │   └── ContractDetail (con botones)
    └── Ratings
```

---

## 📐 Spacing Reference

**Typical card layout:**
```
┌─────────────────────┐
│  ↕ p-4 (16px)       │ ← padding
│ ┌─────────────────┐ │
│ │   Image (h-40) │ │
│ └─────────────────┘ ↕ mb-3
│                     │
│ Title               │ ← mt-0 (default)
│ ↕ mb-2 (8px)        │
│                     │
│ Description         │
│ ↕ mb-4              │
│                     │
│ [CTA Buttons]       │
│                     │
└─────────────────────┘
```

---

## ✅ Design QA Checklist

Antes de mergear un componente:

- [ ] Colores = SOLO tokens ZITEO (no hardcoded)
- [ ] Tipografía = Space Grotesk 700 (headlines) | Manrope 400 (body)
- [ ] Spacing = múltiplos de 4px
- [ ] Icons = Material Symbols únicamente
- [ ] Responsive = mobile 320px + tablet 768px tested
- [ ] Contrast = WCAG AA (4.5:1 para texto)
- [ ] Touch targets = mínimo 44px altura
- [ ] Bottom nav = presente (excepto modals)
- [ ] No custom CSS = Tailwind utilities only
- [ ] Accessibility = alt text, focus states, semantic HTML

---

## 🔗 Referencias

**Archivo de diseño original:** `/mnt/project/diseño_completo_de_stitch_.md` (8406 líneas, source of truth)

**Mapa de componentes:** `/mnt/project/ZITEO_COMPONENT_INVENTORY.md`

**Reglas Claude Code:** `claude.md` (sigue estas reglas al implementar)

**Figma:** `4D25Fz61d1JrsfsNWf1Ydo` (si necesitas resolver ambigüedades)

---

**Esta es la brújula visual. Todos los componentes deben adherirse a este spec.**

**Fernando:** Design está locked. Cambios post-MVP via feature branches + approval.

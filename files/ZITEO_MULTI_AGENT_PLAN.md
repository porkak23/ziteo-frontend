# 🤖 ZITEO MULTI-AGENT ORCHESTRATION PLAN
**Objetivo**: Desarrollo senior-style con Claude Code como orchestrator principal

---

## 🎯 PHASE 0: Setup (Today)

### 1. Repository Structure
```
ziteo-platform/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/        (LOGIN)
│   │   │   ├── Store/       (CONSTRUCTOR dashboard)
│   │   │   ├── Orders/      (FERRETERO dashboard)
│   │   │   ├── Contractors/ (MAESTRO search + hire)
│   │   │   └── Shared/      (Nav, Cards, Modals)
│   │   ├── pages/
│   │   ├── context/         (State management)
│   │   ├── hooks/
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── contractors.js
│   ├── models/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
├── ZITEO_AUDIT_MVP.md
├── API_MOCKS.md            (NEW)
└── COMPONENT_INVENTORY.md  (NEW)
```

### 2. Stitch Decomposition
**Input**: `diseño_completo_de_stitch_.md` (8406 líneas)
**Output**: Modular React components

**Sections to Extract**:
- Lines 1-1043: Login → `Auth/` folder (Splash, Welcome, Auth forms)
- Lines 1045-4377: Store → `Store/` folder (ProductCard, CarouselSection, Cart)
- Lines 4379-7006: Orders → `Orders/` folder (OrderCard, Timer, IA modes)
- Lines 7563-8405: Contractors → `Contractors/` folder (ContractorCard, SearchBar)
- **Lines 7008-7561**: SKIP (Chofer - desactivado)

**Naming Convention**:
- `Auth.jsx`, `SplashScreen.jsx`, `WelcomeScreen.jsx`, `LoginForm.jsx`
- `ProductCard.jsx`, `CarouselSection.jsx`, `CartSummary.jsx`
- `OrderCard.jsx`, `TimerVisual.jsx`, `LoadingModes.jsx`
- `ContractorCard.jsx`, `ContractorSearch.jsx`, `HireModal.jsx`

### 3. Design Tokens Export
**File**: `src/theme/tokens.js`
```javascript
export const colors = {
  primary: '#A43700',
  background: '#F9F9F9',
  projectCenter: '#FFF0EB',
};

export const typography = {
  headline: 'Manrope 800',
  body: 'Inter 400',
};

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
};
```

---

## 🔧 PHASE 1: Component Extraction & Refactoring
**Owner**: Claude Code (Agent-Frontend)
**Timeline**: Days 1-2

### Subtask 1.1: Auth Components
```
INPUT:  diseño_completo_de_stitch_.md (lines 1-1043)
OUTPUT: 
  - Auth/SplashScreen.jsx      (loading bar temática)
  - Auth/WelcomeScreen.jsx     (foto obrero boliviano + 2 CTAs)
  - Auth/LoginForm.jsx         (número + PIN + biometría + SSO)
  - Auth/RegisterForm.jsx      (3 pasos: número → nombre/ciudad → rol)
  - Auth/PINRecovery.jsx       (SMS recovery)
  - Auth/RoleSelector.jsx      (panel avatar múltiples roles)

ACCEPTANCE CRITERIA:
  ✓ Componentes reutilizables (no UI hardcoded)
  ✓ Props para input (onSubmit, loading, error)
  ✓ Design tokens aplicados (#A43700, Manrope, etc)
  ✓ Sin lógica backend (mocks después)
```

### Subtask 1.2: Store Components
```
INPUT:  diseño_completo_de_stitch_.md (lines 1045-4377)
OUTPUT:
  - Store/ProductCard.jsx          (imagen, nombre, precio, botón)
  - Store/CategoryCarousel.jsx    (4 categorías con scroll)
  - Store/OffersCarousel.jsx      (carrusel separador)
  - Store/MaestrosSection.jsx     (maestros disponibles)
  - Store/FerreteriasSection.jsx  (ferreterías cercanas)
  - Store/CartSummary.jsx         (items + total + checkout btn)
  - Store/StoreDashboard.jsx      (layout completo)
  - Store/SearchBar.jsx           (filtrado + búsqueda)

ACCEPTANCE CRITERIA:
  ✓ Carrusel responsivo (Tailwind carousel)
  ✓ Switch comprar/alquilar funcional (state-driven)
  ✓ Producto center círculo #FFF0EB ✓
  ✓ Props: products[], onAddCart, onSelectProduct
```

### Subtask 1.3: Orders Components (Ferretero)
```
INPUT:  diseño_completo_de_stitch_.md (lines 4379-7006)
OUTPUT:
  - Orders/OrderCard.jsx         (orden + status + botones)
  - Orders/TimerVisual.jsx       (gradual visual timer)
  - Orders/LoadingModes.jsx      (foto/voz/manual selector)
  - Orders/InventoryEditor.jsx   (inline editing)
  - Orders/StatsPanel.jsx        (stats día al tope)
  - Orders/PriceAdjuster.jsx     (ajuste precio mercado 1 toque)
  - Orders/TruckRequest.jsx      (solicitar camión post-confirmación)
  - Orders/OrderDashboard.jsx    (layout completo)

ACCEPTANCE CRITERIA:
  ✓ Timer visual (CSS animation o library)
  ✓ Inline edits sin modal (contentEditable o form inline)
  ✓ IA modes: foto upload, audio input, manual text
  ✓ Props: orders[], onUpdateOrder, onRequestTruck
```

### Subtask 1.4: Contractor Components (Maestro)
```
INPUT:  diseño_completo_de_stitch_.md (lines 7563-8405)
OUTPUT:
  - Contractors/ContractorCard.jsx   (foto, nombre, rating, tarifa)
  - Contractors/ContractorSearch.jsx (búsqueda + filtros)
  - Contractors/HireModal.jsx        (modal solicitar + calendario)
  - Contractors/ContractorDashboard.jsx (trabajos disponibles + perfil)

ACCEPTANCE CRITERIA:
  ✓ Card muestra: avatar, nombre, rating (⭐), especialidad, tarifa/hora
  ✓ Search by nombre, especialidad, disponibilidad
  ✓ Modal: fecha inicio, detalles trabajo, presupuesto
  ✓ Props: contractors[], onHire
```

### Subtask 1.5: Shared Components
```
OUTPUT:
  - Shared/Nav.jsx            (TIENDA·PROYECTOS·CONTRATAR para Constructor)
                              (PEDIDOS·INVENTARIO·INTEL para Ferretero)
                              (TRABAJOS·DISPONIBLES·PERFIL para Maestro)
  - Shared/Header.jsx         (logo + avatar dropdown)
  - Shared/Modal.jsx          (base reusable)
  - Shared/Toast.jsx          (notificaciones)
  - Shared/Button.jsx         (primary, secondary, destructive)
  - Shared/Input.jsx          (text, number, select)
  - Shared/FormField.jsx      (label + input + error)

ACCEPTANCE CRITERIA:
  ✓ Nav: routing-aware (active state)
  ✓ Modal: closeBtn, size variants (sm, md, lg)
  ✓ Toast: auto-dismiss (3s), position (top-right)
```

---

## 🗂️ PHASE 2: State Management & Context Setup
**Owner**: Claude Code (Agent-State)
**Timeline**: Day 2

### 2.1 Context Structure
```javascript
// AuthContext.js
export const AuthContext = {
  user: { id, name, role, phone, city },
  isAuthenticated: bool,
  login: (phone, pin) => Promise,
  logout: () => void,
};

// StoreContext.js
export const StoreContext = {
  products: [],
  cart: { items: [], total: 0 },
  filters: { category, priceRange, availability },
  addToCart: (productId, qty) => void,
  removeFromCart: (itemId) => void,
  updateCart: (itemId, qty) => void,
  checkout: () => Promise,
};

// OrderContext.js (Ferretero)
export const OrderContext = {
  orders: [],
  selectedOrder: null,
  updateOrderStatus: (orderId, status) => void,
  updateInventory: (productId, qty) => void,
  requestTruck: (orderId) => Promise,
  adjustPrice: (orderId, newPrice) => void,
};

// ContractorContext.js
export const ContractorContext = {
  contractors: [],
  searchResults: [],
  search: (query, filters) => void,
  hire: (contractorId, jobDetails) => Promise,
  requestedJobs: [],
};
```

### 2.2 Redux Alternative (Optional)
Si prefieres Redux:
```
store/
├── slices/
│   ├── authSlice.js
│   ├── storeSlice.js
│   ├── orderSlice.js
│   └── contractorSlice.js
└── store.js
```

---

## 🔌 PHASE 3: Backend Mocks & API Layer
**Owner**: Claude Code (Agent-Backend)
**Timeline**: Days 2-3

### 3.1 Mock Data Structure
```javascript
// backend/data/mocks.js

// USERS
const users = {
  constructor_001: {
    id: 'constructor_001',
    name: 'Juan Pérez',
    role: 'constructor',
    phone: '+591-70000000',
    city: 'La Paz',
    projects: ['proj_001', 'proj_002'],
  },
  ferretero_001: {
    id: 'ferretero_001',
    name: 'Carlos Ferretería',
    role: 'ferretero',
    phone: '+591-71000000',
    city: 'La Paz',
    business: 'Ferretería Central',
  },
  maestro_001: {
    id: 'maestro_001',
    name: 'Roberto Electricista',
    role: 'maestro',
    phone: '+591-72000000',
    city: 'La Paz',
    specialties: ['electricidad', 'plomería'],
    rating: 4.8,
    completedJobs: 47,
    hourlyRate: 80,
  },
};

// PRODUCTS
const products = [
  {
    id: 'prod_001',
    name: 'Cemento Portland 50kg',
    category: 'materiales',
    buyPrice: 85,
    rentPrice: 5,
    rentUnit: 'día',
    stock: 50,
    ferreteriaId: 'ferretero_001',
    image: 'url',
  },
  // ... 20 más
];

// ORDERS
const orders = [
  {
    id: 'order_001',
    constructorId: 'constructor_001',
    ferreteriaId: 'ferretero_001',
    items: [
      { productId: 'prod_001', qty: 10, subtotal: 850 }
    ],
    total: 850,
    status: 'pending',  // pending, confirmed, ready, collected
    createdAt: '2026-03-31T10:00:00Z',
    estimatedPickup: '2026-04-01T14:00:00Z',
  },
];

// CONTRACTORS
const contractors = [
  {
    id: 'maestro_001',
    name: 'Roberto Electricista',
    rating: 4.8,
    completedJobs: 47,
    specialties: ['electricidad', 'plomería'],
    hourlyRate: 80,
    availability: ['2026-04-01', '2026-04-02'], // ISO dates
  },
];

// HIRE REQUESTS
const hireRequests = [
  {
    id: 'hire_001',
    constructorId: 'constructor_001',
    contractorId: 'maestro_001',
    jobTitle: 'Instalación eléctrica',
    description: 'Instalar acometida en proyecto residencial',
    startDate: '2026-04-05',
    endDate: '2026-04-06',
    budget: 500,
    status: 'pending', // pending, accepted, in-progress, completed
    createdAt: '2026-03-31T11:00:00Z',
  },
];
```

### 3.2 API Endpoints (Express mocks)
```javascript
// backend/routes/auth.js
POST   /api/auth/login           → { user, token }
POST   /api/auth/register        → { user, token }
POST   /api/auth/verify-otp      → { token }
POST   /api/auth/recover-pin     → { message }
GET    /api/auth/me              → { user }

// backend/routes/products.js
GET    /api/products             → { products[] }
GET    /api/products?category=   → { products[] }
GET    /api/products/:id         → { product }
POST   /api/products/search      → { results[] }

// backend/routes/orders.js
POST   /api/orders               → { order }
GET    /api/orders               → { orders[] (filtered by role) }
GET    /api/orders/:id           → { order }
PATCH  /api/orders/:id/status    → { order }
PATCH  /api/orders/:id/inventory → { order }
POST   /api/orders/:id/truck     → { truck_request }

// backend/routes/contractors.js
GET    /api/contractors          → { contractors[] }
GET    /api/contractors/search   → { results[] }
GET    /api/contractors/:id      → { contractor }
POST   /api/hire-requests        → { hireRequest }
PATCH  /api/hire-requests/:id    → { hireRequest }
```

### 3.3 Error Handling
```javascript
// Responses
{
  success: true,
  data: { ... },
  message: "Optional message"
}

{
  success: false,
  error: 'ERROR_CODE',
  message: 'Human readable message'
}

// Error Codes
- AUTH_INVALID_CREDENTIALS
- AUTH_USER_NOT_FOUND
- PRODUCT_NOT_FOUND
- ORDER_NOT_FOUND
- INSUFFICIENT_STOCK
- CONTRACTOR_UNAVAILABLE
```

---

## 🔄 PHASE 4: API Layer Integration
**Owner**: Claude Code (Agent-Frontend)
**Timeline**: Day 3

### 4.1 API Service Layer
```javascript
// src/services/api.js
class ApiService {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
  }

  // Auth
  async login(phone, pin) { ... }
  async register(data) { ... }
  async logout() { ... }

  // Products
  async getProducts(filters) { ... }
  async getProductById(id) { ... }
  async searchProducts(query) { ... }

  // Orders
  async createOrder(items, deliveryDetails) { ... }
  async getMyOrders() { ... }
  async updateOrderStatus(orderId, status) { ... }
  async requestTruck(orderId) { ... }

  // Contractors
  async getContractors(filters) { ... }
  async searchContractors(query) { ... }
  async hireContractor(contractorId, jobDetails) { ... }
}

export const api = new ApiService();
```

### 4.2 Hook Usage (Frontend)
```javascript
// src/hooks/useAuth.js
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const login = async (phone, pin) => {
    setLoading(true);
    try {
      const { user, token } = await api.login(phone, pin);
      setUser(user);
      localStorage.setItem('token', token);
      return user;
    } finally {
      setLoading(false);
    }
  };
  
  return { user, loading, login, logout };
};

// Uso en componentes
function LoginForm() {
  const { login, loading } = useAuth();
  
  const handleSubmit = async (formData) => {
    await login(formData.phone, formData.pin);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## ✅ PHASE 5: Integration Testing & Flow Verification
**Owner**: Claude Code (Agent-QA)
**Timeline**: Day 4

### 5.1 E2E Flow Tests
```
FLOW 1: Constructor Buy Material
  1. Login (Constructor role) ✓
  2. Tap TIENDA ✓
  3. Buscar cemento ✓
  4. Agregar 10 unidades al carrito ✓
  5. Tap Checkout ✓
  6. Confirmar ubicación (Ej: Av. Mariscal) ✓
  7. Ver confirmación + ID orden ✓
  8. Ferretero ve orden en PEDIDOS ✓

FLOW 2: Ferretero Prepare Order + Timer
  1. Login (Ferretero role) ✓
  2. Tap PEDIDOS ✓
  3. Ver orden pendiente + timer ✓
  4. Tap modo IA (foto/voz/manual) ✓
  5. Cargar inventario ✓
  6. Ajustar precio (1 toque) ✓
  7. Marcar como "ready" ✓
  8. Constructor ve "ready" en app ✓

FLOW 3: Constructor Hire Maestro
  1. Login (Constructor role) ✓
  2. Tap CONTRATAR ✓
  3. Buscar "electricista" ✓
  4. Ver contratista: nombre, rating, tarifa ✓
  5. Tap para ver detalle ✓
  6. Tap "Solicitar" → Modal con fecha + detalles ✓
  7. Enviar solicitud ✓
  8. Maestro ve en app + puede aceptar ✓
```

### 5.2 Component Unit Tests
```
Auth/ components:
  ✓ LoginForm: submit con PIN válido/inválido
  ✓ SplashScreen: loading bar animación
  ✓ RoleSelector: cambio de rol

Store/ components:
  ✓ ProductCard: click → onSelectProduct callback
  ✓ CarouselSection: swipe navigation
  ✓ CartSummary: actualizar quantities

Orders/ components:
  ✓ TimerVisual: countdown animation
  ✓ LoadingModes: foto/voz/manual toggle
  ✓ OrderCard: status color changes

Contractors/ components:
  ✓ ContractorCard: rating display
  ✓ HireModal: date picker, form validation
```

---

## 🎯 AGENT RESPONSIBILITIES

| Agent | Role | Key Tasks |
|-------|------|-----------|
| **Claude Code Main** | Orchestrator | Coordina todos agents, merge PRs, QA final |
| **Agent-Frontend** | UI/Components | Extract Stitch → React, design token integration |
| **Agent-State** | State Mgmt | Context/Redux setup, data flow |
| **Agent-Backend** | API/Mocks | Routes, mock data, error handling |
| **Agent-QA** | Testing | E2E flows, component tests, bug reports |
| **Agent-Docs** | Documentation | API docs, component storybook, README |

---

## 📊 METRICS & CHECKPOINTS

### Day 1 (Checkpoint 1)
- [ ] Components extracted: 15+ JSX files
- [ ] Token coverage: >80% (colors, typography)
- [ ] Zero TS errors
- [ ] Storybook running (optional but recommended)

### Day 2 (Checkpoint 2)
- [ ] Context/Redux setup complete
- [ ] All mocks data defined
- [ ] API routes operational (postman tested)
- [ ] Frontend ↔ Backend integration started

### Day 3 (Checkpoint 3)
- [ ] 3 main flows functional (buy, prepare, hire)
- [ ] E2E tests passing
- [ ] Mobile responsive verified
- [ ] Load time <2s (target)

### Day 4 (Checkpoint 4)
- [ ] Alpha build ready (QA sign-off)
- [ ] Bug list < 5 critical
- [ ] User testing eligible
- [ ] Deployment prep

---

## 🚀 DEPLOYMENT (Phase 5.1)
**Tool**: Antigravity (deployment orchestrator)
- Vercel frontend (auto-deploy on PR merge)
- Railway/Heroku backend (mocked → real DB)
- Environment vars: dev, staging, prod

---

## 📌 TOKEN OPTIMIZATION NOTES
- Use Claude cache para: componentes reutilizables, mock data, API schemas
- Refactor en vez de reescribir (máximo 1.5x contexto por agent)
- Commit granular: 1 feature per commit (facilita rollback)
- Review corto: máximo 20 líneas de diff por PR

import { useState, useEffect, useRef } from 'react'
import { CategoryChip } from './CategoryChip'
import { ProductCard } from './ProductCard'
import { ProductDetailScreen } from './ProductDetailScreen'
import { CartDrawer } from './CartDrawer'
import { FilterSheet } from './FilterSheet'
import { SurtidoRapidoSheet } from './SurtidoRapidoSheet'
import type { ProductCard as ProductCardType, TiendaFilters, ConstructionStage } from '../types/tiendaTypes'
import { useCategories, useProducts, TIENDA_PAGE_SIZE } from '../hooks/useTienda'
import { useCart } from '../hooks/useCart'

// ─── Construction stages ──────────────────────────────────────────────────────

const CONSTRUCTION_STAGES: {
  id: ConstructionStage
  label: string
  subtitle: string
  icon: string
  bg: string
  iconColor: string
  activeBg: string
}[] = [
  {
    id: 'fundaciones',
    label: 'Fundaciones',
    subtitle: 'Hierro, cemento, arena',
    icon: 'foundation',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    activeBg: 'bg-amber-500',
  },
  {
    id: 'muros',
    label: 'Muros',
    subtitle: 'Ladrillo, bloques, mezcla',
    icon: 'holiday_village',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    iconColor: 'text-slate-600 dark:text-slate-300',
    activeBg: 'bg-slate-600',
  },
  {
    id: 'techos',
    label: 'Techos',
    subtitle: 'Calaminas, vigas, impermeabilizante',
    icon: 'roofing',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    activeBg: 'bg-blue-600',
  },
  {
    id: 'terminaciones',
    label: 'Terminaciones',
    subtitle: 'Pintura, cerámicos, sanitarios',
    icon: 'format_paint',
    bg: 'bg-green-50 dark:bg-green-950/40',
    iconColor: 'text-green-600 dark:text-green-400',
    activeBg: 'bg-green-600',
  },
]

// ─── Category groups ──────────────────────────────────────────────────────────

const CATEGORY_GROUPS = [
  {
    id: 'materiales',
    label: 'Materiales',
    icon: 'foundation',
    bg: 'bg-orange-surface dark:bg-orange-surface/20',
    activeBg: 'bg-primary',
    keywords: ['cemento', 'arena', 'grava', 'ladrillo', 'bloque', 'yeso', 'pintura', 'madera', 'acero', 'varilla', 'alambre', 'tubería', 'caño', 'vidrio', 'baldosa', 'azulejo', 'porcelanato', 'material'],
  },
  {
    id: 'herramientas',
    label: 'Herramientas',
    icon: 'hardware',
    bg: 'bg-blue-surface dark:bg-blue-surface/20',
    activeBg: 'bg-primary',
    keywords: ['martillo', 'destornillador', 'llave', 'taladro', 'sierra', 'nivel', 'metro', 'carretilla', 'pala', 'pico', 'mezcladora', 'llana', 'espátula', 'herramienta'],
  },
  {
    id: 'maquinaria',
    label: 'Maquinaria',
    icon: 'precision_manufacturing',
    bg: 'bg-yellow-surface dark:bg-yellow-surface/20',
    activeBg: 'bg-primary',
    keywords: ['retroexcavadora', 'grúa', 'compactadora', 'hormigonera', 'generador', 'andamio', 'elevador', 'compresor', 'bulldozer', 'maquinaria', 'máquina'],
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    icon: 'safety_check',
    bg: 'bg-red-surface dark:bg-red-surface/20',
    activeBg: 'bg-primary',
    keywords: ['casco', 'guante', 'bota', 'chaleco', 'gafa', 'mascarilla', 'arnés', 'señalización', 'seguridad', 'epp'],
  },
]

// ─── Promo banners ────────────────────────────────────────────────────────────

const PROMO_BANNERS = [
  {
    id: 0,
    title: 'Cemento y áridos',
    subtitle: 'Los mejores precios directos del proveedor',
    cta: 'Ver materiales',
    group: 'materiales',
    from: 'var(--color-primary)',
    to: 'var(--color-primary-dark)',
  },
  {
    id: 1,
    title: 'Herramientas Pro',
    subtitle: 'Todo lo que tu obra necesita',
    cta: 'Ver catálogo',
    group: 'herramientas',
    from: 'var(--color-on-background)',
    to: 'var(--color-surface-container)',
  },
  {
    id: 2,
    title: 'Entrega en tu ciudad',
    subtitle: 'Choferes certificados llevan tu pedido',
    cta: 'Pedir ahora',
    group: null,
    from: 'var(--color-success)',
    to: 'var(--color-success-dark)',
  },
]

// ─── Provider store header with badges ───────────────────────────────────────

function ProviderStoreHeader({
  product,
  onSurtido,
}: {
  product: ProductCardType
  onSurtido: (providerId: string, providerName: string) => void
}) {
  const { store_name, is_verified, city, min_order_amount, delivery_time_hours, free_shipping_threshold } = product.proveedor
  const proveedorInitial = store_name.charAt(0).toUpperCase()
  const hasBadges = min_order_amount != null || delivery_time_hours != null || free_shipping_threshold != null

  return (
    <div className="bg-surface-container rounded-2xl px-4 py-3 flex flex-col gap-2">
      {/* Store name row */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="font-label font-bold text-primary text-sm leading-none">{proveedorInitial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-label font-semibold text-on-surface text-sm truncate">{store_name}</span>
            {is_verified && (
              <span
                className="material-symbols-outlined text-sm text-primary shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-on-surface-variant text-xs leading-none">location_on</span>
            <span className="font-body text-xs text-on-surface-variant">{city}</span>
          </div>
        </div>
        {/* Surtido rápido button */}
        <button
          type="button"
          onClick={() => onSurtido(product.proveedor.user_id, store_name)}
          className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1.5 font-label text-xs font-semibold shrink-0 active:opacity-70 transition-opacity"
          aria-label="Surtir pedido rápido"
        >
          <span className="text-xs leading-none">⚡</span>
          Surtir pedido
        </button>
      </div>

      {/* Badges row */}
      {hasBadges && (
        <div className="flex gap-2 flex-wrap">
          {min_order_amount != null && (
            <span className="flex items-center gap-1 bg-background rounded-full px-2.5 py-1 border border-outline-variant font-label text-xs text-on-surface-variant">
              <span
                className="material-symbols-outlined text-xs leading-none text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shopping_bag
              </span>
              Mín Bs.{min_order_amount.toLocaleString('es-BO')}
            </span>
          )}
          {delivery_time_hours != null && (
            <span className="flex items-center gap-1 bg-background rounded-full px-2.5 py-1 border border-outline-variant font-label text-xs text-on-surface-variant">
              <span
                className="material-symbols-outlined text-xs leading-none text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                schedule
              </span>
              Entrega {delivery_time_hours}h
            </span>
          )}
          {free_shipping_threshold != null && (
            <span className="flex items-center gap-1 bg-background rounded-full px-2.5 py-1 border border-outline-variant font-label text-xs text-on-surface-variant">
              <span
                className="material-symbols-outlined text-xs leading-none text-green-600"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
              Gratis +Bs.{free_shipping_threshold.toLocaleString('es-BO')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Featured product card (horizontal scroll) ────────────────────────────────

function FeaturedCard({
  product,
  onPress,
}: {
  product: ProductCardType
  onPress: () => void
}) {
  const addItem = useCart((s) => s.addItem)
  const cartItem = useCart((s) => s.items.find((i) => i.productId === product.id))
  const inCart = !!cartItem

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      sellerId: product.proveedor.user_id,
      imageUrl: product.image_url ?? undefined,
    })
  }

  return (
    <button
      onClick={onPress}
      aria-label={`Ver detalles de ${product.name}`}
      className="shrink-0 w-40 flex flex-col bg-surface rounded-2xl border border-outline-variant overflow-hidden text-left active:opacity-80 active:scale-[0.98] transition-[opacity,transform] cursor-pointer"
    >
      <div className="h-28 w-full bg-surface-container flex items-center justify-center overflow-hidden relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">inventory_2</span>
        )}
        {inCart && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <span className="font-label text-[10px] font-bold text-white leading-none">{cartItem.quantity}</span>
          </span>
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="font-label font-semibold text-on-surface text-xs line-clamp-2 leading-tight">{product.name}</p>
        <span className="font-headline font-black text-primary text-sm leading-none">
          Bs. {product.price.toLocaleString('es-BO')}
        </span>
        <div
          onClick={(e) => {
            e.stopPropagation()
            handleAdd(e)
          }}
          className="mt-auto flex items-center justify-center gap-1 w-full rounded-xl py-1.5 bg-primary text-white text-[11px] font-label font-bold active:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs leading-none">add</span>
          Agregar
        </div>
      </div>
    </button>
  )
}

// ─── Ad slot ─────────────────────────────────────────────────────────────────

function AdSlot() {
  return (
    <div className="mx-4 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 via-surface-container to-surface border border-primary/20 flex items-center gap-4 px-4 py-3.5">
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <span
          className="material-symbols-outlined text-primary text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          campaign
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-label font-semibold text-on-surface text-sm">Anuncia tu negocio</p>
        <p className="font-body text-xs text-on-surface-variant truncate">Llega a miles de constructores en Bolivia</p>
      </div>
      <span className="shrink-0 bg-primary text-on-primary text-[11px] font-label font-bold px-3 py-1.5 rounded-full">
        Contactar
      </span>
    </div>
  )
}

// ─── Products grouped by provider ────────────────────────────────────────────

function ProductsGroupedByProvider({
  products,
  onSelectProduct,
  onSurtido,
}: {
  products: ProductCardType[]
  onSelectProduct: (p: ProductCardType) => void
  onSurtido: (providerId: string, providerName: string) => void
}) {
  // Group products by provider user_id, preserving order of first appearance
  const providerOrder: string[] = []
  const grouped: Record<string, ProductCardType[]> = {}
  for (const p of products) {
    const pid = p.proveedor.user_id
    if (!grouped[pid]) {
      grouped[pid] = []
      providerOrder.push(pid)
    }
    grouped[pid].push(p)
  }

  return (
    <div className="flex flex-col gap-4">
      {providerOrder.map((providerId) => {
        const providerProducts = grouped[providerId]
        const firstProduct = providerProducts[0]
        return (
          <div key={providerId} className="flex flex-col gap-3">
            <ProviderStoreHeader product={firstProduct} onSurtido={onSurtido} />
            <div className="grid grid-cols-2 gap-3">
              {providerProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => onSelectProduct(product)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function TiendaScreen() {
  const [filters, setFilters] = useState<TiendaFilters>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedStage, setSelectedStage] = useState<ConstructionStage | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductCardType | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [surtidoOpen, setSurtidoOpen] = useState(false)
  const [surtidoProviderId, setSurtidoProviderId] = useState('')
  const [surtidoProviderName, setSurtidoProviderName] = useState('')
  const [offset, setOffset] = useState(0)
  const [allProducts, setAllProducts] = useState<ProductCardType[]>([])
  const [activeBanner, setActiveBanner] = useState(0)
  const isFirstLoad = useRef(true)
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: categories = [], isLoading: loadingCats } = useCategories()
  const { data: page = [], isLoading, isFetching } = useProducts(filters, offset)

  const itemCount = useCart((s) => s.itemCount)
  const total = useCart((s) => s.total)
  const count = itemCount()
  const cartTotal = total()

  // Banner auto-rotate (paused when tab is hidden)
  useEffect(() => {
    function startBannerTimer() {
      bannerTimerRef.current = setInterval(() => {
        setActiveBanner((prev) => (prev + 1) % PROMO_BANNERS.length)
      }, 4000)
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
      } else {
        startBannerTimer()
      }
    }

    startBannerTimer()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  function pauseAndResumeBanner() {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current)
    bannerTimerRef.current = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % PROMO_BANNERS.length)
    }, 4000)
  }

  // Reset pagination on filter change
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffset(0)
    setAllProducts([])
  }, [filters])

  // Accumulate pages
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page.length === 0 && offset === 0) { setAllProducts([]); return }
    if (page.length === 0) return
    if (offset === 0) {
      setAllProducts(page)
    } else {
      setAllProducts((prev) => {
        const ids = new Set(prev.map((p) => p.id))
        return [...prev, ...page.filter((p) => !ids.has(p.id))]
      })
    }
  }, [page, offset])

  const handleCategorySelect = (id: string) => {
    const next = selectedCategory === id ? null : id
    setSelectedCategory(next)
    setFilters((f) => ({ ...f, category_id: next ?? undefined, group_keywords: undefined }))
  }

  const handleGroupSelect = (groupId: string | null) => {
    if (groupId === null || selectedGroup === groupId) {
      setSelectedGroup(null)
      setSelectedCategory(null)
      setFilters((f) => ({ ...f, category_id: undefined, group_keywords: undefined }))
      return
    }
    const group = CATEGORY_GROUPS.find((g) => g.id === groupId)
    if (!group) return
    setSelectedGroup(groupId)
    setSelectedCategory(null)
    const matchedCats = categories.filter((cat) =>
      group.keywords.some((kw) => cat.name.toLowerCase().includes(kw))
    )
    setFilters((f) => ({
      ...f,
      category_id: undefined,
      ...(matchedCats.length === 0 ? { group_keywords: group.keywords } : { group_keywords: undefined }),
    }))
  }

  const handleStageSelect = (stageId: ConstructionStage) => {
    const next = selectedStage === stageId ? null : stageId
    setSelectedStage(next)
    // When stage selected, clear group/category filters and apply stage filter
    setSelectedGroup(null)
    setSelectedCategory(null)
    setFilters((f) => ({
      search: f.search,
      listing_type: f.listing_type,
      city: f.city,
      min_price: f.min_price,
      max_price: f.max_price,
      construction_stage: next ?? undefined,
    }))
  }

  const handleBannerCta = (group: string | null) => {
    if (group) handleGroupSelect(group)
  }

  const handleSurtido = (providerId: string, providerName: string) => {
    setSurtidoProviderId(providerId)
    setSurtidoProviderName(providerName)
    setSurtidoOpen(true)
  }

  const handleCargarMas = () => setOffset((prev) => prev + TIENDA_PAGE_SIZE)
  const hasMore = page.length === TIENDA_PAGE_SIZE

  const activeGroup = CATEGORY_GROUPS.find((g) => g.id === selectedGroup)
  const matchedSubcategories = activeGroup
    ? categories.filter((cat) =>
        activeGroup.keywords.some((kw) => cat.name.toLowerCase().includes(kw))
      )
    : []

  const activeFilterCount = [
    filters.listing_type,
    filters.category_id,
    filters.city,
    filters.construction_stage,
    filters.min_price !== undefined,
    filters.max_price !== undefined,
  ].filter(Boolean).length

  const activeStageInfo = selectedStage
    ? CONSTRUCTION_STAGES.find((s) => s.id === selectedStage)
    : null

  // When stage is selected, show grouped by provider
  const showGroupedView = !!selectedStage || !!selectedGroup

  if (selectedProduct) {
    return (
      <ProductDetailScreen
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
      />
    )
  }

  const banner = PROMO_BANNERS[activeBanner]

  return (
    <div className="flex flex-col bg-background pb-32">

      {/* ── Sticky search + filter bar ────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm px-4 pt-3 pb-3 border-b border-outline-variant/40">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-2xl px-4 py-3">
            <span
              className="material-symbols-outlined text-primary text-xl shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              search
            </span>
            <input
              type="text"
              aria-label="Buscar materiales, herramientas y más"
              placeholder="Buscar materiales, herramientas..."
              className="flex-1 bg-transparent border-none outline-none font-body text-on-surface placeholder:text-on-surface-variant text-sm min-w-0"
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            />
            {filters.search && (
              <button onClick={() => setFilters((f) => ({ ...f, search: undefined }))} className="shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">close</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className="relative w-12 h-12 flex items-center justify-center bg-surface-container rounded-2xl border border-outline-variant shrink-0 transition-colors hover:bg-surface-container-high active:opacity-80"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-xl">tune</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-label flex items-center justify-center leading-none font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Etapas de Obra (shown when no search active) ─────────────────── */}
      {!filters.search && (
        <section className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-label font-semibold text-on-surface text-sm">Etapas de Obra</h2>
            {selectedStage && (
              <button
                onClick={() => handleStageSelect(selectedStage)}
                className="font-label text-xs text-primary"
              >
                Ver todo
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CONSTRUCTION_STAGES.map((stage) => {
              const isActive = selectedStage === stage.id
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleStageSelect(stage.id)}
                  aria-pressed={isActive}
                  aria-label={`${stage.label}: ${stage.subtitle}`}
                  className={`h-[130px] rounded-2xl flex flex-col items-center justify-center gap-2 px-3 py-4 text-center transition-all active:scale-[0.97] active:opacity-90 ${
                    isActive
                      ? `${stage.activeBg} shadow-md`
                      : stage.bg
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-4xl leading-none transition-colors ${
                      isActive ? 'text-white' : stage.iconColor
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {stage.icon}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={`font-label font-bold text-sm leading-tight transition-colors ${
                        isActive ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      {stage.label}
                    </span>
                    <span
                      className={`font-body text-[11px] leading-tight transition-colors ${
                        isActive ? 'text-white/80' : 'text-on-surface-variant'
                      }`}
                    >
                      {stage.subtitle}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Secondary category chips (shown when stage selected) ──────────── */}
      {selectedStage && (
        <div className="pb-1">
          <div
            className="flex overflow-x-auto gap-2 px-4 pb-2 pt-1"
            style={{ scrollbarWidth: 'none' }}
          >
            <span className="font-label text-xs text-on-surface-variant self-center shrink-0">Categoría:</span>
            <button
              onClick={() => handleCategorySelect('')}
              className={`shrink-0 rounded-full px-4 py-1.5 border font-label text-sm font-medium transition-[border-color,background-color,color] ${
                !selectedCategory
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                category={cat}
                isSelected={selectedCategory === cat.id}
                onSelect={handleCategorySelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Promo banner carousel (shown when no stage/group/search filter) ─ */}
      {!selectedStage && !filters.search && (
        <div className="px-4 pt-2 pb-2">
          <div
            className="relative h-40 rounded-2xl overflow-hidden cursor-pointer active:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${banner.from}, ${banner.to})` }}
            onClick={() => handleBannerCta(banner.group)}
          >
            {/* Background texture */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/30" />
              <div className="absolute -left-4 -bottom-8 w-32 h-32 rounded-full bg-white/20" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <p className="font-body text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Destacado</p>
              <h2 className="font-headline font-black text-white text-2xl leading-tight mb-1">{banner.title}</h2>
              <p className="font-body text-white/80 text-sm mb-3">{banner.subtitle}</p>
              <div className="flex items-center justify-between">
                <button className="bg-white/20 backdrop-blur-sm text-white text-xs font-label font-bold px-4 py-2 rounded-full border border-white/30 active:bg-white/30">
                  {banner.cta} →
                </button>
                {/* Dots */}
                <div className="flex gap-1.5">
                  {PROMO_BANNERS.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Ir al slide ${i + 1}`}
                      aria-pressed={i === activeBanner}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveBanner(i)
                        pauseAndResumeBanner()
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeBanner ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Category group horizontal scroll (shown when no stage selected) ─ */}
      {!selectedStage && (
        <div className="pt-3 pb-2">
          <div
            className="flex overflow-x-auto gap-3 px-4 pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {/* "Todo" pill */}
            <button
              onClick={() => handleGroupSelect(null)}
              aria-pressed={!selectedGroup}
              aria-label="Ver todos los productos"
              className="shrink-0 flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                  !selectedGroup
                    ? 'bg-primary shadow-md scale-105'
                    : 'bg-surface-container'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${!selectedGroup ? 'text-white' : 'text-on-surface-variant'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  storefront
                </span>
              </div>
              <span
                className={`font-label text-[11px] font-semibold text-center ${
                  !selectedGroup ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                Todo
              </span>
            </button>

            {loadingCats
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container animate-pulse" />
                    <div className="w-12 h-2 rounded bg-surface-container animate-pulse" />
                  </div>
                ))
              : CATEGORY_GROUPS.map((group) => {
                  const isActive = selectedGroup === group.id
                  return (
                    <button
                      key={group.id}
                      onClick={() => handleGroupSelect(group.id)}
                      aria-pressed={isActive}
                      aria-label={group.label}
                      className="shrink-0 flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-primary shadow-md scale-105'
                            : group.bg
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-3xl transition-colors ${
                            isActive ? 'text-white' : 'text-on-surface-variant'
                          }`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {group.icon}
                        </span>
                      </div>
                      <span
                        className={`font-label text-[11px] font-semibold text-center ${
                          isActive ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {group.label}
                      </span>
                    </button>
                  )
                })}
          </div>
        </div>
      )}

      {/* ── Sub-categories (shown when group selected) ────────────────────── */}
      {!selectedStage && selectedGroup && matchedSubcategories.length > 0 && (
        <div className="flex overflow-x-auto gap-2 px-4 pb-2 pt-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => handleCategorySelect('')}
            className={`shrink-0 rounded-full px-4 py-1.5 border font-label text-sm font-medium transition-[border-color,background-color,color] ${
              !selectedCategory
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container text-on-surface-variant border-outline-variant'
            }`}
          >
            Todos
          </button>
          {matchedSubcategories.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              isSelected={selectedCategory === cat.id}
              onSelect={handleCategorySelect}
            />
          ))}
        </div>
      )}

      {/* ── Featured products (horizontal scroll, only on "Todo" view) ────── */}
      {!selectedGroup && !selectedStage && !filters.search && allProducts.length > 0 && (
        <section className="pt-4 pb-2">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="font-label font-semibold text-on-surface text-sm">
              Más pedidos
            </h2>
            <span className="font-body text-xs text-on-surface-variant">
              {allProducts.length} productos
            </span>
          </div>
          <div
            className="flex overflow-x-auto gap-3 px-4 pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {allProducts.slice(0, 8).map((product) => (
              <FeaturedCard
                key={product.id}
                product={product}
                onPress={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Ad slot #1 ────────────────────────────────────────────────────── */}
      {!filters.search && !selectedStage && <div className="py-3"><AdSlot /></div>}

      {/* ── Main product grid ─────────────────────────────────────────────── */}
      <section className="px-4 pt-2">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-label font-semibold text-on-surface text-sm">
            {selectedStage
              ? activeStageInfo?.label ?? 'Productos'
              : selectedGroup
              ? activeGroup?.label ?? 'Productos'
              : filters.search
              ? 'Resultados'
              : 'Todo el catálogo'}
            {allProducts.length > 0 && (
              <span className="text-on-surface-variant font-normal ml-1">
                ({allProducts.length})
              </span>
            )}
          </h2>
          {/* Sort/filter shortcut */}
          <button
            onClick={() => setFilterSheetOpen(true)}
            className="flex items-center gap-1 font-label text-xs text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-sm">sort</span>
            Ordenar
          </button>
        </div>

        {/* Loading state */}
        {isLoading && offset === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-52" />
            ))}
          </div>
        ) : allProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">inventory_2</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">
              Sin productos aquí
            </p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">
              Prueba con otra categoría o elimina los filtros activos
            </p>
            {(selectedGroup || selectedStage || activeFilterCount > 0) && (
              <button
                onClick={() => {
                  setSelectedGroup(null)
                  setSelectedStage(null)
                  setFilters({})
                  setSelectedCategory(null)
                }}
                className="mt-2 bg-primary text-on-primary font-label font-semibold text-sm px-5 py-2.5 rounded-full"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : showGroupedView ? (
          /* Grouped by provider view for stage/group selections */
          <div className="flex flex-col gap-3">
            <ProductsGroupedByProvider
              products={allProducts.slice(0, 6)}
              onSelectProduct={setSelectedProduct}
              onSurtido={handleSurtido}
            />

            {/* Ad slot #2 after 6 products (grouped view) */}
            {allProducts.length > 6 && (
              <div className="py-1 -mx-4">
                <AdSlot />
              </div>
            )}

            {allProducts.length > 6 && (
              <ProductsGroupedByProvider
                products={allProducts.slice(6)}
                onSelectProduct={setSelectedProduct}
                onSurtido={handleSurtido}
              />
            )}

            {/* Loading next page */}
            {isFetching && offset > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-52" />
                ))}
              </div>
            )}

            {/* Cargar más */}
            {hasMore && !isFetching && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleCargarMas}
                  className="flex items-center gap-2 bg-surface-container text-on-surface font-label font-semibold rounded-2xl px-8 py-3 border border-outline-variant active:opacity-80"
                >
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                  Cargar más
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Standard grid view */
          <div className="flex flex-col gap-3">
            {/* First 6 products */}
            <div className="grid grid-cols-2 gap-3">
              {allProducts.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => setSelectedProduct(product)}
                />
              ))}
            </div>

            {/* Ad slot #2 after 6 products */}
            {allProducts.length > 6 && (
              <div className="py-1 -mx-4">
                <AdSlot />
              </div>
            )}

            {/* Rest of products */}
            {allProducts.length > 6 && (
              <div className="grid grid-cols-2 gap-3">
                {allProducts.slice(6).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            )}

            {/* Loading next page */}
            {isFetching && offset > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-52" />
                ))}
              </div>
            )}

            {/* Cargar más */}
            {hasMore && !isFetching && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleCargarMas}
                  className="flex items-center gap-2 bg-surface-container text-on-surface font-label font-semibold rounded-2xl px-8 py-3 border border-outline-variant active:opacity-80"
                >
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                  Cargar más
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Cart FAB / Bottom bar ─────────────────────────────────────────── */}
      {count > 0 ? (
        /* Full-width bar when cart has items */
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-16 left-4 right-4 z-30 bg-primary text-on-primary rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-xl active:opacity-90 transition-opacity"
        >
          <span className="bg-on-primary/20 rounded-xl w-9 h-9 flex items-center justify-center font-headline font-black text-sm shrink-0">
            {count > 99 ? '99+' : count}
          </span>
          <span className="flex-1 font-label font-bold text-base text-left">Ver pedido</span>
          <span className="font-headline font-black text-base shrink-0">
            Bs. {cartTotal.toLocaleString('es-BO')}
          </span>
          <span className="material-symbols-outlined text-xl shrink-0">chevron_right</span>
        </button>
      ) : (
        /* Floating cart icon when empty */
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
          aria-label="Abrir carrito"
        >
          <span className="material-symbols-outlined text-2xl">shopping_cart</span>
        </button>
      )}

      {/* ── Cart Drawer ───────────────────────────────────────────────────── */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── Filter Sheet ──────────────────────────────────────────────────── */}
      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        categories={categories}
        onApply={(newFilters) => {
          // If filter sheet sets a construction_stage, sync local state
          if (newFilters.construction_stage) {
            setSelectedStage(newFilters.construction_stage)
            setSelectedGroup(null)
            setSelectedCategory(newFilters.category_id ?? null)
          } else {
            setSelectedStage(null)
            setSelectedCategory(newFilters.category_id ?? null)
            if (!newFilters.category_id) setSelectedGroup(null)
          }
          setFilters((f) => ({
            search: f.search,
            group_keywords: f.group_keywords,
            ...newFilters,
          }))
        }}
      />

      {/* ── Surtido Rápido Sheet ──────────────────────────────────────────── */}
      <SurtidoRapidoSheet
        open={surtidoOpen}
        onClose={() => setSurtidoOpen(false)}
        providerId={surtidoProviderId}
        providerName={surtidoProviderName}
      />
    </div>
  )
}

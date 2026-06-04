import { useState, useEffect } from 'react'
import { Z } from '@/shared/design/tokens'
import { ZButton } from '@/shared/design/components/ZButton'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { ZHeader } from '@/shared/design/components/ZHeader'

// ── Types & Data ──────────────────────────────────────────────────────────────
interface Product {
  id: number; name: string; brand: string; price: string; unit: string
  category: string; weight: string; sku: string
}

const PRODUCTS: Product[] = [
  { id: 1,  name: 'Cemento IP-30',         brand: 'Fancesa',     price: '62',   unit: 'bolsa', category: 'Materiales',   weight: '50kg',  sku: 'CEM-IP30-FAN' },
  { id: 2,  name: 'Fierro Corrugado 12mm', brand: 'Duralit',     price: '85',   unit: 'barra', category: 'Materiales',   weight: '10kg',  sku: 'FIE-12MM-DUR' },
  { id: 3,  name: 'Ladrillo 6 Huecos',     brand: 'Ceramil',     price: '1.20', unit: 'unid',  category: 'Materiales',   weight: '3.5kg', sku: 'LAD-6H-CER'   },
  { id: 4,  name: 'Arena Fina',            brand: 'Cantera Sur', price: '350',  unit: 'm³',    category: 'Materiales',   weight: '-',     sku: 'ARE-FIN-CS'   },
  { id: 5,  name: 'Taladro Percutor',      brand: 'Bosch',       price: '890',  unit: 'unid',  category: 'Herramientas', weight: '2.1kg', sku: 'TAL-PER-BOS'  },
  { id: 6,  name: 'Tubería PVC 4"',        brand: 'Tigre',       price: '48',   unit: 'tubo',  category: 'Materiales',   weight: '2.5kg', sku: 'TUB-PVC4-TIG' },
  { id: 7,  name: 'Martillo Carpintero',   brand: 'Stanley',     price: '75',   unit: 'unid',  category: 'Herramientas', weight: '0.7kg', sku: 'MAR-CAR-STN'  },
  { id: 8,  name: 'Mezcladora 1 Bolsa',    brand: 'Honda',       price: '4500', unit: 'unid',  category: 'Máquinas',     weight: '150kg', sku: 'MEZ-1B-HON'   },
  { id: 9,  name: 'Compactadora Vibr.',    brand: 'Wacker',      price: '8500', unit: 'unid',  category: 'Máquinas',     weight: '65kg',  sku: 'COM-WAC-001'  },
  { id: 10, name: 'Casco de Seguridad',    brand: 'MSA',         price: '85',   unit: 'unid',  category: 'Seguridad',    weight: '0.4kg', sku: 'CAS-SEG-MSA'  },
  { id: 11, name: 'Guantes de Trabajo',    brand: 'Ansell',      price: '28',   unit: 'par',   category: 'Seguridad',    weight: '0.1kg', sku: 'GUA-TRA-ANS'  },
  { id: 12, name: 'Chaleco Reflectante',   brand: 'MSA',         price: '45',   unit: 'unid',  category: 'Seguridad',    weight: '0.2kg', sku: 'CHA-REF-MSA'  },
]

const BEST_SELLER_IDS = [1, 5, 7, 8]
const FILTER_OPTIONS = ['Todos', 'Materiales', 'Herramientas', 'Máquinas', 'Seguridad']

const OFFERS = [
  { title: '15% OFF en Cemento',  subtitle: 'Fancesa IP-30 · Compra mín. 50 bolsas', from: '#E8733A', to: '#A43700' },
  { title: 'Combo Cimentación',   subtitle: 'Cemento + Fierro + Arena desde Bs 2,400', from: '#3A7BD5', to: '#1E5FAD' },
  { title: 'Envío Gratis',        subtitle: 'En pedidos mayores a Bs 1,000', from: '#A43700', to: '#7A2900' },
]

interface CartItem extends Product { qty: number }

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product, onTap }: { product: Product; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      style={{ width: '100%', background: Z.surface, borderRadius: Z.r.md, border: `1px solid ${Z.border}`, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, outline: 'none' }}
    >
      <div style={{ height: 80, background: `linear-gradient(135deg, ${Z.divider} 0%, ${Z.blueLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textMuted }}>{product.category}</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.text, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted, marginTop: 2 }}>{product.brand}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
          <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 800, color: Z.orangeDark }}>Bs {product.price}</span>
          <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>/{product.unit}</span>
        </div>
      </div>
    </button>
  )
}

// ── BestSellerCard ────────────────────────────────────────────────────────────
function BestSellerCard({ product, rank, onTap }: { product: Product; rank: number; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      style={{ flexShrink: 0, width: 138, background: Z.surface, borderRadius: Z.r.md, border: `1px solid ${Z.border}`, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, outline: 'none' }}
    >
      <div style={{ height: 72, background: `linear-gradient(135deg, ${Z.divider} 0%, ${Z.blueLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', position: 'relative' }}>
        <div style={{ background: Z.orangeDark, color: '#fff', borderRadius: 6, padding: '3px 8px', fontFamily: Z.font, fontSize: 10, fontWeight: 800 }}>
          #{rank}
        </div>
        <span style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 600, color: Z.textMuted }}>{product.category}</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.text, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted, marginTop: 1 }}>{product.brand}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 5 }}>
          <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 800, color: Z.orangeDark }}>Bs {product.price}</span>
          <span style={{ fontFamily: Z.font, fontSize: 9, color: Z.textMuted }}>/{product.unit}</span>
        </div>
      </div>
    </button>
  )
}

// ── ProductDetail ─────────────────────────────────────────────────────────────
function ProductDetail({ product, onBack, onAdd }: {
  product: Product; onBack: () => void; onAdd: (p: Product, qty: number) => void
}) {
  const [qty, setQty] = useState(1)
  const [showFicha, setShowFicha] = useState(false)
  const price = parseFloat(product.price.replace(',', ''))

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ZHeader title={product.name} onBack={onBack} />
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ height: 180, borderRadius: Z.r.lg, background: `linear-gradient(135deg, ${Z.divider} 0%, ${Z.blueLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 700, color: Z.textMuted }}>{product.category}</span>
        </div>

        <div>
          <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textMuted }}>{product.brand}</span>
          <h3 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: '4px 0 0' }}>{product.name}</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
            <span style={{ fontFamily: Z.font, fontSize: 28, fontWeight: 800, color: Z.orangeDark }}>Bs {product.price}</span>
            <span style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted }}>/ {product.unit}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'SKU',        value: product.sku },
            { label: 'Peso',       value: product.weight },
            { label: 'Categoría',  value: product.category },
            { label: 'Disponible', value: 'En stock' },
          ].map(spec => (
            <div key={spec.label} style={{ padding: '10px 12px', borderRadius: Z.r.sm, background: Z.surface, border: `1px solid ${Z.border}` }}>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 600, color: Z.textMuted }}>{spec.label}</div>
              <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>{spec.value}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowFicha(!showFicha)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, background: Z.surface, cursor: 'pointer', width: '100%', outline: 'none', fontFamily: Z.font, fontSize: 14, fontWeight: 600, color: Z.text }}
        >
          Ficha Técnica / Certificado
          <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted }}>{showFicha ? '▲' : '▾'}</span>
        </button>
        {showFicha && (
          <div style={{ padding: '14px', borderRadius: Z.r.sm, background: Z.blueLight, border: `1px solid ${Z.bluePastel}` }}>
            <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, lineHeight: 1.6 }}>
              Certificado de calidad y ficha técnica del material (documento PDF descargable)
            </div>
          </div>
        )}

        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 8 }}>Cantidad</label>
          <div style={{ display: 'flex', alignItems: 'center', borderRadius: Z.r.sm, overflow: 'hidden', border: `1.5px solid ${Z.border}`, width: 'fit-content' }}>
            <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 44, height: 44, border: 'none', background: Z.surface, cursor: 'pointer', fontFamily: Z.font, fontSize: 20, fontWeight: 700, color: Z.text, outline: 'none' }}>−</button>
            <span style={{ width: 60, textAlign: 'center', fontFamily: Z.font, fontSize: 16, fontWeight: 700, color: Z.text, borderLeft: `1px solid ${Z.border}`, borderRight: `1px solid ${Z.border}`, lineHeight: '44px' }}>{qty}</span>
            <button onClick={() => setQty(qty + 1)} style={{ width: 44, height: 44, border: 'none', background: Z.surface, cursor: 'pointer', fontFamily: Z.font, fontSize: 20, fontWeight: 700, color: Z.text, outline: 'none' }}>+</button>
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, marginTop: 6 }}>
            Total: <strong style={{ color: Z.orangeDark }}>Bs {(price * qty).toLocaleString()}</strong>
          </div>
        </div>

        <ZButton onClick={() => onAdd(product, qty)}>Agregar al Carrito</ZButton>
        <button style={{ width: '100%', padding: '12px', border: `1.5px solid ${Z.border}`, borderRadius: Z.r.md, background: Z.surface, cursor: 'pointer', outline: 'none', fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.blue }}>
          Comparar Proveedores
        </button>
      </div>
    </div>
  )
}

// ── CartScreen ────────────────────────────────────────────────────────────────
function CartScreen({ cart, setCart, onBack }: {
  cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; onBack: () => void
}) {
  const [payMethod, setPayMethod] = useState('')
  const [ordered, setOrdered] = useState(false)

  function handleConfirm() { setOrdered(true); setTimeout(() => { setCart([]); onBack() }, 1800) }
  const total = cart.reduce((sum, c) => sum + parseFloat(c.price.replace(',', '')) * c.qty, 0)
  const removeItem = (id: number) => setCart(prev => prev.filter(c => c.id !== id))
  const updateQty = (id: number, qty: number) => setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, qty) } : c))

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ZHeader title="Mi Carrito" onBack={onBack} />
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 600, color: Z.textMuted }}>Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}` }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${Z.divider}, ${Z.blueLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: Z.font, fontSize: 9, fontWeight: 600, color: Z.textMuted }}>{item.category}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{item.name}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>{item.brand}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 800, color: Z.orangeDark, marginTop: 4 }}>
                    Bs {(parseFloat(item.price.replace(',', '')) * item.qty).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${Z.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 28, height: 28, border: 'none', background: Z.surface, cursor: 'pointer', fontSize: 14, fontWeight: 700, outline: 'none' }}>−</button>
                    <span style={{ width: 28, textAlign: 'center', fontFamily: Z.font, fontSize: 12, fontWeight: 700, lineHeight: '28px', borderLeft: `1px solid ${Z.border}`, borderRight: `1px solid ${Z.border}` }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 28, height: 28, border: 'none', background: Z.surface, cursor: 'pointer', fontSize: 14, fontWeight: 700, outline: 'none' }}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', outline: 'none', fontFamily: Z.font, fontSize: 10, color: Z.error, fontWeight: 600 }}>Quitar</button>
                </div>
              </div>
            ))}

            <div>
              <SectionTitle title="Método de Pago" />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                {[{ key: 'qr', label: 'Pago QR' }, { key: 'transfer', label: 'Transferencia' }].map(pm => (
                  <button key={pm.key} onClick={() => setPayMethod(pm.key)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', borderRadius: Z.r.md, border: `2px solid ${payMethod === pm.key ? Z.orange : Z.border}`, background: payMethod === pm.key ? Z.orangeLight : Z.surface, cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}>
                    <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: payMethod === pm.key ? Z.orangeDark : Z.textSec }}>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec }}>Subtotal</span>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>Bs {total.toLocaleString()}</span>
              </div>
              <div style={{ height: 1, background: Z.border, marginBottom: 12 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>Total</span>
                <span style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.orangeDark }}>Bs {total.toLocaleString()}</span>
              </div>
            </div>

            {ordered && (
              <div role="status" style={{ padding: '14px', borderRadius: Z.r.sm, background: '#DCFCE7', color: '#166534', fontFamily: Z.font, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                ¡Pedido realizado! Redirigiendo...
              </div>
            )}
            <ZButton disabled={!payMethod || ordered} onClick={handleConfirm}>Confirmar Pedido</ZButton>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
type TiendaScreen = 'list' | 'detail' | 'cart'

export function ConstructorTiendaTab() {
  const [category, setCategory] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [screen, setScreen] = useState<TiendaScreen>('list')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [offerIdx, setOfferIdx] = useState(0)
  const [carouselPaused, setCarouselPaused] = useState(false)

  const filtered = category === '' ? PRODUCTS : PRODUCTS.filter(p => p.category === category)
  const bestSellers = PRODUCTS.filter(p => BEST_SELLER_IDS.includes(p.id))
  const materialsByBrand = Object.entries(
    PRODUCTS.filter(p => p.category === 'Materiales').reduce<Record<string, Product[]>>((acc, p) => {
      if (!acc[p.brand]) acc[p.brand] = []
      acc[p.brand].push(p)
      return acc
    }, {})
  )
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0)
  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.price.replace(',', '')) * c.qty, 0)
  const filterLabel = category === '' ? 'Filtro' : category

  useEffect(() => {
    if (carouselPaused) return
    const id = setInterval(() => setOfferIdx(i => (i + 1) % OFFERS.length), 4000)
    return () => clearInterval(id)
  }, [carouselPaused])

  const handleTap = (p: Product) => { setSelectedProduct(p); setScreen('detail') }

  const addToCart = (product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id)
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + qty } : c)
      return [...prev, { ...product, qty }]
    })
    setScreen('list')
    setSelectedProduct(null)
  }

  if (screen === 'detail' && selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={() => setScreen('list')} onAdd={addToCart} />
  }
  if (screen === 'cart') {
    return <CartScreen cart={cart} setCart={setCart} onBack={() => setScreen('list')} />
  }

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Search + Filtro button ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: Z.r.sm, background: Z.surface, border: `1.5px solid ${Z.border}` }}>
          <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted }}>Buscar materiales, herramientas...</span>
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowFilter(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 14px',
              borderRadius: Z.r.sm,
              border: category ? 'none' : `1.5px solid ${Z.border}`,
              background: category ? Z.orangeDark : Z.surface,
              color: category ? '#fff' : Z.text,
              fontFamily: Z.font, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
            }}
          >
            {filterLabel} <span style={{ fontSize: 10, opacity: 0.7 }}>{showFilter ? '▲' : '▾'}</span>
          </button>

          {showFilter && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowFilter(false)} />
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: Z.surface, border: `1.5px solid ${Z.border}`, borderRadius: Z.r.md, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 41, minWidth: 170, overflow: 'hidden' }}>
                {FILTER_OPTIONS.map(opt => {
                  const val = opt === 'Todos' ? '' : opt
                  const isActive = category === val
                  return (
                    <button
                      key={opt}
                      onClick={() => { setCategory(val); setShowFilter(false) }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', background: isActive ? Z.orangeLight : 'transparent', color: isActive ? Z.orangeDark : Z.text, fontFamily: Z.font, fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', outline: 'none' }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Offers carousel ──────────────────────────────────────────── */}
      <div
        style={{ position: 'relative', overflow: 'hidden', borderRadius: Z.r.lg }}
        onMouseEnter={() => setCarouselPaused(true)}
        onMouseLeave={() => setCarouselPaused(false)}
        onFocus={() => setCarouselPaused(true)}
        onBlur={() => setCarouselPaused(false)}
      >
        <div style={{ display: 'flex', transition: 'transform 0.5s ease', transform: `translateX(-${offerIdx * 100}%)` }}>
          {OFFERS.map((offer, i) => (
            <div key={i} style={{ minWidth: '100%', padding: '20px', boxSizing: 'border-box', background: `linear-gradient(135deg, ${offer.from} 0%, ${offer.to} 100%)`, borderRadius: Z.r.lg }}>
              <div style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: '#fff' }}>{offer.title}</div>
              <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{offer.subtitle}</div>
            </div>
          ))}
        </div>
        <div role="group" aria-label="Navegación de ofertas" style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10 }}>
          {OFFERS.map((_, i) => (
            <button key={i} type="button" onClick={() => setOfferIdx(i)} aria-label={`Oferta ${i + 1} de ${OFFERS.length}`} aria-pressed={i === offerIdx} style={{ padding: '10px 8px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
              <div style={{ width: i === offerIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === offerIdx ? '#E8733A' : Z.border, transition: 'all 0.3s' }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Sin filtro: Más Vendido + Por Fabricante ──────────────────── */}
      {category === '' && (
        <>
          <div>
            <SectionTitle title="Más Vendido" />
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginTop: 10, scrollbarWidth: 'none' }}>
              {bestSellers.map((p, i) => (
                <BestSellerCard key={p.id} product={p} rank={i + 1} onTap={() => handleTap(p)} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SectionTitle title="Por Fabricante" />
            {materialsByBrand.map(([brand, prods]) => (
              <div key={brand}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{brand}</span>
                  <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.orange }}>
                    {prods.length} producto{prods.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {prods.slice(0, 2).map(p => (
                    <ProductCard key={p.id} product={p} onTap={() => handleTap(p)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Con filtro: grid filtrado ─────────────────────────────────── */}
      {category !== '' && (
        <div>
          <SectionTitle title={category} action={`${filtered.length} items`} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onTap={() => handleTap(p)} />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted }}>No hay productos en esta categoría</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cart FAB ─────────────────────────────────────────────────── */}
      {cartCount > 0 && (
        <button
          onClick={() => setScreen('cart')}
          aria-label={`Ver carrito · ${cartCount} items · Bs ${cartTotal.toLocaleString()}`}
          style={{ position: 'sticky', bottom: 80, alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: Z.r.full, border: 'none', cursor: 'pointer', background: Z.orangeDark, color: '#fff', boxShadow: '0 4px 20px rgba(164,55,0,0.3)', fontFamily: Z.font, fontSize: 14, fontWeight: 700, zIndex: 5, outline: 'none' }}
        >
          <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700 }}>Carrito · {cartCount} items · Bs {cartTotal.toLocaleString()}</span>
        </button>
      )}
    </div>
  )
}


// ziteo-dash-store.jsx — Tienda tab + Product detail modal + Cart overlay

// ── Sample Product Data ─────────────────────────────────────────────────────
const STORE_PRODUCTS = [
  { id: 1, name: 'Cemento IP-30', brand: 'Fancesa', price: '62', unit: 'bolsa', category: 'Materiales', weight: '50kg', sku: 'CEM-IP30-FAN' },
  { id: 2, name: 'Fierro Corrugado 12mm', brand: 'Duralit', price: '85', unit: 'barra', category: 'Materiales', weight: '10kg', sku: 'FIE-12MM-DUR' },
  { id: 3, name: 'Ladrillo 6 Huecos', brand: 'Ceramil', price: '1.20', unit: 'unid', category: 'Materiales', weight: '3.5kg', sku: 'LAD-6H-CER' },
  { id: 4, name: 'Arena Fina', brand: 'Cantera Sur', price: '350', unit: 'm³', category: 'Materiales', weight: '-', sku: 'ARE-FIN-CS' },
  { id: 5, name: 'Taladro Percutor', brand: 'Bosch', price: '890', unit: 'unid', category: 'Herramientas', weight: '2.1kg', sku: 'TAL-PER-BOS' },
  { id: 6, name: 'Tubería PVC 4"', brand: 'Tigre', price: '48', unit: 'tubo', category: 'Materiales', weight: '2.5kg', sku: 'TUB-PVC4-TIG' },
  { id: 7, name: 'Martillo Carpintero', brand: 'Stanley', price: '75', unit: 'unid', category: 'Herramientas', weight: '0.7kg', sku: 'MAR-CAR-STN' },
  { id: 8, name: 'Mezcladora 1 Bolsa', brand: 'Honda', price: '4,500', unit: 'unid', category: 'Maquinaria', weight: '150kg', sku: 'MEZ-1B-HON' },
];

const STORE_OFFERS = [
  { title: '15% OFF en Cemento', subtitle: 'Fancesa IP-30 · Compra mín. 50 bolsas', color: Z.orange },
  { title: 'Combo Cimentación', subtitle: 'Cemento + Fierro + Arena desde Bs 2,400', color: Z.blue },
  { title: 'Envío Gratis', subtitle: 'En pedidos mayores a Bs 1,000', color: Z.orangeDark },
];

// ── Tienda Tab ──────────────────────────────────────────────────────────────
function TiendaTab() {
  const [category, setCategory] = React.useState('Todos');
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [cart, setCart] = React.useState([]);
  const [showCart, setShowCart] = React.useState(false);
  const [offerIdx, setOfferIdx] = React.useState(0);

  const categories = ['Todos', 'Materiales', 'Herramientas', 'Maquinaria'];
  const filtered = category === 'Todos' ? STORE_PRODUCTS : STORE_PRODUCTS.filter(p => p.category === category);

  const addToCart = (product, qty) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + qty } : c);
      return [...prev, { ...product, qty }];
    });
    setSelectedProduct(null);
  };

  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.price.replace(',', '')) * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  // Auto-rotate offers
  React.useEffect(() => {
    const id = setInterval(() => setOfferIdx(i => (i + 1) % STORE_OFFERS.length), 4000);
    return () => clearInterval(id);
  }, []);

  if (selectedProduct) {
    return <ProductDetailScreen product={selectedProduct} onBack={() => setSelectedProduct(null)} onAdd={addToCart} />;
  }
  if (showCart) {
    return <CartScreen cart={cart} setCart={setCart} total={cartTotal} onBack={() => setShowCart(false)} />;
  }

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        borderRadius: Z.r.sm, background: Z.surface, border: `1.5px solid ${Z.border}`,
      }}>
        <ZIcon name="search" size={18} color={Z.textMuted} />
        <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted }}>Buscar materiales, herramientas...</span>
      </div>

      {/* Offers carousel */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: Z.r.lg }}>
        <div style={{
          display: 'flex', transition: 'transform 0.5s ease',
          transform: `translateX(-${offerIdx * 100}%)`,
        }}>
          {STORE_OFFERS.map((offer, i) => (
            <div key={i} style={{
              minWidth: '100%', padding: '20px', boxSizing: 'border-box',
              background: `linear-gradient(135deg, ${offer.color} 0%, ${offer.color}CC 100%)`,
              borderRadius: Z.r.lg,
            }}>
              <div style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: '#fff' }}>{offer.title}</div>
              <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{offer.subtitle}</div>
            </div>
          ))}
        </div>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {STORE_OFFERS.map((_, i) => (
            <div key={i} onClick={() => setOfferIdx(i)} style={{
              width: i === offerIdx ? 18 : 6, height: 6, borderRadius: 3,
              background: i === offerIdx ? Z.orange : Z.border, transition: 'all 0.3s',
              cursor: 'pointer',
            }} />
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <SectionTitle title="Categorías" />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          {[
            { key: 'Materiales', label: 'Materiales', icon: <svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="2" stroke={Z.orange} strokeWidth="1.8" fill="none"/><path d="M3 14h18M8 8v12M16 8v12" stroke={Z.orange} strokeWidth="1.3"/></svg> },
            { key: 'Herramientas', label: 'Herramientas', icon: <svg width="20" height="20" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke={Z.blue} strokeWidth="1.8" fill="none"/></svg> },
            { key: 'Maquinaria', label: 'Maquinaria', icon: <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke={Z.orangeDark} strokeWidth="1.8" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={Z.orangeDark} strokeWidth="1.5" fill="none"/></svg> },
          ].map(cat => (
            <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '14px 8px', borderRadius: Z.r.md, border: `1.5px solid ${category === cat.key ? Z.orange : Z.border}`,
              background: category === cat.key ? Z.orangeLight : Z.surface,
              cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
            }}>
              {cat.icon}
              <span style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 600, color: category === cat.key ? Z.orangeDark : Z.textSec }}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div>
        <SectionTitle title={category === 'Todos' ? 'Todos los productos' : category} action={`${filtered.length} items`} />
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10,
        }}>
          {filtered.map(p => (
            <ProductCard key={p.id} name={p.name} brand={p.brand} price={p.price} unit={p.unit}
              onTap={() => setSelectedProduct(p)} />
          ))}
        </div>
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button onClick={() => setShowCart(true)} style={{
          position: 'sticky', bottom: 80, alignSelf: 'flex-end',
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
          borderRadius: Z.r.full, border: 'none', cursor: 'pointer',
          background: Z.orangeDark, color: '#fff', boxShadow: '0 4px 20px rgba(164,55,0,0.3)',
          fontFamily: Z.font, fontSize: 14, fontWeight: 700, zIndex: 5, outline: 'none',
        }}>
          <NavIconCart color="#fff" size={20} />
          <span>{cartCount} items · Bs {cartTotal.toLocaleString()}</span>
        </button>
      )}
    </div>
  );
}

// ── Product Detail Sub-screen ───────────────────────────────────────────────
function ProductDetailScreen({ product, onBack, onAdd }) {
  const [qty, setQty] = React.useState(1);
  const [showFicha, setShowFicha] = React.useState(false);

  return (
    <ZScreen bg={Z.bg}>
      <ZHeader onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Product image placeholder */}
        <div style={{
          height: 200, margin: '0 20px', borderRadius: Z.r.lg, overflow: 'hidden',
          background: `linear-gradient(135deg, ${Z.divider} 0%, ${Z.blueLight} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', fontSize: 12, color: Z.textMuted,
        }}>foto del producto</div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textMuted }}>{product.brand}</span>
            <h3 style={{ fontFamily: Z.font, fontSize: 24, fontWeight: 800, color: Z.text, margin: '4px 0 0' }}>{product.name}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
              <span style={{ fontFamily: Z.font, fontSize: 28, fontWeight: 800, color: Z.orangeDark }}>Bs {product.price}</span>
              <span style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted }}>/ {product.unit}</span>
            </div>
          </div>

          {/* Specs */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {[
              { label: 'SKU', value: product.sku },
              { label: 'Peso', value: product.weight },
              { label: 'Categoría', value: product.category },
              { label: 'Disponible', value: 'En stock' },
            ].map(spec => (
              <div key={spec.label} style={{
                padding: '10px 12px', borderRadius: Z.r.sm, background: Z.surface,
                border: `1px solid ${Z.border}`,
              }}>
                <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 600, color: Z.textMuted }}>{spec.label}</div>
                <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>{spec.value}</div>
              </div>
            ))}
          </div>

          {/* Ficha técnica */}
          <button onClick={() => setShowFicha(!showFicha)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`,
            background: Z.surface, cursor: 'pointer', width: '100%', outline: 'none',
            fontFamily: Z.font, fontSize: 14, fontWeight: 600, color: Z.text,
          }}>
            Ficha Técnica / Certificado
            <svg width="12" height="12" viewBox="0 0 24 24" style={{ transform: showFicha ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              <path d="M6 9l6 6 6-6" stroke={Z.textMuted} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          </button>
          {showFicha && (
            <div style={{
              padding: '14px', borderRadius: Z.r.sm, background: Z.blueLight,
              border: `1px solid ${Z.bluePastel}`, animation: 'zFadeSlideIn 0.2s ease',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: Z.textSec, lineHeight: 1.6 }}>
                Certificado de calidad y<br/>ficha técnica del material<br/>(documento PDF descargable)
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 8 }}>
              Cantidad
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: Z.r.sm, overflow: 'hidden', border: `1.5px solid ${Z.border}`, width: 'fit-content' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{
                width: 44, height: 44, border: 'none', background: Z.surface, cursor: 'pointer',
                fontFamily: Z.font, fontSize: 20, fontWeight: 700, color: Z.text, outline: 'none',
              }}>−</button>
              <input type="number" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={{
                width: 70, height: 44, border: 'none', borderLeft: `1px solid ${Z.border}`, borderRight: `1px solid ${Z.border}`,
                textAlign: 'center', fontFamily: Z.font, fontSize: 16, fontWeight: 700, color: Z.text, outline: 'none',
                MozAppearance: 'textfield',
              }} />
              <button onClick={() => setQty(qty + 1)} style={{
                width: 44, height: 44, border: 'none', background: Z.surface, cursor: 'pointer',
                fontFamily: Z.font, fontSize: 20, fontWeight: 700, color: Z.text, outline: 'none',
              }}>+</button>
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, marginTop: 6 }}>
              Total: <strong style={{ color: Z.orangeDark }}>Bs {(parseFloat(product.price.replace(',', '')) * qty).toLocaleString()}</strong>
            </div>
          </div>

          {/* Add to cart */}
          <ZButton onClick={() => onAdd(product, qty)} icon={<NavIconCart color="#fff" size={18} />}>
            Agregar al Carrito
          </ZButton>

          {/* Compare */}
          <button style={{
            width: '100%', padding: '12px', border: `1.5px solid ${Z.border}`, borderRadius: Z.r.md,
            background: Z.surface, cursor: 'pointer', outline: 'none',
            fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.blue,
          }}>Comparar Proveedores</button>
        </div>
      </div>
    </ZScreen>
  );
}

// ── Cart Sub-screen ─────────────────────────────────────────────────────────
function CartScreen({ cart, setCart, total, onBack }) {
  const [payMethod, setPayMethod] = React.useState('');

  const removeItem = (id) => setCart(prev => prev.filter(c => c.id !== id));
  const updateQty = (id, qty) => setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, qty) } : c));

  return (
    <ZScreen bg={Z.bg}>
      <ZHeader title="Mi Carrito" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <NavIconCart color={Z.textMuted} size={48} />
            <p style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 600, color: Z.textMuted, marginTop: 16 }}>Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            {/* Items */}
            {cart.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, ${Z.divider}, ${Z.blueLight})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'monospace', fontSize: 8, color: Z.textMuted,
                }}>foto</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{item.name}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>{item.brand}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 800, color: Z.orangeDark, marginTop: 4 }}>
                    Bs {(parseFloat(item.price.replace(',', '')) * item.qty).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: `1px solid ${Z.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 28, height: 28, border: 'none', background: Z.surface, cursor: 'pointer', fontSize: 14, fontWeight: 700, outline: 'none' }}>−</button>
                    <span style={{ width: 28, textAlign: 'center', fontFamily: Z.font, fontSize: 12, fontWeight: 700 }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 28, height: 28, border: 'none', background: Z.surface, cursor: 'pointer', fontSize: 14, fontWeight: 700, outline: 'none' }}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} style={{
                    border: 'none', background: 'none', cursor: 'pointer', outline: 'none',
                    fontFamily: Z.font, fontSize: 10, color: Z.error, fontWeight: 600,
                  }}>Quitar</button>
                </div>
              </div>
            ))}

            {/* Destination */}
            <div style={{
              padding: '14px 16px', borderRadius: Z.r.md, background: Z.blueLight,
              border: `1px solid ${Z.bluePastel}`,
            }}>
              <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.blueDark, marginBottom: 6 }}>
                ¿Para qué proyecto es esta compra?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Proyecto existente', 'Nuevo proyecto', 'Compra aislada'].map(opt => (
                  <button key={opt} style={{
                    padding: '10px 14px', borderRadius: Z.r.sm, border: `1px solid ${Z.border}`,
                    background: Z.surface, cursor: 'pointer', outline: 'none', textAlign: 'left',
                    fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.text,
                  }}>{opt}</button>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div>
              <SectionTitle title="Método de Pago" />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                {[
                  { key: 'qr', label: 'Pago QR', icon: <svg width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke={payMethod === 'qr' ? Z.orangeDark : Z.textSec} strokeWidth="1.8" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1" stroke={payMethod === 'qr' ? Z.orangeDark : Z.textSec} strokeWidth="1.8" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1" stroke={payMethod === 'qr' ? Z.orangeDark : Z.textSec} strokeWidth="1.8" fill="none"/><rect x="14" y="14" width="4" height="4" rx="0.5" fill={payMethod === 'qr' ? Z.orangeDark : Z.textSec}/></svg> },
                  { key: 'transfer', label: 'Transferencia', icon: <svg width="22" height="22" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" stroke={payMethod === 'transfer' ? Z.orangeDark : Z.textSec} strokeWidth="1.8" fill="none"/><path d="M2 10h20" stroke={payMethod === 'transfer' ? Z.orangeDark : Z.textSec} strokeWidth="1.8"/></svg> },
                ].map(pm => (
                  <button key={pm.key} onClick={() => setPayMethod(pm.key)} style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '16px 8px', borderRadius: Z.r.md,
                    border: `2px solid ${payMethod === pm.key ? Z.orange : Z.border}`,
                    background: payMethod === pm.key ? Z.orangeLight : Z.surface,
                    cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
                  }}>
                    {pm.icon}
                    <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: payMethod === pm.key ? Z.orangeDark : Z.textSec }}>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Total + checkout */}
            <div style={{
              padding: '16px', borderRadius: Z.r.md, background: Z.surface,
              border: `1px solid ${Z.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec }}>Subtotal</span>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>Bs {total.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec }}>Envío</span>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textMuted }}>Por calcular</span>
              </div>
              <div style={{ height: 1, background: Z.border, margin: '0 0 12px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>Total</span>
                <span style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.orangeDark }}>Bs {total.toLocaleString()}</span>
              </div>
            </div>

            <ZButton disabled={!payMethod} onClick={() => alert('¡Pedido realizado!')}>
              Confirmar Pedido
            </ZButton>
          </>
        )}
      </div>
    </ZScreen>
  );
}

Object.assign(window, { TiendaTab, ProductDetailScreen, CartScreen, STORE_PRODUCTS });

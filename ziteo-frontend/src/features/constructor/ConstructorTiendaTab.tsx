import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Z } from '@/shared/design/tokens'
import { ZButton } from '@/shared/design/components/ZButton'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { ZHeader } from '@/shared/design/components/ZHeader'
import { MapPicker, type MapPickerValue } from '@/shared/components/MapPicker'
import { CargoSelector } from '../tienda/components/CargoSelector'
import type { CargoType } from '../tienda/hooks/useCart'
import { MisPedidosScreen } from '../tienda/components/MisPedidosScreen'
import { TrackOrderScreen } from '../tienda/components/TrackOrderScreen'
import { QrPagoModal } from '../tienda/components/QrPagoModal'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useProyectos } from '@/features/proyectos/hooks/useProyectos'
import { getProductImageUrl } from '../tienda/utils/productImages'

// ── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string              // UUID from DB
  provider_id: string     // for grouped checkout
  provider_name: string   // shown as brand
  name: string
  price_num: number       // numeric price for arithmetic
  price: string           // formatted "62" / "1,200"
  unit: string
  category: string
  weight: string
  sku: string
  stock: number
  image_url?: string | null
}

interface CartItem extends Product { qty: number }

const FILTER_OPTIONS = ['Todos', 'Materiales', 'Herramientas', 'Máquinas', 'Seguridad']

const OFFERS = [
  { title: '¡Felicidades Sucre! 🇧🇴', subtitle: '15% OFF en Herramientas y flete gratis por el 25 de Mayo', from: '#E53935', to: '#FFA000' },
  { title: '15% OFF en Cemento',  subtitle: 'Fancesa IP-30 · Compra mín. 50 bolsas', from: '#E8733A', to: '#A43700' },
  { title: 'Combo Cimentación',   subtitle: 'Cemento + Fierro + Arena desde Bs 2,400', from: '#3A7BD5', to: '#1E5FAD' },
  { title: 'Envío Gratis',        subtitle: 'En pedidos mayores a Bs 1,000', from: '#A43700', to: '#7A2900' },
]

// ── DB layer ──────────────────────────────────────────────────────────────────
interface DbProductRow {
  id: string
  provider_id: string
  name: string
  price_unit: number | string
  unit_type: string | null
  stock_quantity: number | null
  category: string | null
  weight_kg: number | null
  provider: { name: string | null; bio: string | null } | null
  image_url?: string | null
}

function rowToProduct(r: DbProductRow): Product {
  const priceNum = typeof r.price_unit === 'string' ? parseFloat(r.price_unit) : Number(r.price_unit ?? 0)
  return {
    id: r.id,
    provider_id: r.provider_id,
    provider_name: r.provider?.bio?.trim() || r.provider?.name?.trim() || 'Proveedor',
    name: r.name,
    price_num: priceNum,
    price: priceNum.toLocaleString('es-BO', { maximumFractionDigits: 2 }),
    unit: r.unit_type ?? 'unid',
    category: r.category ?? 'Materiales',
    weight: r.weight_kg ? `${r.weight_kg}kg` : '—',
    sku: r.id.slice(0, 8).toUpperCase(),
    stock: r.stock_quantity ?? 0,
    image_url: r.image_url,
  }
}

function useProducts() {
  return useQuery({
    queryKey: ['products', 'tienda'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, provider_id, name, price_unit, unit_type, stock_quantity, category, weight_kg, image_url, provider:profiles!provider_id(name, bio)')
        .eq('active', true)
        .eq('is_deleted', false)
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data as unknown as DbProductRow[]).map(rowToProduct)
    },
  })
}

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product, onTap }: { product: Product; onTap: () => void }) {
  const imgUrl = getProductImageUrl(product.name, product.image_url)
  return (
    <button
      onClick={onTap}
      style={{ width: '100%', background: Z.surface, borderRadius: Z.r.md, border: `1px solid ${Z.border}`, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, outline: 'none' }}
    >
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: Z.surface, overflow: 'hidden' }}>
        {imgUrl ? (
          <img src={imgUrl} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${Z.divider} 0%, ${Z.blueLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textMuted }}>{product.category}</span>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.text, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted, marginTop: 2 }}>{product.provider_name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
          <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 800, color: Z.orangeDark }}>Bs {product.price}</span>
          <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>/{product.unit}</span>
        </div>
      </div>
    </button>
  )
}

function BestSellerCard({ product, rank, onTap }: { product: Product; rank: number; onTap: () => void }) {
  const imgUrl = getProductImageUrl(product.name, product.image_url)
  return (
    <button
      onClick={onTap}
      style={{ flexShrink: 0, width: 138, background: Z.surface, borderRadius: Z.r.md, border: `1px solid ${Z.border}`, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, outline: 'none' }}
    >
      <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: Z.surface, overflow: 'hidden' }}>
        {imgUrl ? (
          <>
            <img src={imgUrl} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 50%)' }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${Z.divider} 0%, ${Z.blueLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
        )}
        <div style={{ position: 'absolute', top: 8, left: 8, background: Z.orangeDark, color: '#fff', borderRadius: 6, padding: '3px 8px', fontFamily: Z.font, fontSize: 10, fontWeight: 800, zIndex: 1 }}>
          #{rank}
        </div>
        <span style={{ position: 'absolute', top: 8, right: 8, fontFamily: Z.font, fontSize: 10, fontWeight: 600, color: imgUrl ? '#fff' : Z.textMuted, textShadow: imgUrl ? '0 1px 3px rgba(0,0,0,0.8)' : 'none', zIndex: 1 }}>{product.category}</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.text, lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted, marginTop: 1 }}>{product.provider_name}</div>
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
  const maxQty = product.stock || 1
  const imgUrl = getProductImageUrl(product.name, product.image_url)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ZHeader title={product.name} onBack={onBack} />
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ height: 180, borderRadius: Z.r.lg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: Z.surface, overflow: 'hidden', border: `1px solid ${Z.border}` }}>
          {imgUrl ? (
            <img src={imgUrl} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${Z.divider} 0%, ${Z.blueLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 700, color: Z.textMuted }}>{product.category}</span>
            </div>
          )}
        </div>

        <div>
          <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textMuted }}>{product.provider_name}</span>
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
            { label: 'Disponible', value: `${product.stock} ${product.unit}` },
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
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                if (Number.isNaN(n)) { setQty(1); return }
                setQty(Math.max(1, Math.min(maxQty, n)))
              }}
              style={{ width: 72, height: 44, textAlign: 'center', fontFamily: Z.font, fontSize: 16, fontWeight: 700, color: Z.text, borderTop: 'none', borderBottom: 'none', borderLeft: `1px solid ${Z.border}`, borderRight: `1px solid ${Z.border}`, background: Z.surface, outline: 'none', padding: 0 }}
            />
            <button onClick={() => setQty(Math.min(maxQty, qty + 1))} style={{ width: 44, height: 44, border: 'none', background: Z.surface, cursor: 'pointer', fontFamily: Z.font, fontSize: 20, fontWeight: 700, color: Z.text, outline: 'none' }}>+</button>
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, marginTop: 6 }}>
            Total: <strong style={{ color: Z.orangeDark }}>Bs {(product.price_num * qty).toLocaleString('es-BO')}</strong>
          </div>
        </div>

        <ZButton onClick={() => onAdd(product, qty)}>Agregar al Carrito</ZButton>
      </div>
    </div>
  )
}

// ── CartScreen ────────────────────────────────────────────────────────────────
const detectCargoType = (w: number | null): CargoType | null =>
  w === null ? null : w < 5 ? 'light' : w <= 100 ? 'medium' : 'heavy'

function CartScreen({ cart, setCart, onBack }: {
  cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; onBack: () => void
}) {
  const userId = useAuthStore((s) => s.user?.user_id)
  const [payMethod, setPayMethod] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery')
  const [deliveryLoc, setDeliveryLoc] = useState<MapPickerValue | null>(null)
  const [cargoType, setCargoType] = useState<CargoType | null>(null)
  const [originProjectId, setOriginProjectId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrModalOrder, setQrModalOrder] = useState<{ orderId: string; providerId: string } | null>(null)

  // Proyectos del constructor con coordenadas guardadas → permiten "comprar desde un terreno".
  const { data: proyectos = [] } = useProyectos({ constructor_id: userId })
  const proyectosConCoords = useMemo(
    () => proyectos.filter((p) => p.location_lat != null && p.location_lng != null),
    [proyectos]
  )

  const total = cart.reduce((sum, c) => sum + c.price_num * c.qty, 0)

  const totalWeight = useMemo(() => {
    // Product.weight es un string preformateado ("5kg" / "—"), parseamos el numérico.
    const weightOf = (c: CartItem): number | null => {
      const m = /^([\d.]+)kg$/.exec(c.weight)
      return m ? parseFloat(m[1]) : null
    }
    const hasWeight = cart.some((c) => weightOf(c) != null)
    if (!hasWeight) return null
    return cart.reduce((sum, c) => sum + (weightOf(c) ?? 0) * c.qty, 0)
  }, [cart])
  const detectedCargo = useMemo(() => detectCargoType(totalWeight), [totalWeight])
  const effectiveCargo = cargoType ?? detectedCargo

  const removeItem = (id: string) => setCart(prev => prev.filter(c => c.id !== id))
  const updateQty = (id: string, qty: number) => setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, Math.min(c.stock, qty)) } : c))

  // Group items by provider for one place_order RPC call per provider.
  const byProvider = useMemo(() => {
    const groups = new Map<string, { provider_name: string; items: CartItem[] }>()
    cart.forEach((item) => {
      const g = groups.get(item.provider_id) ?? { provider_name: item.provider_name, items: [] }
      g.items.push(item)
      groups.set(item.provider_id, g)
    })
    return Array.from(groups.entries())
  }, [cart])

  async function handleConfirm() {
    if (!userId || !payMethod || cart.length === 0) return
    if (deliveryMethod === 'delivery' && !deliveryLoc?.address) {
      setError('Indica la dirección de entrega o elige "Recoger en tienda".')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      let lastOrderId: string | null = null
      for (const [providerId, group] of byProvider) {
        const groupTotal = group.items.reduce((s, i) => s + i.price_num * i.qty, 0)
        const items = group.items.map((i) => ({
          product_id: i.id,
          quantity: i.qty,
          price_unit: i.price_num,
        }))
        const { data: orderId, error: rpcError } = await supabase.rpc('place_order', {
          p_constructor_id: userId,
          p_provider_id: providerId,
          p_total: groupTotal,
          p_items: items,
          p_delivery_method: deliveryMethod,
          p_delivery_address: deliveryMethod === 'delivery' ? deliveryLoc?.address ?? undefined : undefined,
          p_delivery_lat: deliveryMethod === 'delivery' ? deliveryLoc?.lat || undefined : undefined,
          p_delivery_lng: deliveryMethod === 'delivery' ? deliveryLoc?.lng || undefined : undefined,
          p_cargo_type: effectiveCargo ?? undefined,
          p_project_id: deliveryMethod === 'delivery' ? (originProjectId ?? undefined) : undefined,
        })
        if (rpcError) throw rpcError
        lastOrderId = orderId as unknown as string
      }
      // Web Push al provider (la notificación in-app la crea el trigger trg_notify_provider_on_new_order)
      for (const [providerId] of byProvider) {
        supabase.functions.invoke('notifications/send-push', {
          body: {
            user_id: providerId,
            title:   'Nuevo pedido',
            body:    'Has recibido un nuevo pedido de materiales.',
            url:     '/',
          },
        }).catch((err: unknown) => console.warn('[send-push] order push failed:', err))
      }

      const singleProvider = byProvider.length === 1
      if (singleProvider && lastOrderId && (payMethod === 'qr' || payMethod === 'transfer')) {
        setCart([])
        setQrModalOrder({ orderId: lastOrderId, providerId: byProvider[0][0] })
      } else {
        setOrdered(true)
        setTimeout(() => { setCart([]); onBack() }, 1800)
      }
    } catch (e) {
      const hasMessage = e instanceof Error && !!e.message
      const msg = hasMessage ? (e as Error).message : ''
      // Los errores de negocio del RPC (RAISE EXCEPTION en español, ej. "Stock insuficiente...")
      // no traen `code` de Postgres/PostgREST (PGRST*, 22xxx/23xxx/42xxx) — esos sí son técnicos
      // y deben mostrar el mensaje genérico para no exponer detalle interno al usuario.
      const pgCode = (e as { code?: string } | null)?.code
      const isTechnicalError = !!pgCode && /^(PGRST|22|23|42)/.test(pgCode)
      setError(hasMessage && !isTechnicalError ? msg : 'No se pudo crear el pedido. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

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
            {byProvider.map(([providerId, group]) => (
              <div key={providerId} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Proveedor: {group.provider_name}
                </div>
                {group.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}` }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${Z.divider}, ${Z.blueLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: Z.font, fontSize: 9, fontWeight: 600, color: Z.textMuted }}>{item.category}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{item.name}</div>
                      <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>{item.provider_name}</div>
                      <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 800, color: Z.orangeDark, marginTop: 4 }}>
                        Bs {(item.price_num * item.qty).toLocaleString('es-BO')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${Z.border}`, borderRadius: 8, overflow: 'hidden' }}>
                        <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 44, height: 44, border: 'none', background: Z.surface, cursor: 'pointer', fontSize: 16, fontWeight: 700, outline: 'none' }}>−</button>
                        <input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.qty}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10)
                            updateQty(item.id, Number.isNaN(n) ? 1 : n)
                          }}
                          style={{ width: 56, height: 44, textAlign: 'center', fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, borderTop: 'none', borderBottom: 'none', borderLeft: `1px solid ${Z.border}`, borderRight: `1px solid ${Z.border}`, background: Z.surface, outline: 'none', padding: 0 }}
                        />
                        <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 44, height: 44, border: 'none', background: Z.surface, cursor: 'pointer', fontSize: 16, fontWeight: 700, outline: 'none' }}>+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', outline: 'none', fontFamily: Z.font, fontSize: 10, color: Z.error, fontWeight: 600 }}>Quitar</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {byProvider.length > 1 && (
              <div style={{ padding: '10px 14px', borderRadius: Z.r.sm, background: Z.blueLight, border: `1px solid ${Z.bluePastel}` }}>
                <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, lineHeight: 1.5 }}>
                  Tu pedido se dividirá en {byProvider.length} órdenes, una por cada proveedor.
                </span>
              </div>
            )}

            <div>
              <SectionTitle title="Entrega" />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                {([
                  { key: 'delivery' as const, label: 'Envío a domicilio', sub: 'La app gestiona el transporte' },
                  { key: 'pickup' as const, label: 'Recoger en tienda', sub: 'Retiras con tu vehículo' },
                ]).map(dm => {
                  const active = deliveryMethod === dm.key
                  return (
                    <button
                      key={dm.key}
                      onClick={() => setDeliveryMethod(dm.key)}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', gap: 3, padding: '14px 12px',
                        borderRadius: Z.r.md, border: `2px solid ${active ? Z.orange : Z.border}`,
                        background: active ? Z.orangeLight : Z.surface, cursor: 'pointer', outline: 'none',
                        textAlign: 'left', transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: active ? Z.orangeDark : Z.text }}>{dm.label}</span>
                      <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec }}>{dm.sub}</span>
                    </button>
                  )
                })}
              </div>
              {deliveryMethod === 'delivery' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {proyectosConCoords.length > 0 && (
                    <div>
                      <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 8 }}>
                        Cargar desde un terreno / proyecto
                      </label>
                      <select
                        value={originProjectId ?? ''}
                        onChange={(e) => {
                          const id = e.target.value || null
                          setOriginProjectId(id)
                          if (id) {
                            const p = proyectosConCoords.find((pr) => pr.id === id)
                            if (p && p.location_lat != null && p.location_lng != null) {
                              setDeliveryLoc({ lat: p.location_lat, lng: p.location_lng, address: p.location_address ?? '' })
                            }
                          }
                        }}
                        style={{
                          width: '100%', padding: '12px 14px', borderRadius: Z.r.md,
                          border: `1.5px solid ${originProjectId ? Z.orange : Z.border}`,
                          background: Z.surface, color: Z.text, fontFamily: Z.font, fontSize: 14,
                          fontWeight: 600, outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
                          appearance: 'none', WebkitAppearance: 'none',
                        }}
                      >
                        <option value="">Ubicación nueva…</option>
                        {proyectosConCoords.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <MapPicker
                    label="Dirección de entrega (GPS o pin)"
                    value={deliveryLoc}
                    onChange={(loc) => {
                      // Editar manualmente la ubicación desliga el origen del proyecto.
                      setOriginProjectId(null)
                      setDeliveryLoc(loc)
                    }}
                    placeholder="¿A dónde enviamos tu pedido?"
                    height={200}
                  />
                </div>
              )}
              {deliveryMethod === 'delivery' && (
                <div style={{ marginTop: 12 }}>
                  <CargoSelector
                    value={cargoType}
                    detected={detectedCargo}
                    hasWeight={totalWeight !== null}
                    onChange={setCargoType}
                  />
                </div>
              )}
            </div>

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
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>Bs {total.toLocaleString('es-BO')}</span>
              </div>
              <div style={{ height: 1, background: Z.border, marginBottom: 12 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>Total</span>
                <span style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.orangeDark }}>Bs {total.toLocaleString('es-BO')}</span>
              </div>
            </div>

            {error && (
              <div role="alert" style={{ padding: '12px 14px', borderRadius: Z.r.sm, background: Z.errorBg, border: `1px solid ${Z.error}` }}>
                <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error, fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {ordered && (
              <div role="status" style={{ padding: '14px', borderRadius: Z.r.sm, background: Z.successBg, color: Z.successDark, fontFamily: Z.font, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                {byProvider.length > 1
                  ? '¡Pedidos realizados! Paga cada uno desde "Mis Pedidos". Redirigiendo...'
                  : '¡Pedido realizado! Redirigiendo...'}
              </div>
            )}
            <ZButton disabled={!payMethod || ordered || submitting || !!qrModalOrder} onClick={handleConfirm}>
              {submitting ? 'Procesando...' : 'Confirmar Pedido'}
            </ZButton>
          </>
        )}
      </div>

      {qrModalOrder && (
        <QrPagoModal
          providerId={qrModalOrder.providerId}
          orderId={qrModalOrder.orderId}
          method={payMethod === 'transfer' ? 'transfer' : 'qr'}
          onConfirmed={() => { setQrModalOrder(null); onBack() }}
          onClose={() => { setQrModalOrder(null); onBack() }}
        />
      )}
    </div>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
type TiendaScreen = 'list' | 'detail' | 'cart' | 'pedidos'

export function ConstructorTiendaTab() {
  const { data: products = [], isLoading, error } = useProducts()
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [screen, setScreen] = useState<TiendaScreen>('list')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [offerIdx, setOfferIdx] = useState(0)
  const [carouselPaused, setCarouselPaused] = useState(false)
  const [trackingOrder, setTrackingOrder] = useState<{ orderId: string; driverId: string } | null>(null)

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q === '') return products
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.provider_name.toLowerCase().includes(q)
    )
  }, [products, search])
  const filtered = useMemo(
    () => (category === '' ? searched : searched.filter(p => p.category === category)),
    [searched, category]
  )
  const bestSellers = useMemo(() => searched.slice(0, 4), [searched])
  const materialsByProvider = useMemo(() => {
    return Object.entries(
      searched
        .filter(p => p.category === 'Materiales')
        .reduce<Record<string, Product[]>>((acc, p) => {
          if (!acc[p.provider_name]) acc[p.provider_name] = []
          acc[p.provider_name].push(p)
          return acc
        }, {})
    )
  }, [searched])

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0)
  const cartTotal = cart.reduce((sum, c) => sum + c.price_num * c.qty, 0)
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
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: Math.min(c.stock, c.qty + qty) } : c)
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
  if (screen === 'pedidos') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <ZHeader title="Mis Pedidos" onBack={() => setScreen('list')} />
        <MisPedidosScreen onTrackOrder={(orderId, driverId) => setTrackingOrder({ orderId, driverId })} />
        {trackingOrder && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
            <TrackOrderScreen
              orderId={trackingOrder.orderId}
              driverId={trackingOrder.driverId}
              onBack={() => setTrackingOrder(null)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: Z.r.sm, background: Z.surface, border: `1.5px solid ${Z.border}` }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar materiales, herramientas..."
            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontFamily: Z.font, fontSize: 13, color: Z.text, padding: 0 }}
          />
        </div>

        <button
          onClick={() => setScreen('pedidos')}
          aria-label="Mis pedidos"
          title="Mis pedidos"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            width: 44, height: 44, borderRadius: Z.r.sm,
            border: `1.5px solid ${Z.border}`, background: Z.surface, cursor: 'pointer', outline: 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={Z.text} strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke={Z.text} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

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
              <div
                tabIndex={-1}
                onKeyDown={(e) => e.key === 'Escape' && setShowFilter(false)}
                style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: Z.surface, border: `1.5px solid ${Z.border}`, borderRadius: Z.r.md, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 41, minWidth: 170, overflow: 'hidden' }}
              >
                {FILTER_OPTIONS.map((opt, idx) => {
                  const val = opt === 'Todos' ? '' : opt
                  const isActive = category === val
                  return (
                    <button
                      key={opt}
                      autoFocus={idx === 0}
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
            <button key={i} type="button" onClick={() => setOfferIdx(i)} aria-label={`Ir a oferta: ${OFFERS[i].title}`} aria-pressed={i === offerIdx} style={{ padding: '10px 8px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
              <div style={{ width: i === offerIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === offerIdx ? '#E8733A' : Z.border, transition: 'all 0.3s' }} />
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`, animation: 'pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div style={{ padding: '14px', borderRadius: Z.r.md, background: Z.errorBg, border: `1px solid ${Z.error}` }}>
          <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.error }}>No pudimos cargar el catálogo. Revisa tu conexión.</span>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text, margin: 0 }}>Catálogo en construcción</p>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted, margin: '6px 0 0', lineHeight: 1.6 }}>
            Pronto verás aquí los materiales de los proveedores de tu ciudad.
          </p>
        </div>
      )}

      {!isLoading && !error && products.length > 0 && category === '' && search === '' && (
        <>
          {bestSellers.length > 0 && (
            <div>
              <SectionTitle title="Más Vendido" />
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginTop: 10, scrollbarWidth: 'none' }}>
                {bestSellers.map((p, i) => (
                  <BestSellerCard key={p.id} product={p} rank={i + 1} onTap={() => handleTap(p)} />
                ))}
              </div>
            </div>
          )}

          {materialsByProvider.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <SectionTitle title="Por Proveedor" />
              {materialsByProvider.map(([provider, prods]) => (
                <div key={provider}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{provider}</span>
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
          )}
        </>
      )}

      {!isLoading && !error && products.length > 0 && (category !== '' || search !== '') && (
        <div>
          <SectionTitle
            title={category !== '' ? category : `Resultados${search ? ` · "${search.trim()}"` : ''}`}
            action={`${filtered.length} items`}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onTap={() => handleTap(p)} />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted }}>
                  {search !== '' ? 'No se encontraron productos' : 'No hay productos en esta categoría'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {cartCount > 0 && (
        <button
          onClick={() => setScreen('cart')}
          aria-label={`Ver carrito · ${cartCount} items · Bs ${cartTotal.toLocaleString('es-BO')}`}
          style={{ position: 'sticky', bottom: 'calc(80px + env(safe-area-inset-bottom))', alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: Z.r.full, border: 'none', cursor: 'pointer', background: Z.orangeDark, color: '#fff', boxShadow: '0 4px 20px rgba(164,55,0,0.3)', fontFamily: Z.font, fontSize: 14, fontWeight: 700, zIndex: 5, outline: 'none' }}
        >
          <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700 }}>Carrito · {cartCount} items · Bs {cartTotal.toLocaleString('es-BO')}</span>
        </button>
      )}
    </div>
  )
}

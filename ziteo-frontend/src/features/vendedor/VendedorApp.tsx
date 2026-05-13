import { useState, useEffect } from 'react'
import { Z } from '@/shared/design/tokens'
import { RoleDashNav } from '@/shared/design/shell/RoleDashNav'
import type { Tab } from '@/shared/design/shell/RoleDashNav'
import { SummaryCard } from '@/shared/design/shell/SummaryCard'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { FilterBar } from '@/shared/design/shell/FilterBar'
import { ZIcon } from '@/shared/design/components/ZIcon'
import { ZButton } from '@/shared/design/components/ZButton'
import { ZInput } from '@/shared/design/components/ZInput'
import { ZHeader } from '@/shared/design/components/ZHeader'
import { ZScreen } from '@/shared/design/components/ZScreen'
import { ZAvatar } from '@/shared/design/components/ZAvatar'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useNavStore } from '@/shared/store/navStore'
import { useIncomingOrders, useUpdateOrderStatus } from '@/features/proveedor/hooks/useProveedorOrders'
import { useInventario, useToggleProductoActivo, INVENTARIO_PAGE_SIZE } from '@/features/proveedor/hooks/useInventario'
import type { ProductoInventario } from '@/features/proveedor/hooks/useInventario'
import { useToast } from '@/shared/hooks/useToast'
import { Toast } from '@/shared/components/Toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

type VendedorTab = 'home' | 'inventario' | 'pedidos' | 'cotizaciones'

// ─── Nav Icons ───────────────────────────────────────────────────────────────

function VNavIconHome({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4v-6h-8v6H4a1 1 0 01-1-1V10.5z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function VNavIconInventory({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.8" />
    </svg>
  )
}

function VNavIconOrders({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
        stroke={color} strokeWidth="1.8" fill="none" />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M9 12h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function VNavIconQuotes({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const VENDEDOR_TABS: Tab[] = [
  { key: 'home',         label: 'Inicio',      Icon: VNavIconHome },
  { key: 'inventario',   label: 'Inventario',  Icon: VNavIconInventory },
  { key: 'pedidos',      label: 'Pedidos',     Icon: VNavIconOrders },
  { key: 'cotizaciones', label: 'Cotizaciones', Icon: VNavIconQuotes },
]

// ─── Dash Header ─────────────────────────────────────────────────────────────

function VendedorHeader({ onProfile }: { onProfile: () => void }) {
  const setTab = useNavStore((s) => s.setTab)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '54px 20px 10px',
        background: Z.bg,
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: Z.font,
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: 2,
          background: Z.gradMixed,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        ZITEO
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => setTab('notificaciones')}
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: 12,
            border: 'none',
            background: Z.surface,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          aria-label="Notificaciones"
        >
          <ZIcon name="bell" size={20} color={Z.textSec} />
        </button>
        <div onClick={onProfile} style={{ cursor: 'pointer' }}>
          <ZAvatar name="V" size={38} />
        </div>
      </div>
    </div>
  )
}

// ─── Activity item ───────────────────────────────────────────────────────────

function ActivityItem({
  title,
  subtitle,
  time,
  color = Z.orange,
}: {
  title: string
  subtitle: string
  time: string
  color?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: `1px solid ${Z.divider}`,
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textMuted, marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
      <span style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {time}
      </span>
    </div>
  )
}

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  pending:    Z.orange,
  processing: Z.blue,
  shipped:    Z.blue,
  delivered:  Z.success,
  cancelled:  Z.error,
}

const STATUS_LABEL: Record<string, string> = {
  pending:    'Pendiente',
  processing: 'En proceso',
  shipped:    'Enviado',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  return `hace ${days}d`
}

// ─── HOME TAB ────────────────────────────────────────────────────────────────

function HomeTab({ onNavigate }: { onNavigate: (tab: VendedorTab) => void }) {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name ? user.name.split(' ')[0] : 'Proveedor'
  const city = user?.city ?? 'Bolivia'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const providerId = user?.user_id ?? ''

  const { data: orders = [] } = useIncomingOrders(providerId)
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const { data: products = [] } = useInventario(0)

  const recentOrders = orders.slice(0, 3)

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 21, color: Z.text, margin: 0 }}>
          {greeting}, {firstName}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <ZIcon name="map-pin" size={13} color={Z.textMuted} />
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec }}>
            {city} · Vendedor
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <SummaryCard
          icon={<VNavIconOrders color={Z.orange} size={17} />}
          label="Pedidos pendientes"
          value={String(pendingCount)}
          color={Z.orange}
        />
        <SummaryCard
          icon={<VNavIconInventory color={Z.blue} size={17} />}
          label="Productos activos"
          value={String(products.filter((p) => p.active).length)}
          color={Z.blue}
        />
        <SummaryCard
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
                stroke={Z.orange} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </svg>
          }
          label="Ventas del mes"
          value={`${(orders.reduce((s, o) => s + (o.status === 'delivered' ? o.total : 0), 0) / 1000).toFixed(1)}k`}
          color={Z.orange}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => onNavigate('pedidos')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
            borderRadius: Z.r.lg, border: 'none', cursor: 'pointer', width: '100%',
            background: `linear-gradient(135deg, ${Z.orangeDark} 0%, ${Z.orange} 100%)`,
            boxShadow: '0 4px 16px rgba(164,55,0,0.22)', textAlign: 'left', outline: 'none',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-6-6zm0 0v6h6"
                stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
              <path d="M8 13h4M8 17h8" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: '#fff' }}>
              Gestionar Pedidos
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {pendingCount} pendientes de despacho
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onNavigate('inventario')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '16px',
              borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
              background: Z.surface, textAlign: 'left', outline: 'none',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 11, background: Z.blueLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <VNavIconInventory color={Z.blueDark} size={20} />
            </div>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>Inventario</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>
                {products.length} productos
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('cotizaciones')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '16px',
              borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
              background: Z.surface, textAlign: 'left', outline: 'none',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 11, background: Z.orangeLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <VNavIconQuotes color={Z.orangeDark} size={20} />
            </div>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>Cotizaciones</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>Ver solicitudes</div>
            </div>
          </button>
        </div>
      </div>

      <div>
        <SectionTitle
          title="Últimos Pedidos"
          action="Ver todos"
          onAction={() => onNavigate('pedidos')}
        />
        <div style={{ marginTop: 8 }}>
          {recentOrders.length === 0 ? (
            <div style={{
              padding: '32px 0', textAlign: 'center',
              fontFamily: Z.font, fontSize: 13, color: Z.textMuted,
            }}>
              No hay pedidos recientes
            </div>
          ) : (
            recentOrders.map((o) => (
              <ActivityItem
                key={o.id}
                title={`${o.buyer_name ?? 'Comprador'} — ${o.items.map((i) => `${i.quantity}x ${i.product?.name ?? ''}`).join(', ')}`}
                subtitle={`Bs ${o.total.toLocaleString('es-BO')} · ${STATUS_LABEL[o.status] ?? o.status}`}
                time={timeAgo(o.created_at)}
                color={STATUS_COLOR[o.status] ?? Z.orange}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── INVENTARIO TAB ──────────────────────────────────────────────────────────

type UpdateMode = 'manual' | 'csv' | 'api' | null

interface ProductForm {
  name: string
  description: string
  price: string
  unit: string
  stock: string
  category_id: string
  image_url: string
  listing_type: 'sell' | 'rent'
  weight_kg: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: '',
  unit: 'unidad',
  stock: '',
  category_id: '',
  image_url: '',
  listing_type: 'sell',
  weight_kg: '',
}

interface Category {
  id: string
  name: string
}

function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('id, name').order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

function InventarioTab() {
  const user = useAuthStore((s) => s.user)
  const { toasts, showToast, removeToast } = useToast()
  const queryClient = useQueryClient()
  const [updateMode, setUpdateMode] = useState<UpdateMode>(null)
  const [offset, setOffset] = useState(0)
  const [allProducts, setAllProducts] = useState<ProductoInventario[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [manualQty, setManualQty] = useState<Record<string, number>>({})

  const { data: page = [], isLoading, isFetching } = useInventario(offset)
  const { mutate: toggleActivo } = useToggleProductoActivo()
  const { data: categories = [] } = useCategories()

  useEffect(() => {
    if (page.length === 0 && offset === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllProducts([])
      return
    }
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

  const hasMore = page.length === INVENTARIO_PAGE_SIZE

  const criticalProducts = allProducts.filter((p) => p.stock < 10 && p.active)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('products').insert({
      name: form.name,
      description: form.description,
      price_unit: parseFloat(form.price),
      unit_type: form.unit,
      stock_quantity: parseInt(form.stock, 10),
      category_id: form.category_id || null,
      provider_id: user.user_id,
      image_url: form.image_url || null,
      listing_type: form.listing_type,
      active: true,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    setSaving(false)
    if (error) {
      showToast('Error al guardar el producto', 'error')
    } else {
      setOffset(0)
      setAllProducts([])
      queryClient.invalidateQueries({ queryKey: ['inventario', user.user_id] })
      setForm(EMPTY_FORM)
      setShowForm(false)
      showToast('Producto guardado', 'success')
    }
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Inventario</h2>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              borderRadius: 20, border: 'none', cursor: 'pointer',
              background: Z.orangeDark, color: '#fff', outline: 'none',
              fontFamily: Z.font, fontSize: 12, fontWeight: 700,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Agregar
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { key: 'manual' as const, label: 'Manual', icon: '✎' },
            { key: 'csv' as const, label: 'CSV', icon: '⇪' },
            { key: 'api' as const, label: 'API Sync', icon: '⟳' },
          ]).map((m) => (
            <button
              key={m.key}
              onClick={() => setUpdateMode(updateMode === m.key ? null : m.key)}
              style={{
                flex: 1, padding: '9px 6px', borderRadius: Z.r.sm, border: 'none', cursor: 'pointer',
                background: updateMode === m.key ? Z.blueLight : Z.surface,
                boxShadow: `0 0 0 1px ${updateMode === m.key ? Z.blue : Z.border}`,
                fontFamily: Z.font, fontSize: 11, fontWeight: 700,
                color: updateMode === m.key ? Z.blueDark : Z.textSec, outline: 'none',
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {updateMode === 'csv' && (
          <div style={{
            padding: '14px', borderRadius: Z.r.md, background: Z.blueLight,
            border: `1px solid ${Z.bluePastel}`,
          }}>
            <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.blueDark }}>
              Carga masiva CSV
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 4 }}>
              Sube tu archivo Excel o CSV para actualizar el inventario completo.
            </div>
            <button style={{
              marginTop: 10, padding: '8px 16px', borderRadius: 20, border: 'none',
              background: Z.blue, color: '#fff', fontFamily: Z.font, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              Subir archivo
            </button>
          </div>
        )}

        {updateMode === 'api' && (
          <div style={{
            padding: '14px', borderRadius: Z.r.md, background: Z.blueLight,
            border: `1px solid ${Z.bluePastel}`,
          }}>
            <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.blueDark }}>
              Integración API
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 4 }}>
              Conecta tu sistema POS o software contable para sincronización automática cada 10 min.
            </div>
            <button style={{
              marginTop: 10, padding: '8px 16px', borderRadius: 20, border: 'none',
              background: Z.blue, color: '#fff', fontFamily: Z.font, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              Configurar API
            </button>
          </div>
        )}

        {criticalProducts.length > 0 && (
          <div style={{
            padding: '12px 14px', borderRadius: Z.r.md,
            background: Z.errorBg, border: '1px solid #FECACA',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: Z.error, flexShrink: 0 }} />
            <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.error }}>
              {criticalProducts.length} {criticalProducts.length === 1 ? 'producto' : 'productos'} con stock crítico
            </span>
          </div>
        )}

        {isLoading && offset === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 80, borderRadius: Z.r.md, background: Z.divider,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : allProducts.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <VNavIconInventory color={Z.textMuted} size={40} />
            <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>
              Tu inventario está vacío
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                marginTop: 12, padding: '10px 20px', borderRadius: 20, border: 'none',
                background: Z.orangeDark, color: '#fff', fontFamily: Z.font, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Agregar producto
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allProducts.map((p) => {
              const isCrit = p.stock < 10
              const pct = Math.min(1, p.stock / Math.max(p.stock, 100))
              const qty = manualQty[p.id] ?? p.stock

              return (
                <div
                  key={p.id}
                  style={{
                    padding: '14px', borderRadius: Z.r.md, background: Z.surface,
                    border: `1.5px solid ${isCrit ? '#FECACA' : Z.border}`,
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', marginBottom: 10,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
                          {p.name}
                        </span>
                        {isCrit && (
                          <span style={{
                            fontFamily: Z.font, fontSize: 9, fontWeight: 700,
                            padding: '3px 8px', borderRadius: 20,
                            background: Z.errorBg, color: Z.error,
                          }}>
                            CRÍTICO
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>
                        {p.unit}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleActivo({ product_id: p.id, active: !p.active })}
                      style={{
                        position: 'relative', width: 36, height: 20, borderRadius: 10,
                        border: 'none', cursor: 'pointer',
                        background: p.active ? Z.orange : Z.border,
                        transition: 'background 0.2s', outline: 'none',
                      }}
                      aria-label={p.active ? 'Desactivar' : 'Activar'}
                    >
                      <span style={{
                        position: 'absolute', top: 2,
                        left: p.active ? 'calc(100% - 18px)' : 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s',
                      }} />
                    </button>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, marginBottom: 4 }}>
                      Stock disponible
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: Z.divider, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${pct * 100}%`,
                        background: isCrit ? Z.error : Z.orange,
                        transition: 'width 0.5s',
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: isCrit ? Z.error : Z.text }}>
                        {p.stock}
                      </div>
                      <div style={{ fontFamily: Z.font, fontSize: 9, color: Z.textMuted, fontWeight: 600 }}>Stock</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.orangeDark }}>
                        Bs {p.price}
                      </div>
                      <div style={{ fontFamily: Z.font, fontSize: 9, color: Z.textMuted }}>/{p.unit}</div>
                    </div>
                  </div>

                  {updateMode === 'manual' && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>Ajustar:</span>
                      <button
                        onClick={() => setManualQty((prev) => ({ ...prev, [p.id]: Math.max(0, qty - 1) }))}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: `1px solid ${Z.border}`, background: Z.surface,
                          cursor: 'pointer', fontSize: 18, fontWeight: 700, outline: 'none',
                        }}
                      >−</button>
                      <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, width: 40, textAlign: 'center' }}>
                        {qty}
                      </span>
                      <button
                        onClick={() => setManualQty((prev) => ({ ...prev, [p.id]: qty + 1 }))}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: `1px solid ${Z.border}`, background: Z.surface,
                          cursor: 'pointer', fontSize: 18, fontWeight: 700, outline: 'none',
                        }}
                      >+</button>
                      <button
                        onClick={async () => {
                          const { error } = await supabase
                            .from('products')
                            .update({ stock_quantity: qty })
                            .eq('id', p.id)
                          if (!error) {
                            queryClient.invalidateQueries({ queryKey: ['inventario', user?.user_id] })
                            showToast('Stock actualizado', 'success')
                          }
                        }}
                        style={{
                          marginLeft: 'auto', padding: '6px 14px', borderRadius: 20,
                          border: 'none', background: Z.orangeDark, color: '#fff',
                          fontFamily: Z.font, fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none',
                        }}
                      >
                        Guardar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {isFetching && offset > 0 && (
              <>
                <div style={{ height: 80, borderRadius: Z.r.md, background: Z.divider }} />
                <div style={{ height: 80, borderRadius: Z.r.md, background: Z.divider }} />
              </>
            )}

            {hasMore && !isFetching && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
                <button
                  onClick={() => setOffset((prev) => prev + INVENTARIO_PAGE_SIZE)}
                  style={{
                    padding: '10px 24px', borderRadius: 20,
                    background: Z.surface, border: `1px solid ${Z.border}`,
                    fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec,
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  Cargar más
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: Z.bg, display: 'flex', flexDirection: 'column' }}>
          <ZHeader title="Agregar producto" onBack={() => { setShowForm(false); setForm(EMPTY_FORM) }} />
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ZInput
              label="Nombre"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Ej: Cemento IP-30"
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <ZInput
                  label="Precio (Bs.)"
                  type="number"
                  value={form.price}
                  onChange={(v) => setForm((f) => ({ ...f, price: v }))}
                  placeholder="58"
                />
              </div>
              <div style={{ flex: 1 }}>
                <ZInput
                  label="Stock"
                  type="number"
                  value={form.stock}
                  onChange={(v) => setForm((f) => ({ ...f, stock: v }))}
                  placeholder="100"
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>Unidad</label>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                style={{
                  fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text,
                  padding: '14px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                  background: Z.surface, outline: 'none',
                }}
              >
                {['kg', 'm2', 'm3', 'unidad', 'saco', 'varilla'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>Categoría</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                style={{
                  fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: form.category_id ? Z.text : Z.textMuted,
                  padding: '14px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                  background: Z.surface, outline: 'none',
                }}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <ZInput
              label="Peso unitario (kg, opcional)"
              type="number"
              value={form.weight_kg}
              onChange={(v) => setForm((f) => ({ ...f, weight_kg: v }))}
              placeholder="ej: 42.5"
            />
          </div>
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${Z.border}`, flexShrink: 0 }}>
            <ZButton
              onClick={handleSave}
              disabled={saving || !form.name || !form.price || !form.stock || !form.category_id}
            >
              {saving ? 'Guardando...' : 'Guardar producto'}
            </ZButton>
          </div>
        </div>
      )}
    </>
  )
}

// ─── PEDIDOS TAB ─────────────────────────────────────────────────────────────

type PedidosFilter = 'Todos' | 'Pendiente' | 'Confirmado' | 'Listo' | 'En Tránsito' | 'Entregado'

const FILTER_STATUS_MAP: Record<PedidosFilter, string | null> = {
  Todos:        null,
  Pendiente:    'pending',
  Confirmado:   'processing',
  Listo:        'shipped',
  'En Tránsito': 'shipped',
  Entregado:    'delivered',
}

const DISPLAY_STATUS_COLOR: Record<string, string> = {
  Todos:        Z.textMuted,
  Pendiente:    Z.orange,
  Confirmado:   Z.blue,
  Listo:        Z.success,
  'En Tránsito': Z.blue,
  Entregado:    Z.textMuted,
}

interface LogisticaOrderInfo {
  id: string
  buyer_name: string | undefined
  items: string
  total: number
}

function PedidosFilterDropdown({
  options,
  value,
  onChange,
}: {
  options: PedidosFilter[]
  value: PedidosFilter
  onChange: (v: PedidosFilter) => void
}) {
  const [open, setOpen] = useState(false)
  const dot = DISPLAY_STATUS_COLOR[value] ?? Z.textMuted

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '11px 16px', width: '100%',
          borderRadius: Z.r.md, border: `1.5px solid ${open ? Z.orange : Z.border}`,
          background: Z.surface, cursor: 'pointer', outline: 'none',
          fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text,
          transition: 'border-color 0.15s',
          boxShadow: open ? `0 0 0 3px ${Z.orange}22` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: dot }} />
          <span>{value}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M6 9l6 6 6-6" stroke={Z.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: Z.surface, borderRadius: Z.r.md,
          border: `1px solid ${Z.border}`,
          boxShadow: '0 8px 28px rgba(0,0,0,0.10)', zIndex: 50, overflow: 'hidden',
        }}>
          {options.map((opt, i) => {
            const isSelected = opt === value
            const d = DISPLAY_STATUS_COLOR[opt] ?? Z.textMuted
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', width: '100%', border: 'none', cursor: 'pointer',
                  background: isSelected ? Z.orangeLight : 'transparent',
                  fontFamily: Z.font, fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? Z.orangeDark : Z.text,
                  borderBottom: i < options.length - 1 ? `1px solid ${Z.divider}` : 'none',
                  outline: 'none', textAlign: 'left',
                }}
              >
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: d, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{opt}</span>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke={Z.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PedidosTab() {
  const user = useAuthStore((s) => s.user)
  const providerId = user?.user_id ?? ''
  const { toasts, showToast, removeToast } = useToast()
  const [filter, setFilter] = useState<PedidosFilter>('Pendiente')
  const [logisticaOrder, setLogisticaOrder] = useState<LogisticaOrderInfo | null>(null)

  const { data: orders = [], isLoading } = useIncomingOrders(providerId, () => {
    showToast('¡Nuevo pedido recibido!', 'info')
  })
  const { mutate: updateStatus } = useUpdateOrderStatus()

  const statusFilter = FILTER_STATUS_MAP[filter]
  const filtered = statusFilter === null
    ? orders
    : orders.filter((o) => o.status === statusFilter)

  if (logisticaOrder) {
    return (
      <LogisticaSubScreen
        order={logisticaOrder}
        onBack={() => setLogisticaOrder(null)}
      />
    )
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Pedidos</h2>
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textMuted }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <PedidosFilterDropdown
          options={['Todos', 'Pendiente', 'Confirmado', 'Listo', 'En Tránsito', 'Entregado']}
          value={filter}
          onChange={setFilter}
        />

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 100, borderRadius: Z.r.md, background: Z.divider }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <VNavIconOrders color={Z.textMuted} size={40} />
            <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>
              {orders.length === 0 ? 'Sin pedidos por ahora' : 'Sin pedidos en esta categoría'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((order) => {
              const statusColor = STATUS_COLOR[order.status] ?? Z.orange
              const statusLabel = STATUS_LABEL[order.status] ?? order.status
              const itemsSummary = order.items
                .map((i) => `${i.quantity}x ${i.product?.name ?? 'Producto'}`)
                .join(', ')

              return (
                <div
                  key={order.id}
                  style={{
                    padding: '14px 16px', borderRadius: Z.r.md, background: Z.surface,
                    border: `1px solid ${Z.border}`,
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 8,
                  }}>
                    <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
                      {order.buyer_name ?? 'Comprador'}
                    </span>
                    <span style={{
                      fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '4px 10px',
                      borderRadius: 20, background: statusColor + '18', color: statusColor,
                    }}>
                      {statusLabel}
                    </span>
                  </div>

                  <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginBottom: 8 }}>
                    {itemsSummary}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.orangeDark }}>
                      Bs {order.total.toLocaleString('es-BO')}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(
                            { orderId: order.id, status: 'processing', providerId },
                            { onError: () => showToast('No se pudo actualizar el pedido', 'error') }
                          )}
                          style={{
                            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            background: Z.blue, color: '#fff', outline: 'none',
                            fontFamily: Z.font, fontSize: 11, fontWeight: 700,
                          }}
                        >
                          Confirmar
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button
                          onClick={() => setLogisticaOrder({
                            id: order.id,
                            buyer_name: order.buyer_name,
                            items: itemsSummary,
                            total: order.total,
                          })}
                          style={{
                            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            background: Z.orangeDark, color: '#fff', outline: 'none',
                            fontFamily: Z.font, fontSize: 11, fontWeight: 700,
                          }}
                        >
                          Logística
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateStatus(
                            { orderId: order.id, status: 'delivered', providerId },
                            { onError: () => showToast('No se pudo actualizar el pedido', 'error') }
                          )}
                          style={{
                            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            background: Z.success, color: '#fff', outline: 'none',
                            fontFamily: Z.font, fontSize: 11, fontWeight: 700,
                          }}
                        >
                          Confirmar entrega
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{
                    marginTop: 8, fontFamily: Z.font, fontSize: 10, color: Z.textMuted,
                  }}>
                    {timeAgo(order.created_at)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ─── LOGÍSTICA SUB-SCREEN ────────────────────────────────────────────────────

function LogisticaSubScreen({
  order,
  onBack,
}: {
  order: LogisticaOrderInfo
  onBack: () => void
}) {
  const [mode, setMode] = useState<'retiro' | 'flota' | 'app' | null>(null)
  const [driver, setDriver] = useState('')
  const [plate, setPlate] = useState('')

  return (
    <ZScreen bg={Z.bg} style={{ position: 'fixed' }}>
      <ZHeader title="Gestionar Logística" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          padding: '14px', borderRadius: Z.r.md,
          background: Z.orangeLight, border: `1px solid ${Z.orangePastel}`,
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark }}>
            Pedido: {order.buyer_name ?? 'Comprador'}
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>
            {order.items} · Bs {order.total.toLocaleString('es-BO')}
          </div>
        </div>

        <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
          Selecciona modalidad de entrega:
        </div>

        {([
          {
            key: 'retiro' as const,
            icon: '🏪',
            title: 'Retiro en Tienda',
            desc: 'El cliente retira su pedido. Se genera un código QR.',
            color: Z.blue,
          },
          {
            key: 'flota' as const,
            icon: '🚚',
            title: 'Enviar con mi Flota',
            desc: 'Asigna uno de tus repartidores con nombre y placa.',
            color: Z.orange,
          },
          {
            key: 'app' as const,
            icon: '📱',
            title: 'Solicitar Repartidor App',
            desc: 'ZITEO busca el conductor más cercano con capacidad de carga.',
            color: Z.orangeDark,
          },
        ]).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px',
              borderRadius: Z.r.md,
              border: `2px solid ${mode === opt.key ? opt.color : Z.border}`,
              background: mode === opt.key ? opt.color + '12' : Z.surface,
              cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 24 }}>{opt.icon}</span>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
                {opt.title}
              </div>
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 3, lineHeight: 1.4 }}>
                {opt.desc}
              </div>
            </div>
          </button>
        ))}

        {mode === 'retiro' && (
          <div style={{
            padding: '20px', borderRadius: Z.r.md, background: Z.blueLight,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: Z.blueDark, lineHeight: 1.8 }}>
              ████ ██ █████<br />
              █  █ ██ █  █<br />
              ████ ██ █████<br />
              <br />
              Código QR de Retiro<br />
              Válido por 48hs
            </div>
            <ZButton variant="blue" style={{ marginTop: 12 }} onClick={onBack}>
              Notificar al Cliente
            </ZButton>
          </div>
        )}

        {mode === 'flota' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ZInput
              label="Nombre del chofer"
              placeholder="Ej: Carlos Mamani"
              value={driver}
              onChange={setDriver}
            />
            <ZInput
              label="Placa del vehículo"
              placeholder="Ej: 3456-ABC"
              value={plate}
              onChange={setPlate}
            />
            <ZButton disabled={!driver || !plate} onClick={onBack}>
              Asignar y Despachar
            </ZButton>
          </div>
        )}

        {mode === 'app' && (
          <div style={{
            padding: '16px', borderRadius: Z.r.md, background: Z.orangeLight,
          }}>
            <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark, marginBottom: 6 }}>
              Filtro automático activo
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, lineHeight: 1.5 }}>
              El sistema buscará vehículos pesados con capacidad mínima de carga para este pedido.
              Los conductores de moto serán excluidos automáticamente.
            </div>
            <ZButton style={{ marginTop: 12 }} onClick={onBack}>
              Buscar Repartidor Ahora
            </ZButton>
          </div>
        )}
      </div>
    </ZScreen>
  )
}

// ─── COTIZACIONES TAB ─────────────────────────────────────────────────────────

type CotizacionesSubTab = 'Solicitudes' | 'Enviadas' | 'Historial'

interface QuotationItem {
  product_id: string
  name: string
  quantity: number
  price_unit: number
}

interface Quotation {
  id: string
  buyer_id: string
  provider_id: string
  items: QuotationItem[]
  subtotal: number
  status: 'pending' | 'accepted' | 'expired' | 'converted'
  pdf_url: string | null
  expires_at: string | null
  created_at: string
  buyer?: {
    name: string | null
    phone: string | null
  } | null
}

function useProveedorQuotations(providerId: string) {
  return useQuery<Quotation[]>({
    queryKey: ['proveedor-quotations', providerId],
    enabled: !!providerId,
    staleTime: 30_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('quotations')
        .select('*, buyer:profiles!buyer_id(name, phone)')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []) as Quotation[]
    },
  })
}

function CotizacionesTab() {
  const user = useAuthStore((s) => s.user)
  const providerId = user?.user_id ?? ''
  const { toasts, showToast, removeToast } = useToast()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<CotizacionesSubTab>('Solicitudes')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [offerModal, setOfferModal] = useState<{ id: string; buyerName: string } | null>(null)
  const [offerPrice, setOfferPrice] = useState('')

  const { data: quotations = [], isLoading } = useProveedorQuotations(providerId)

  const { mutate: acceptQuotation, isPending: accepting } = useMutation({
    mutationFn: async (quotationId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('quotations')
        .update({ status: 'accepted' })
        .eq('id', quotationId)
        .eq('provider_id', providerId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedor-quotations', providerId] })
      showToast('Cotización aceptada', 'success')
    },
    onError: () => {
      showToast('Error al aceptar la cotización', 'error')
    },
  })

  const pending = quotations.filter((q) => q.status === 'pending')
  const accepted = quotations.filter((q) => q.status === 'accepted' || q.status === 'converted')
  const history = quotations.filter((q) => q.status === 'expired')

  const STATUS_CFG = {
    pending:   { label: 'Pendiente', bg: '#FFF7ED', text: '#92400E' },
    accepted:  { label: 'Aceptada',  bg: '#F0FDF4', text: '#166534' },
    expired:   { label: 'Expirada',  bg: Z.divider, text: Z.textMuted },
    converted: { label: 'Convertida', bg: Z.blueLight, text: Z.blueDark },
  } as const

  function getBuyerName(q: Quotation): string {
    if (Array.isArray(q.buyer)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (q.buyer[0] as any)?.name ?? 'Comprador'
    }
    return q.buyer?.name ?? 'Comprador'
  }

  function renderCard(q: Quotation) {
    const cfg = STATUS_CFG[q.status] ?? STATUS_CFG.pending
    const isExpanded = expandedId === q.id
    const buyerName = getBuyerName(q)
    const items: QuotationItem[] = Array.isArray(q.items) ? q.items : []
    const dateLabel = new Date(q.created_at).toLocaleDateString('es-BO', {
      day: '2-digit', month: 'short', year: 'numeric',
    })

    return (
      <div
        key={q.id}
        style={{
          padding: '16px', borderRadius: Z.r.md, background: Z.surface,
          border: `1px solid ${Z.border}`, display: 'flex', flexDirection: 'column', gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>
              {buyerName}
            </span>
            <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, marginTop: 2 }}>{dateLabel}</div>
          </div>
          <span style={{
            fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '4px 10px',
            borderRadius: 20, background: cfg.bg, color: cfg.text,
          }}>
            {cfg.label}
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${Z.divider}`, paddingTop: 10,
        }}>
          <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
          <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.orangeDark }}>
            Bs {q.subtotal.toFixed(2)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setExpandedId(isExpanded ? null : q.id)}
            style={{
              flex: 1, padding: '10px', borderRadius: Z.r.sm,
              border: `1px solid ${Z.border}`, background: Z.surface,
              fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec,
              cursor: 'pointer', outline: 'none',
            }}
          >
            {isExpanded ? 'Ocultar' : 'Ver items'}
          </button>

          {q.status === 'pending' && (
            <button
              onClick={() => setOfferModal({ id: q.id, buyerName })}
              style={{
                flex: 1, padding: '10px', borderRadius: Z.r.sm,
                border: 'none', background: Z.orangeDark,
                fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: '#fff',
                cursor: 'pointer', outline: 'none',
              }}
            >
              Hacer Oferta
            </button>
          )}

          {q.status === 'pending' && (
            <button
              onClick={() => acceptQuotation(q.id)}
              disabled={accepting}
              style={{
                flex: 1, padding: '10px', borderRadius: Z.r.sm,
                border: 'none', background: Z.success,
                fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: '#fff',
                cursor: 'pointer', outline: 'none', opacity: accepting ? 0.5 : 1,
              }}
            >
              Aceptar
            </button>
          )}
        </div>

        {isExpanded && items.length > 0 && (
          <div style={{
            borderTop: `1px solid ${Z.divider}`,
            paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.text }}>
                  {item.quantity}x {item.name ?? 'Producto'}
                </span>
                <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>
                  Bs {(item.price_unit * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {offerModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60,
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{
            background: Z.surface, borderRadius: '20px 20px 0 0',
            padding: '24px 20px', width: '100%',
          }}>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text, marginBottom: 16 }}>
              Hacer Oferta
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginBottom: 14 }}>
              Para: <strong>{offerModal.buyerName}</strong>
            </div>
            <ZInput
              label="Precio total (Bs)"
              type="number"
              placeholder="Ej: 12500"
              value={offerPrice}
              onChange={setOfferPrice}
            />
            <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, marginTop: 8, marginBottom: 16 }}>
              La oferta tendrá validez de 48 horas.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <ZButton
                variant="secondary"
                fullWidth={true}
                onClick={() => setOfferModal(null)}
              >
                Cancelar
              </ZButton>
              <ZButton
                disabled={!offerPrice}
                fullWidth={true}
                onClick={() => { setOfferModal(null); setOfferPrice('') }}
              >
                Enviar Oferta
              </ZButton>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
          Cotizaciones
        </h2>
        <FilterBar
          options={['Solicitudes', 'Enviadas', 'Historial']}
          active={tab}
          onChange={(v) => setTab(v as CotizacionesSubTab)}
        />

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 120, borderRadius: Z.r.md, background: Z.divider }} />
            ))}
          </div>
        ) : tab === 'Solicitudes' ? (
          pending.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <VNavIconQuotes color={Z.textMuted} size={40} />
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>
                No hay solicitudes pendientes
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map(renderCard)}
            </div>
          )
        ) : tab === 'Enviadas' ? (
          accepted.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <VNavIconQuotes color={Z.textMuted} size={40} />
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>
                No hay cotizaciones enviadas recientemente
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {accepted.map(renderCard)}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <VNavIconQuotes color={Z.textMuted} size={40} />
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>
                Sin historial de cotizaciones
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((q) => (
                <ActivityItem
                  key={q.id}
                  title={`${getBuyerName(q)} — ${STATUS_CFG[q.status]?.label ?? q.status}`}
                  subtitle={`Bs ${q.subtotal.toFixed(2)}`}
                  time={timeAgo(q.created_at)}
                  color={q.status === 'accepted' ? Z.success : Z.textMuted}
                />
              ))}
            </div>
          )
        )}
      </div>
    </>
  )
}

// ─── CHAT FAB ─────────────────────────────────────────────────────────────────

function VendedorChatFab() {
  return (
    <button
      style={{
        position: 'absolute',
        bottom: 92,
        left: 18,
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        background: Z.gradMixed,
        boxShadow: '0 4px 16px rgba(232,115,58,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 15,
      }}
      aria-label="Chat"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </button>
  )
}

// ─── ROOT: VendedorApp ───────────────────────────────────────────────────────

export function VendedorApp() {
  const [activeTab, setActiveTab] = useState<VendedorTab>('home')
  const setGlobalTab = useNavStore((s) => s.setTab)

  const handleProfile = () => setGlobalTab('perfil')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: Z.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <VendedorHeader onProfile={handleProfile} />

      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 96,
        }}
      >
        {activeTab === 'home'         && <HomeTab onNavigate={setActiveTab} />}
        {activeTab === 'inventario'   && <InventarioTab />}
        {activeTab === 'pedidos'      && <PedidosTab />}
        {activeTab === 'cotizaciones' && <CotizacionesTab />}
      </main>

      <RoleDashNav
        tabs={VENDEDOR_TABS}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as VendedorTab)}
      />

      <VendedorChatFab />
    </div>
  )
}

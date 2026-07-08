import { useState, useEffect, useRef } from 'react'
import { NotificationsScreen } from '@/features/notifications/components/NotificationsScreen'
import { Z } from '@/shared/design/tokens'
import { DashHeader } from '@/shared/design/shell/DashHeader'
import AvatarMenu from '@/shared/components/AvatarMenu'
import { useNavStore } from '@/shared/store/navStore'
import { usePaymentQr } from '@/features/proveedor/hooks/usePaymentQr'
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
import { useAuthStore } from '@/features/auth/store/authStore'
import { useIncomingOrders, useUpdateOrderStatus } from '@/features/proveedor/hooks/useProveedorOrders'
import { useProviderPaymentConfirmation } from '@/features/proveedor/hooks/useProviderPaymentConfirmation'
import type { PendingPaymentOrder } from '@/features/proveedor/hooks/useProviderPaymentConfirmation'
import { queryKeys } from '@/shared/query/keys'
import { useInventario, useToggleProductoActivo, INVENTARIO_PAGE_SIZE, uploadProductImage, validateProductoForm, CATEGORIAS_CONSTRUCCION } from '@/features/proveedor/hooks/useInventario'
import type { ProductoInventario } from '@/features/proveedor/hooks/useInventario'
import { useToast } from '@/shared/hooks/useToast'
import { Toast } from '@/shared/components/Toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { ProveedorOnboardingWizard } from '@/features/proveedor/components/ProveedorOnboardingWizard'
import { OfertasEspecialesScreen } from '@/features/proveedor/components/OfertasEspecialesScreen'
import { useLicitacionesProveedor } from '@/features/licitaciones/hooks/useLicitaciones'
import { SolicitudesProveedorFeed } from '@/features/licitaciones/components/SolicitudesProveedorFeed'

type VendedorTab = 'home' | 'inventario' | 'pedidos' | 'cotizaciones' | 'solicitudes' | 'ofertas'

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

function VNavIconSolicitudes({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 11l18-5v12L3 14v-3z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <path d="M11.6 16.8L11 21l-4-1 .6-4.2" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function VNavIconOfertas({ color = Z.textMuted, size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const VENDEDOR_TABS: Tab[] = [
  { key: 'home',        label: 'Inicio',     Icon: VNavIconHome },
  { key: 'inventario',  label: 'Inventario', Icon: VNavIconInventory },
  { key: 'pedidos',     label: 'Pedidos',    Icon: VNavIconOrders },
  { key: 'ofertas',     label: 'Ofertas',    Icon: VNavIconOfertas },
]


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
  pending:    'Pendiente de pago',
  confirmed:  'Pago confirmado',
  processing: 'Preparando envío',
  shipped:    'En camino',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
  expired:    'Expirado',
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

function HomeTab({
  onNavigate,
  onShowEnvios,
}: {
  onNavigate: (tab: VendedorTab) => void
  onShowEnvios: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name ? user.name.split(' ')[0] : 'Proveedor'
  const city = user?.city ?? 'Bolivia'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const providerId = user?.user_id ?? ''

  const { data: orders = [] } = useIncomingOrders(providerId)
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const { data: products = [] } = useInventario(0)
  const { pendingCount: pendingPaymentsCount } = useProviderPaymentConfirmation(providerId)

  const { data: homeQuotations = [] } = useQuery<{ status: string }[]>({
    queryKey: ['proveedor-quotations', providerId],
    enabled: !!providerId,
    staleTime: 30_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('quotations')
        .select('status')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []) as { status: string }[]
    },
  })
  const pendingCotizacionesCount = homeQuotations.filter((q) => q.status === 'pending').length
  const { data: licitaciones = [] } = useLicitacionesProveedor()
  const openLicitacionesCount: number = licitaciones.filter((l) => !l._ya_postulado).length

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

      {pendingPaymentsCount > 0 && (
        <button
          onClick={() => onNavigate('pedidos')}
          style={{
            border: 'none', background: 'transparent', padding: 0, margin: 0,
            textAlign: 'left', cursor: 'pointer', outline: 'none', width: '100%',
          }}
        >
          <SummaryCard
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke={Z.orange} strokeWidth="2" />
                <path d="M7 15l3-3 2.5 2.5L17 10" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            label="Pagos por verificar"
            value={String(pendingPaymentsCount)}
            color={Z.orange}
          />
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onShowEnvios}
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
              <rect x="2" y="7" width="20" height="14" rx="2" stroke="#fff" strokeWidth="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 12v4M10 14h4" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: '#fff' }}>
              Gestión de Envíos
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {pendingCount > 0 ? `${pendingCount} pedido${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''} de despacho` : 'Sin pedidos pendientes'}
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onNavigate('cotizaciones')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '16px',
              borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
              background: Z.surface, textAlign: 'left', outline: 'none', position: 'relative',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, background: Z.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VNavIconQuotes color={Z.orangeDark} size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>Cotizaciones</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>
                {pendingCotizacionesCount > 0 ? `${pendingCotizacionesCount} pendiente${pendingCotizacionesCount !== 1 ? 's' : ''}` : 'Ver cotizaciones'}
              </div>
            </div>
            {pendingCotizacionesCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: Z.orange, color: Z.onPrimary, fontFamily: Z.font, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {pendingCotizacionesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('solicitudes')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '16px',
              borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
              background: Z.surface, textAlign: 'left', outline: 'none', position: 'relative',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, background: Z.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VNavIconSolicitudes color={Z.blueDark} size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>Solicitudes</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>
                {openLicitacionesCount > 0 ? `${openLicitacionesCount} nueva${openLicitacionesCount !== 1 ? 's' : ''}` : 'Ver solicitudes'}
              </div>
            </div>
            {openLicitacionesCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: Z.blue, color: Z.onSecondary, fontFamily: Z.font, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {openLicitacionesCount}
              </span>
            )}
          </button>
        </div>

        {/* Ofertas Especiales — botón independiente */}
        <button
          onClick={() => onNavigate('ofertas')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
            borderRadius: Z.r.lg, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
            width: '100%', background: Z.surface, textAlign: 'left', outline: 'none',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: Z.orangeLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <VNavIconOfertas color={Z.orangeDark} size={22} />
          </div>
          <div>
            <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>Ofertas Especiales</div>
            <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textMuted, marginTop: 1 }}>
              Aplica descuentos a tu inventario
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke={Z.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>
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
  // category_name is one of CATEGORIAS_CONSTRUCCION — we resolve to a DB id on save
  category_name: string
  listing_type: 'sell' | 'rent'
  weight_kg: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: '',
  unit: 'unidad',
  stock: '',
  category_name: '',
  listing_type: 'sell',
  weight_kg: '',
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
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [manualQty, setManualQty] = useState<Record<string, number>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const { data: page = [], isLoading, isFetching } = useInventario(offset)
  const { mutate: toggleActivo } = useToggleProductoActivo()

  useEffect(() => {
    if (page.length === 0 && offset === 0) {
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

    // Client-side validation
    const validationError = validateProductoForm(form.price, form.stock)
    if (validationError) {
      setFormError(validationError)
      return
    }
    if (!form.name.trim()) {
      setFormError('El nombre del producto es obligatorio')
      return
    }
    if (!form.category_name) {
      setFormError('Selecciona una categoría')
      return
    }
    setFormError(null)
    setSaving(true)

    try {
      // Resolve category_id by matching the canonical name in the DB
      let categoryId: string | null = null
      if (form.category_name) {
        const { data: catRows } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', form.category_name)
          .limit(1)
          .maybeSingle()
        categoryId = catRows?.id ?? null

        // If not found, insert it so canonical categories are always available
        if (!categoryId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newCat } = await (supabase as any)
            .from('categories')
            .insert({ name: form.category_name })
            .select('id')
            .single()
          categoryId = newCat?.id ?? null
        }
      }

      // Insert the product first to get the id for the image path
      const { data: insertedRows, error } = await supabase.from('products').insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_unit: parseFloat(form.price),
        unit_type: form.unit,
        stock_quantity: parseInt(form.stock, 10),
        category_id: categoryId,
        provider_id: user.user_id,
        image_url: null, // filled below if an image was selected
        listing_type: form.listing_type,
        active: true,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any).select('id')

      if (error) {
        showToast('Error al guardar el producto', 'error')
        return
      }

      const newProductId = (insertedRows as { id: string }[] | null)?.[0]?.id ?? ''

      // Upload image if provided
      if (imageFile && newProductId) {
        try {
          const imageUrl = await uploadProductImage(imageFile, newProductId, user.user_id)
          await supabase.from('products').update({ image_url: imageUrl }).eq('id', newProductId)
        } catch (imgErr) {
          // Non-fatal: product was saved, image upload failed
          const msg = imgErr instanceof Error ? imgErr.message : 'Error al subir la imagen'
          showToast(`Producto guardado, pero: ${msg}`, 'info')
        }
      }

      setOffset(0)
      setAllProducts([])
      queryClient.invalidateQueries({ queryKey: ['inventario', user.user_id] })
      setForm(EMPTY_FORM)
      setImageFile(null)
      setImagePreview(null)
      setShowForm(false)
      showToast('Producto guardado', 'success')
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('El archivo debe ser una imagen', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no debe superar los 5 MB', 'error')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
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
              background: Z.orangeDark, color: Z.onPrimary, outline: 'none',
              fontFamily: Z.font, fontSize: 12, fontWeight: 700,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Agregar
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { key: 'manual' as const, label: 'Manual', icon: 'edit' },
            { key: 'csv' as const, label: 'CSV', icon: 'upload' },
            { key: 'api' as const, label: 'API Sync', icon: 'sync' },
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
              <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 3 }}>{m.icon}</span>{m.label}
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
              background: Z.blue, color: Z.onSecondary, fontFamily: Z.font, fontSize: 12, fontWeight: 700, cursor: 'pointer',
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
              background: Z.blue, color: Z.onSecondary, fontFamily: Z.font, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              Configurar API
            </button>
          </div>
        )}

        {criticalProducts.length > 0 && (
          <div style={{
            padding: '12px 14px', borderRadius: Z.r.md,
            background: Z.errorBg, border: `1px solid ${Z.border}`,
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
                background: Z.orangeDark, color: Z.onPrimary, fontFamily: Z.font, fontSize: 13, fontWeight: 700, cursor: 'pointer',
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
                      onClick={() => toggleActivo(
                        { product_id: p.id, active: !p.active },
                        { onError: (err) => showToast(err instanceof Error ? err.message : 'Error al cambiar estado', 'error') }
                      )}
                      style={{
                        position: 'relative', width: 36, height: 20, borderRadius: 10,
                        border: 'none', cursor: 'pointer',
                        background: p.active ? Z.orange : Z.border,
                        transition: 'background 0.2s', outline: 'none',
                      }}
                      aria-label={p.active ? 'Desactivar' : 'Activar'}
                    >
                      <span style={{
                        position: 'absolute', top: 2, left: 2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: Z.surface,
                        transform: p.active ? 'translateX(16px)' : 'translateX(0)',
                        transition: 'transform 0.2s',
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
                        width: '100%',
                        background: isCrit ? Z.error : Z.orange,
                        transform: `scaleX(${pct})`,
                        transformOrigin: 'left',
                        transition: 'transform 0.5s',
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
                          border: 'none', background: Z.orangeDark, color: Z.onPrimary,
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
          <ZHeader title="Agregar producto" onBack={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); setImageFile(null); setImagePreview(null) }} />
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Validation error banner */}
            {formError && (
              <div style={{
                padding: '12px 14px', borderRadius: Z.r.sm,
                background: Z.errorBg, border: `1px solid ${Z.border}`,
                fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.error,
              }}>
                {formError}
              </div>
            )}

            <ZInput
              label="Nombre"
              value={form.name}
              onChange={(v) => { setFormError(null); setForm((f) => ({ ...f, name: v })) }}
              placeholder="Ej: Cemento IP-30"
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <ZInput
                  label="Precio (Bs.)"
                  type="number"
                  value={form.price}
                  onChange={(v) => { setFormError(null); setForm((f) => ({ ...f, price: v })) }}
                  placeholder="58"
                />
              </div>
              <div style={{ flex: 1 }}>
                <ZInput
                  label="Stock"
                  type="number"
                  value={form.stock}
                  onChange={(v) => { setFormError(null); setForm((f) => ({ ...f, stock: v })) }}
                  placeholder="100"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>Categoría</label>
              <select
                value={form.category_name}
                onChange={(e) => { setFormError(null); setForm((f) => ({ ...f, category_name: e.target.value })) }}
                style={{
                  fontFamily: Z.font, fontSize: 15, fontWeight: 500,
                  color: form.category_name ? Z.text : Z.textMuted,
                  padding: '14px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                  background: Z.surface, outline: 'none',
                }}
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS_CONSTRUCCION.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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

            {/* Image upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Imagen del producto (opcional, máx. 5 MB)
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    style={{ width: 64, height: 64, borderRadius: Z.r.sm, objectFit: 'cover', border: `1px solid ${Z.border}` }}
                  />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                    style={{
                      padding: '6px 14px', borderRadius: 20, border: `1px solid ${Z.border}`,
                      background: Z.surface, color: Z.textSec,
                      fontFamily: Z.font, fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none',
                    }}
                  >
                    Quitar imagen
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    padding: '12px', borderRadius: Z.r.sm, border: `1.5px dashed ${Z.border}`,
                    background: Z.surface, color: Z.textSec, cursor: 'pointer', outline: 'none',
                    fontFamily: Z.font, fontSize: 13, fontWeight: 600, textAlign: 'center',
                  }}
                >
                  Seleccionar imagen
                </button>
              )}
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
              disabled={saving || !form.name || !form.price || !form.stock || !form.category_name}
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

interface EnvioOrderInfo {
  id: string
  buyer_name: string | undefined
  items: string
  total: number
  cargo_type?: 'light' | 'heavy'
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

// Card reutilizable para un pedido con comprobante de pago pendiente de verificar.
// Usada tanto en la sección "Pagos por Verificar" (arriba de la lista general).
function PaymentEvidenceCard({
  order,
  isConfirming,
  isRejecting,
  onConfirm,
  onReject,
}: {
  order: PendingPaymentOrder
  isConfirming: boolean
  isRejecting: boolean
  onConfirm: () => void
  onReject: () => void
}) {
  return (
    <div
      style={{
        padding: '14px 16px', borderRadius: Z.r.md, background: Z.orangeLight,
        border: `1px solid ${Z.orangePastel}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
          {order.buyer_name ?? 'Comprador'}
        </span>
        <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 800, color: Z.orangeDark }}>
          Bs {order.total.toLocaleString('es-BO')}
        </span>
      </div>
      <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.orangeDark, marginBottom: 10 }}>
        Comprobante subido — pendiente de verificacion
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          disabled={isConfirming}
          onClick={onConfirm}
          style={{
            flex: 1, padding: '9px', borderRadius: 20, border: 'none',
            background: isConfirming ? Z.divider : Z.success,
            color: isConfirming ? Z.textMuted : '#fff',
            fontFamily: Z.font, fontSize: 11, fontWeight: 700,
            cursor: isConfirming ? 'default' : 'pointer', outline: 'none',
          }}
        >
          {isConfirming ? 'Confirmando...' : 'Validar Pago e Iniciar Envío'}
        </button>
        <button
          disabled={isRejecting}
          onClick={onReject}
          style={{
            flex: '0 0 auto', padding: '9px 14px', borderRadius: 20,
            border: `1.5px solid ${Z.error}`, background: 'transparent',
            color: Z.error,
            fontFamily: Z.font, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', outline: 'none',
          }}
        >
          Rechazar
        </button>
      </div>
    </div>
  )
}

function PedidosTab() {
  const user = useAuthStore((s) => s.user)
  const providerId = user?.user_id ?? ''
  const { toasts, showToast, removeToast } = useToast()
  const [filter, setFilter] = useState<PedidosFilter>('Pendiente')
  const [logisticaOrder, setLogisticaOrder] = useState<EnvioOrderInfo | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: orders = [], isLoading } = useIncomingOrders(providerId, () => {
    showToast('¡Nuevo pedido recibido!', 'info')
  })
  const { mutate: updateStatus } = useUpdateOrderStatus()
  const {
    pendingPayments,
    pendingCount: awaitingPaymentCount,
    confirmOrderPayment,
    rejectOrderPayment,
    isConfirming,
    isRejecting,
  } = useProviderPaymentConfirmation(providerId)

  const statusFilter = FILTER_STATUS_MAP[filter]
  const filtered = statusFilter === null
    ? orders
    : orders.filter((o) => o.status === statusFilter)

  if (logisticaOrder) {
    return (
      <GestionEnvioScreen
        order={logisticaOrder}
        providerId={providerId}
        onBack={() => setLogisticaOrder(null)}
      />
    )
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Reject reason dialog */}
      {rejectingId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px',
        }}>
          <div style={{
            background: Z.surface, borderRadius: Z.r.lg, padding: '24px 20px',
            width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>
              Rechazar comprobante
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec }}>
              Indica el motivo para que el constructor pueda corregirlo.
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: imagen borrosa, monto incorrecto..."
              rows={3}
              style={{
                fontFamily: Z.font, fontSize: 13, color: Z.text,
                background: Z.bg, border: `1.5px solid ${Z.border}`, borderRadius: Z.r.sm,
                padding: '10px 12px', resize: 'none', outline: 'none', width: '100%',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setRejectingId(null); setRejectReason('') }}
                style={{
                  flex: 1, padding: '10px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                  background: Z.surface, fontFamily: Z.font, fontSize: 13, fontWeight: 600,
                  color: Z.textSec, cursor: 'pointer', outline: 'none',
                }}
              >
                Cancelar
              </button>
              <button
                disabled={!rejectReason.trim() || isRejecting}
                onClick={async () => {
                  try {
                    await rejectOrderPayment(rejectingId, rejectReason.trim())
                    showToast('Comprobante rechazado', 'info')
                    setRejectingId(null)
                    setRejectReason('')
                  } catch {
                    showToast('Error al rechazar el comprobante', 'error')
                  }
                }}
                style={{
                  flex: 1, padding: '10px', borderRadius: Z.r.sm, border: 'none',
                  background: isRejecting ? Z.divider : Z.error,
                  fontFamily: Z.font, fontSize: 13, fontWeight: 700,
                  color: isRejecting ? Z.textMuted : '#fff', cursor: 'pointer', outline: 'none',
                }}
              >
                {isRejecting ? 'Rechazando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Pedidos</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {awaitingPaymentCount > 0 && (
              <span style={{
                background: Z.orange, color: Z.onPrimary,
                fontFamily: Z.font, fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20,
              }}>
                {awaitingPaymentCount} por verificar
              </span>
            )}
            <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textMuted }}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {pendingPayments.length > 0 && (
          <div>
            <SectionTitle title="Pagos por Verificar" />
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingPayments.map((order) => (
                <PaymentEvidenceCard
                  key={order.id}
                  order={order}
                  isConfirming={isConfirming}
                  isRejecting={isRejecting}
                  onConfirm={async () => {
                    try {
                      await confirmOrderPayment(order.id)
                      showToast('Pago validado, envío en preparación', 'success')
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : 'Error al confirmar', 'error')
                    }
                  }}
                  onReject={() => setRejectingId(order.id)}
                />
              ))}
            </div>
          </div>
        )}

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
                            background: Z.blue, color: Z.onSecondary, outline: 'none',
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
                            cargo_type: order.cargo_type,
                          })}
                          style={{
                            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            background: Z.orangeDark, color: Z.onPrimary, outline: 'none',
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

                  {/* Indicador informativo: la acción de confirmar/rechazar vive en la sección "Pagos por Verificar" de arriba */}
                  {order.status === 'pending' && (order as { payment_evidence_url?: string | null }).payment_evidence_url && (
                    <div style={{
                      marginTop: 10, padding: '8px 12px',
                      borderRadius: Z.r.sm, background: Z.orangeLight,
                      border: `1px solid ${Z.orangePastel}`,
                    }}>
                      <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.orangeDark }}>
                        Comprobante subido — ver en "Pagos por Verificar"
                      </span>
                    </div>
                  )}

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

// ─── ENVÍOS SCREEN (overlay desde home) ──────────────────────────────────────

function EnviosScreen({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const providerId = user?.user_id ?? ''
  const { toasts, showToast, removeToast } = useToast()
  const queryClient = useQueryClient()
  const { data: orders = [], isLoading } = useIncomingOrders(providerId)
  const { mutate: updateStatus } = useUpdateOrderStatus()
  usePaymentQr()
  const [envioOrder, setEnvioOrder] = useState<EnvioOrderInfo | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const dispatchable = orders.filter(
    (o) => o.status === 'pending' || o.status === 'processing'
  )

  if (envioOrder) {
    return (
      <GestionEnvioScreen
        order={envioOrder}
        providerId={providerId}
        onBack={() => setEnvioOrder(null)}
        onDone={() => {
          setEnvioOrder(null)
          showToast('Envío gestionado correctamente', 'success')
        }}
      />
    )
  }

  return (
    <ZScreen bg={Z.bg} style={{ position: 'fixed', zIndex: 30 }}>
      <Toast toasts={toasts} onRemove={removeToast} />
      <ZHeader title="Gestión de Envíos" onBack={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{
          padding: '14px 16px', borderRadius: Z.r.md,
          background: Z.orangeLight, border: `1px solid ${Z.orangePastel}`,
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark }}>
            {dispatchable.length} pedido{dispatchable.length !== 1 ? 's' : ''} pendiente{dispatchable.length !== 1 ? 's' : ''} de despacho
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>
            Confirma recepción y elige cómo entregar cada pedido
          </div>
        </div>

        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          Modalidades disponibles
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { label: 'Retiro en Tienda', sub: 'Cliente recoge', color: Z.blue },
            { label: 'Flota Propia', sub: 'Tu conductor', color: Z.orange },
            { label: 'Transportista', sub: 'Via ZITEO', color: Z.orangeDark },
          ] as const).map((m) => (
            <div key={m.label} style={{
              flex: 1, padding: '10px 8px', borderRadius: Z.r.sm,
              background: Z.surface, border: `1px solid ${Z.border}`, textAlign: 'center',
            }}>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 700, color: m.color }}>{m.label}</div>
              <div style={{ fontFamily: Z.font, fontSize: 9, color: Z.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 }}>
          Pedidos a despachar
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 110, borderRadius: Z.r.md, background: Z.divider }} />
            ))}
          </div>
        ) : dispatchable.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted }}>
              Todos los pedidos están despachados
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dispatchable.map((order) => {
              const isPending = order.status === 'pending'
              const itemsSummary = order.items
                .map((i) => `${i.quantity}x ${i.product?.name ?? 'Producto'}`)
                .join(', ')

              return (
                <div
                  key={order.id}
                  style={{
                    padding: '14px 16px', borderRadius: Z.r.md,
                    background: Z.surface, border: `1px solid ${Z.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
                      {order.buyer_name ?? 'Comprador'}
                    </span>
                    <span style={{
                      fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '3px 10px',
                      borderRadius: 20,
                      background: isPending ? Z.orange + '18' : Z.blue + '18',
                      color: isPending ? Z.orange : Z.blue,
                    }}>
                      {isPending ? 'Por confirmar' : 'Listo para despachar'}
                    </span>
                  </div>

                  <div style={{
                    fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginBottom: 10,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {itemsSummary}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.orangeDark }}>
                      Bs {order.total.toLocaleString('es-BO')}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {isPending && (
                        <button
                          onClick={() => updateStatus(
                            { orderId: order.id, status: 'processing', providerId },
                            { onError: () => showToast('No se pudo confirmar el pedido', 'error') }
                          )}
                          style={{
                            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            background: Z.blue, color: Z.onSecondary,
                            fontFamily: Z.font, fontSize: 11, fontWeight: 700, outline: 'none',
                          }}
                        >
                          Confirmar
                        </button>
                      )}
                      <button
                        onClick={() => setEnvioOrder({
                          id: order.id,
                          buyer_name: order.buyer_name,
                          items: itemsSummary,
                          total: order.total,
                          cargo_type: order.cargo_type,
                        })}
                        style={{
                          padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
                          background: Z.surface, color: Z.text,
                          fontFamily: Z.font, fontSize: 11, fontWeight: 700, outline: 'none',
                        }}
                      >
                        Gestionar Envío
                      </button>
                    </div>
                  </div>

                  {/* Show confirm-payment button only when the constructor uploaded evidence */}
                  {isPending && (order as { payment_evidence_url?: string | null }).payment_evidence_url && (
                    <button
                      disabled={confirmingId === order.id}
                      onClick={async () => {
                        setConfirmingId(order.id)
                        try {
                          // Use the SECURITY DEFINER RPC — only callable by the provider
                          const { error } = await supabase.rpc('confirm_payment_by_provider', {
                            p_order_id: order.id,
                          })
                          if (error) throw new Error(error.message)
                          await queryClient.invalidateQueries({ queryKey: queryKeys.incomingOrders(providerId) })
                          showToast('Pago confirmado correctamente', 'success')
                        } catch (err) {
                          showToast(err instanceof Error ? err.message : 'Error al confirmar el pago', 'error')
                        } finally {
                          setConfirmingId(null)
                        }
                      }}
                      style={{
                        marginTop: 6, width: '100%', padding: '10px 16px',
                        borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: confirmingId === order.id ? Z.divider : Z.orangeDark,
                        color: confirmingId === order.id ? Z.textMuted : '#fff',
                        fontFamily: Z.font, fontSize: 12, fontWeight: 700, outline: 'none',
                      }}
                    >
                      {confirmingId === order.id ? 'Confirmando...' : 'Confirmar pago recibido'}
                    </button>
                  )}
                  {isPending && !(order as { payment_evidence_url?: string | null }).payment_evidence_url && (
                    <div style={{
                      marginTop: 6, padding: '8px 12px', borderRadius: Z.r.sm,
                      background: Z.divider, fontFamily: Z.font, fontSize: 11,
                      color: Z.textMuted, textAlign: 'center',
                    }}>
                      Esperando comprobante del constructor
                    </div>
                  )}

                  <div style={{ marginTop: 8, fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>
                    {timeAgo(order.created_at)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ZScreen>
  )
}

// ─── GESTIÓN ENVÍO SCREEN ────────────────────────────────────────────────────

function GestionEnvioScreen({
  order,
  providerId,
  onBack,
  onDone,
}: {
  order: EnvioOrderInfo
  providerId: string
  onBack: () => void
  onDone?: () => void
}) {
  const [mode, setMode] = useState<'retiro' | 'flota' | 'repartidor' | null>(null)
  const [driver, setDriver] = useState('')
  const [plate, setPlate] = useState('')
  const [dispatching, setDispatching] = useState(false)
  const { mutate: updateStatus } = useUpdateOrderStatus()

  const finish = onDone ?? onBack

  // Código de retiro real, derivado del UUID del pedido (6 últimos hex, mayúsculas)
  const pickupCode = order.id.replace(/-/g, '').slice(-6).toUpperCase()

  const handleFlota = async () => {
    if (!driver || !plate) return
    setDispatching(true)
    // Flota propia: crear registro de entrega en tránsito para poder dar seguimiento
    await supabase.from('deliveries').insert({
      order_id: order.id,
      status: 'in_transit',
      cargo_type: order.cargo_type ?? 'light',
    })
    updateStatus(
      { orderId: order.id, status: 'shipped', providerId },
      { onSuccess: finish, onError: () => setDispatching(false) }
    )
  }

  const handleRepartidor = async () => {
    setDispatching(true)
    await supabase.from('deliveries').insert({
      order_id: order.id,
      status: 'pending',
      cargo_type: order.cargo_type ?? 'light',
    })
    updateStatus(
      { orderId: order.id, status: 'processing', providerId },
      { onSuccess: finish, onError: () => setDispatching(false) }
    )
  }

  const handleRetiro = () => {
    updateStatus(
      { orderId: order.id, status: 'processing', providerId },
      { onSuccess: finish }
    )
  }

  const MODES: { key: 'retiro' | 'flota' | 'repartidor'; label: string; desc: string; color: string }[] = [
    {
      key: 'retiro',
      label: 'Retiro en Tienda',
      desc: 'El cliente viene a recoger desde tu local. Se genera un código de verificación para presentar al retirar.',
      color: Z.blue,
    },
    {
      key: 'flota',
      label: 'Flota Propia',
      desc: 'Asigna un conductor de tu equipo con su vehículo. Para proveedores con delivery propio.',
      color: Z.orange,
    },
    {
      key: 'repartidor',
      label: 'Solicitar Transportista',
      desc: 'ZITEO busca el transportista disponible más cercano. Para carga pesada se excluyen motocicletas automáticamente.',
      color: Z.orangeDark,
    },
  ]

  return (
    <ZScreen bg={Z.bg} style={{ position: 'fixed' }}>
      <ZHeader title="Gestionar Envío" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          padding: '14px', borderRadius: Z.r.md,
          background: Z.orangeLight, border: `1px solid ${Z.orangePastel}`,
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark }}>
            {order.buyer_name ?? 'Comprador'}
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>
            {order.items} · Bs {order.total.toLocaleString('es-BO')}
          </div>
        </div>

        <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
          Modalidad de entrega
        </div>

        {MODES.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px',
              borderRadius: Z.r.md,
              border: `2px solid ${mode === opt.key ? opt.color : Z.border}`,
              background: mode === opt.key ? opt.color + '10' : Z.surface,
              cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none',
              transition: 'border-color 0.18s, background 0.18s',
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 5,
              background: mode === opt.key ? opt.color : Z.border,
              transition: 'background 0.18s',
            }} />
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
                {opt.label}
              </div>
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 3, lineHeight: 1.45 }}>
                {opt.desc}
              </div>
            </div>
          </button>
        ))}

        {mode === 'retiro' && (
          <div style={{ padding: '20px', borderRadius: Z.r.md, background: Z.blueLight, textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.blueDark, marginBottom: 12 }}>
              Código de retiro
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 800, color: Z.blueDark, letterSpacing: 6 }}>
              {pickupCode}
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 8 }}>
              Válido 48 horas · Compartir con el cliente
            </div>
            <ZButton variant="blue" style={{ marginTop: 16 }} onClick={handleRetiro}>
              Notificar al cliente
            </ZButton>
          </div>
        )}

        {mode === 'flota' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ZInput label="Nombre del conductor" placeholder="Ej: Carlos Mamani" value={driver} onChange={setDriver} />
            <ZInput label="Placa del vehículo" placeholder="Ej: 3456-ABC" value={plate} onChange={setPlate} />
            <ZButton disabled={!driver || !plate || dispatching} onClick={handleFlota}>
              {dispatching ? 'Despachando...' : 'Asignar y despachar'}
            </ZButton>
          </div>
        )}

        {mode === 'repartidor' && (
          <div style={{ padding: '16px', borderRadius: Z.r.md, background: Z.orangeLight }}>
            <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark, marginBottom: 6 }}>
              Filtro de carga automático
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, lineHeight: 1.5 }}>
              El sistema filtrará transportistas según el tipo de carga. Para materiales pesados
              (cemento, áridos, estructuras) se excluirán motos automáticamente.
            </div>
            <ZButton style={{ marginTop: 14 }} disabled={dispatching} onClick={handleRepartidor}>
              {dispatching ? 'Buscando...' : 'Buscar transportista ahora'}
            </ZButton>
          </div>
        )}
      </div>
    </ZScreen>
  )
}

// ─── COTIZACIONES TAB ─────────────────────────────────────────────────────────

type CotizacionesSubTab = 'Pendientes' | 'Enviadas' | 'Historial'

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
  const [tab, setTab] = useState<CotizacionesSubTab>('Pendientes')
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
    pending:   { label: 'Pendiente', bg: 'var(--color-status-pending-bg)', text: 'var(--color-status-pending-text)' },
    accepted:  { label: 'Aceptada',  bg: 'var(--color-status-success-bg)', text: 'var(--color-status-success-text)' },
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
                fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.onPrimary,
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
          options={['Pendientes', 'Enviadas', 'Historial']}
          active={tab}
          onChange={(v) => setTab(v as CotizacionesSubTab)}
        />

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 120, borderRadius: Z.r.md, background: Z.divider }} />
            ))}
          </div>
        ) : tab === 'Pendientes' ? (
          pending.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <VNavIconQuotes color={Z.textMuted} size={40} />
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>
                No hay cotizaciones pendientes
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

// ─── VENDEDOR CUENTA SCREEN ──────────────────────────────────────────────────

function VendedorCuentaScreen({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const { toasts, showToast, removeToast } = useToast()
  const { uploadQr, uploading } = usePaymentQr()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: qrStatus, refetch: refetchQr } = useQuery<{ payment_qr_url: string | null }>({
    queryKey: ['vendedor-qr-status', user?.user_id],
    enabled: !!user?.user_id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('payment_qr_url')
        .eq('user_id', user!.user_id)
        .eq('role', 'proveedor')
        .maybeSingle()
      if (error) throw error
      return data ?? { payment_qr_url: null }
    },
  })

  const hasQr = !!qrStatus?.payment_qr_url

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('El archivo no puede superar 2 MB', 'error')
      e.target.value = ''
      return
    }
    try {
      await uploadQr(file)
      await refetchQr()
      showToast('QR de cobranza actualizado', 'success')
    } catch {
      showToast('Error al subir el QR', 'error')
    }
    e.target.value = ''
  }

  return (
    <ZScreen bg={Z.bg} style={{ position: 'fixed' }}>
      <Toast toasts={toasts} onRemove={removeToast} />
      <ZHeader title="Mi cuenta" onBack={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Sección: info del usuario */}
        <div style={{
          padding: '16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`,
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>
            {user?.name}
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 4 }}>
            +591 {user?.phone?.startsWith('+591') ? user.phone.slice(4) : user?.phone}
            {user?.city ? ` · ${user.city}` : ''}
          </div>
        </div>

        {/* Sección: QR de Cobranza */}
        <div>
          <div style={{
            fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted,
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
          }}>
            QR de Cobranza
          </div>
          <div style={{
            padding: '16px', borderRadius: Z.r.md, background: Z.surface,
            border: `1px solid ${Z.border}`, display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>
                  {hasQr ? 'QR de cobro activo' : 'Sin QR configurado'}
                </div>
                <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 3 }}>
                  {hasQr
                    ? 'Se muestra a compradores para facilitar el pago'
                    : 'Sube tu QR de cobro (Tigo Money, QR BCB, etc.)'}
                </div>
              </div>
              {hasQr && (
                <div style={{
                  padding: '4px 10px', borderRadius: 20, background: Z.success + '18',
                  fontFamily: Z.font, fontSize: 10, fontWeight: 700, color: Z.success,
                }}>
                  Activo
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '10px 16px', borderRadius: Z.r.sm, cursor: 'pointer',
                background: uploading ? Z.divider : (hasQr ? Z.surface : Z.orangeDark),
                color: uploading ? Z.textMuted : (hasQr ? Z.text : '#fff'),
                border: hasQr ? `1.5px solid ${Z.border}` : 'none',
                fontFamily: Z.font, fontSize: 13, fontWeight: 700,
                width: '100%', outline: 'none',
              } as React.CSSProperties}
            >
              {uploading
                ? 'Subiendo...'
                : hasQr
                  ? 'Reemplazar QR'
                  : 'Subir QR de cobro'}
            </button>
          </div>
        </div>

      </div>
    </ZScreen>
  )
}

// ─── ROOT: VendedorApp ───────────────────────────────────────────────────────

// ─── Onboarding check ────────────────────────────────────────────────────────

function useProveedorOnboardingCheck() {
  const user = useAuthStore((s) => s.user)
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_roles')
      .select('onboarding_complete, onboarding_completed')
      .eq('user_id', user.user_id)
      .eq('role', 'proveedor')
      .maybeSingle()
      .then(({ data }) => {
        const done = data?.onboarding_complete === true || data?.onboarding_completed === true
        setNeedsOnboarding(!done)
      })
  }, [user])

  return needsOnboarding
}

// ─── VendedorApp ─────────────────────────────────────────────────────────────

export function VendedorApp() {
  const [activeTab, setActiveTab] = useState<VendedorTab>('home')
  const [showAccount, setShowAccount] = useState(false)
  const [showEnvios, setShowEnvios] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const settingsTab = useNavStore((s) => s.activeTab)
  const setNavTab = useNavStore((s) => s.setTab)
  const showSettings = settingsTab === 'settings' || settingsTab === 'perfil'
  const needsOnboarding = useProveedorOnboardingCheck()
  const [onboardingDone, setOnboardingDone] = useState(false)
  const userId = useAuthStore((s) => s.user?.user_id) ?? ''

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-unread', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      return count ?? 0
    },
    staleTime: 30_000,
  })

  // While we check onboarding status, render nothing to avoid flash
  if (needsOnboarding === null) return null

  if (needsOnboarding && !onboardingDone) {
    return <ProveedorOnboardingWizard onComplete={() => setOnboardingDone(true)} />
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: Z.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DashHeader
        onProfile={() => setShowAccount(true)}
        onTrack={() => {/* seguimiento: próximamente */}}
        onBell={() => setShowNotifs(true)}
        unreadCount={unreadCount}
      />
      <AvatarMenu isOpen={showAccount} onClose={() => setShowAccount(false)} />
      {showSettings && <VendedorCuentaScreen onClose={() => setNavTab('home')} />}

      {showNotifs && (
        <div style={{ position: 'fixed', inset: 0, background: Z.bg, zIndex: 40, overflowY: 'auto' }}>
          <NotificationsScreen onClose={() => setShowNotifs(false)} />
        </div>
      )}

      {showEnvios && <EnviosScreen onClose={() => setShowEnvios(false)} />}

      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 106,
        }}
      >
        {activeTab === 'home'          && <HomeTab onNavigate={setActiveTab} onShowEnvios={() => setShowEnvios(true)} />}
        {activeTab === 'inventario'    && <InventarioTab />}
        {activeTab === 'pedidos'       && <PedidosTab />}
        {activeTab === 'cotizaciones'  && <CotizacionesTab />}
        {activeTab === 'solicitudes'   && (
          <div style={{ padding: '16px 20px 20px' }}>
            <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: '0 0 16px' }}>
              Solicitudes
            </h2>
            <SolicitudesProveedorFeed />
          </div>
        )}
        {activeTab === 'ofertas'       && <OfertasEspecialesScreen onBack={() => setActiveTab('home')} />}
      </main>

      <RoleDashNav
        tabs={VENDEDOR_TABS}
        activeTab={activeTab}
        onTabChange={(k) => { setShowEnvios(false); setActiveTab(k as VendedorTab) }}
        testIdPrefix="vendedor-nav"
      />

    </div>
  )
}

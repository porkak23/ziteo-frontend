import { useState, useRef } from 'react'
import { Z } from '../../../shared/design/tokens'
import { ZScreen } from '../../../shared/design/components/ZScreen'
import { ZHeader } from '../../../shared/design/components/ZHeader'
import { ZInput } from '../../../shared/design/components/ZInput'
import { ZSelect } from '../../../shared/design/components/ZSelect'
import { ZButton } from '../../../shared/design/components/ZButton'
import { ZIcon } from '../../../shared/design/components/ZIcon'
import { FilterBar } from '../../../shared/design/shell/FilterBar'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { useAuthStore } from '../../auth/store/authStore'
import { CATEGORIAS_CONSTRUCCION } from '../../proveedor/hooks/useInventario'
import {
  useMisPublicaciones,
  useCrearPublicacion,
  useTogglePublicacion,
  useEliminarPublicacion,
} from '../hooks/useOcasion'
import {
  useIncomingOrders,
  useUpdateOrderStatus,
  useMarkRentalInUse,
  useConfirmRentalReturn,
} from '../../proveedor/hooks/useProveedorOrders'
import { useProviderPaymentConfirmation } from '../../proveedor/hooks/useProviderPaymentConfirmation'

// Status translation and color maps
const STATUS_COLOR: Record<string, string> = {
  pending: Z.orange,
  processing: Z.blue,
  shipped: Z.blue,
  delivered: Z.success,
  cancelled: Z.error,
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente de pago',
  confirmed: 'Pago confirmado',
  processing: 'En preparación',
  shipped: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

export function OcasionScreen({ onBack }: { onBack: () => void }) {
  const user = useAuthStore((s) => s.user)
  const providerId = user?.user_id ?? ''
  const { toasts, showToast, removeToast } = useToast()

  const [subTab, setSubTab] = useState<'Mis publicaciones' | 'Pedidos recibidos'>('Mis publicaciones')
  const [showForm, setShowForm] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Subscriptions & Queries
  const { data: publicaciones = [], isLoading: loadingPubs } = useMisPublicaciones()
  const { data: orders = [], isLoading: loadingOrders } = useIncomingOrders(providerId)

  // Mutations
  const crearPublicacion = useCrearPublicacion()
  const togglePublicacion = useTogglePublicacion()
  const eliminarPublicacion = useEliminarPublicacion()

  const updateOrderStatus = useUpdateOrderStatus()
  const {
    confirmOrderPayment,
    rejectOrderPayment,
    isConfirming,
    isRejecting,
  } = useProviderPaymentConfirmation(providerId)
  const markRentalInUse = useMarkRentalInUse()
  const confirmRentalReturn = useConfirmRentalReturn()

  // Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    listing_type: 'sell' as 'sell' | 'rent',
    item_condition: 'nuevo' as 'nuevo' | 'usado',
    price: '',
    stock: '',
    category_name: '',
    unit: 'unidad',
    rental_daily_rate: '',
    rental_weekly_rate: '',
    rental_deposit: '',
    rental_min_days: '1',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      listing_type: 'sell',
      item_condition: 'nuevo',
      price: '',
      stock: '',
      category_name: '',
      unit: 'unidad',
      rental_daily_rate: '',
      rental_weekly_rate: '',
      rental_deposit: '',
      rental_min_days: '1',
    })
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('El archivo debe ser una imagen', 'error')
        return
      }
      const max_size = 5 * 1024 * 1024
      if (file.size > max_size) {
        showToast('La imagen no debe superar los 5 MB', 'error')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast('El nombre es obligatorio', 'error')
      return
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      showToast('El precio debe ser mayor a cero', 'error')
      return
    }
    if (!form.stock || parseInt(form.stock, 10) < 0) {
      showToast('El stock no puede ser negativo', 'error')
      return
    }
    if (!form.category_name) {
      showToast('Selecciona una categoría', 'error')
      return
    }

    if (form.listing_type === 'rent') {
      if (!form.rental_daily_rate || parseFloat(form.rental_daily_rate) <= 0) {
        showToast('La tarifa diaria es obligatoria para alquiler', 'error')
        return
      }
    }

    try {
      await crearPublicacion.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: form.price,
        unit: form.unit,
        stock: form.stock,
        category_name: form.category_name,
        listing_type: form.listing_type,
        item_condition: form.item_condition,
        rental_daily_rate: form.listing_type === 'rent' ? form.rental_daily_rate : undefined,
        rental_weekly_rate: form.listing_type === 'rent' ? form.rental_weekly_rate : undefined,
        rental_deposit: form.listing_type === 'rent' ? form.rental_deposit : undefined,
        rental_min_days: form.listing_type === 'rent' ? form.rental_min_days : undefined,
        imageFile: imageFile,
      })
      showToast('Artículo publicado correctamente', 'success')
      resetForm()
      setShowForm(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear la publicación', 'error')
    }
  }

  const handleToggleActive = (pubId: string, currentActive: boolean) => {
    togglePublicacion.mutate(
      { product_id: pubId, active: !currentActive },
      {
        onSuccess: () => {
          showToast(`Publicación ${!currentActive ? 'activada' : 'desactivada'}`, 'success')
        },
        onError: (err) => {
          showToast(err instanceof Error ? err.message : 'Error al actualizar estado', 'error')
        },
      }
    )
  }

  const handleDeletePublicacion = async (pubId: string) => {
    try {
      await eliminarPublicacion.mutateAsync(pubId)
      showToast('Publicación eliminada correctamente', 'success')
      setDeletingId(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error')
    }
  }

  return (
    <ZScreen bg={Z.bg} style={{ position: 'fixed', zIndex: 100 }}>
      <Toast toasts={toasts} onRemove={removeToast} />

      <ZHeader title="Artículos de Ocasión" onBack={onBack} />

      {/* Reject Payment Reason Dialog */}
      {rejectingId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: Z.surface, borderRadius: Z.r.lg, padding: '24px 20px',
            width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>
              Rechazar comprobante
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec }}>
              Indica el motivo para que el comprador pueda corregirlo.
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
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                onClick={() => { setRejectingId(null); setRejectReason('') }}
                style={{
                  flex: 1, padding: '12px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
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
                  flex: 1, padding: '12px', borderRadius: Z.r.sm, border: 'none',
                  background: isRejecting ? Z.border : Z.error,
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

      {/* Delete Publicacion Confirmation Dialog */}
      {deletingId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: Z.surface, borderRadius: Z.r.lg, padding: '24px 20px',
            width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>
              Eliminar publicación
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, lineHeight: 1.4 }}>
              ¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                onClick={() => setDeletingId(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                  background: Z.surface, fontFamily: Z.font, fontSize: 13, fontWeight: 600,
                  color: Z.textSec, cursor: 'pointer', outline: 'none',
                }}
              >
                Cancelar
              </button>
              <button
                disabled={eliminarPublicacion.isPending}
                onClick={() => handleDeletePublicacion(deletingId)}
                style={{
                  flex: 1, padding: '12px', borderRadius: Z.r.sm, border: 'none',
                  background: Z.error, fontFamily: Z.font, fontSize: 13, fontWeight: 700,
                  color: '#fff', cursor: 'pointer', outline: 'none',
                }}
              >
                {eliminarPublicacion.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Navigation & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FilterBar
            options={['Mis publicaciones', 'Pedidos recibidos']}
            active={subTab}
            onChange={(val) => setSubTab(val as 'Mis publicaciones' | 'Pedidos recibidos')}
          />
          {subTab === 'Mis publicaciones' && (
            <ZButton
              variant="primary"
              fullWidth={false}
              onClick={() => setShowForm(true)}
              style={{
                padding: '10px 18px',
                borderRadius: 20,
                fontSize: 12,
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              }
            >
              Publicar artículo
            </ZButton>
          )}
        </div>

        {/* Tab content */}
        {subTab === 'Mis publicaciones' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {loadingPubs ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 110, borderRadius: Z.r.md, background: Z.divider, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : publicaciones.length === 0 ? (
              <div style={{ padding: '64px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={Z.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>
                  No tienes publicaciones
                </div>
                <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, maxWidth: 260, lineHeight: 1.45 }}>
                  Publica los materiales o herramientas que te sobren para que otros puedan comprarlos.
                </div>
                <ZButton
                  variant="secondary"
                  fullWidth={false}
                  onClick={() => setShowForm(true)}
                  style={{ marginTop: 8, padding: '10px 20px', borderRadius: 20, fontSize: 12 }}
                >
                  Crear mi primera publicación
                </ZButton>
              </div>
            ) : (
              publicaciones.map((pub) => (
                <div
                  key={pub.id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: 14,
                    borderRadius: Z.r.md,
                    background: Z.surface,
                    border: `1px solid ${Z.border}`,
                    position: 'relative',
                  }}
                >
                  {/* Thumbnail Image */}
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: Z.r.sm,
                      background: Z.bg,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${Z.border}`,
                    }}
                  >
                    {pub.image_url ? (
                      <img src={pub.image_url} alt={pub.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={Z.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                        {pub.name}
                      </span>
                      <span
                        style={{
                          fontFamily: Z.font,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 20,
                          background: pub.listing_type === 'rent' ? Z.bluePastel : Z.orangePastel,
                          color: pub.listing_type === 'rent' ? Z.blueDark : Z.orangeDark,
                        }}
                      >
                        {pub.listing_type === 'rent' ? 'Alquiler' : 'Venta'}
                      </span>
                    </div>

                    <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, fontWeight: 600 }}>
                      Categoría: {pub.category_name ?? 'Otro'}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>Precio</div>
                        <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark }}>
                          Bs {pub.price} / {pub.unit}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>Disponibles</div>
                        <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>
                          {pub.stock}
                        </div>
                      </div>
                      {pub.item_condition && (
                        <div>
                          <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>Estado</div>
                          <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec }}>
                            {pub.item_condition === 'nuevo' ? 'Nuevo' : 'Usado'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions on Card (Active Toggle + Delete Button) */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    {/* Toggle Active Switch */}
                    <button
                      onClick={() => handleToggleActive(pub.id, pub.active)}
                      disabled={togglePublicacion.isPending}
                      aria-label={pub.active ? 'Desactivar publicación' : 'Activar publicación'}
                      style={{
                        position: 'relative',
                        width: 38,
                        height: 20,
                        borderRadius: 20,
                        border: 'none',
                        outline: 'none',
                        cursor: togglePublicacion.isPending ? 'default' : 'pointer',
                        background: pub.active ? Z.orangeDark : Z.border,
                        transition: 'background 0.2s',
                        padding: 0,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: pub.active ? 20 : 2,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#fff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'left 0.2s',
                        }}
                      />
                    </button>

                    {/* Delete Trash Button */}
                    <button
                      onClick={() => setDeletingId(pub.id)}
                      aria-label="Eliminar publicación"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: 'none',
                        background: '#FFF1F1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'opacity 0.15s',
                        outline: 'none',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={Z.error} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Pedidos recibidos tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {loadingOrders ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 110, borderRadius: Z.r.md, background: Z.divider, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '64px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={Z.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>
                  No hay pedidos
                </div>
                <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted, maxWidth: 240, lineHeight: 1.45 }}>
                  Los pedidos que recibas por tus artículos de ocasión aparecerán aquí.
                </div>
              </div>
            ) : (
              orders.map((order) => {
                const statusColor = STATUS_COLOR[order.status] ?? Z.orange
                const statusLbl = STATUS_LABEL[order.status] ?? order.status
                const hasRental = order.items.some((item) => item.is_rental)

                // Ordered item details
                const itemsSummary = order.items
                  .map((i) => `${i.quantity}x ${i.product?.name ?? 'Artículo'}`)
                  .join(', ')

                return (
                  <div
                    key={order.id}
                    style={{
                      padding: 16,
                      borderRadius: Z.r.md,
                      background: Z.surface,
                      border: `1px solid ${Z.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Buyer and Status Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
                        {order.buyer_name ?? 'Comprador'}
                      </span>
                      <span
                        style={{
                          fontFamily: Z.font,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: statusColor + '18',
                          color: statusColor,
                        }}
                      >
                        {statusLbl}
                      </span>
                    </div>

                    {/* Order details */}
                    <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, lineHeight: 1.4 }}>
                      {itemsSummary}
                    </div>

                    {/* Total Amount & Primary Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.orangeDark }}>
                        Bs {order.total.toLocaleString('es-BO')}
                      </span>

                      {/* General buttons for non-rental orders */}
                      {!hasRental && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped') && (
                            <button
                              onClick={() =>
                                updateOrderStatus.mutate(
                                  { orderId: order.id, status: 'delivered', providerId },
                                  {
                                    onSuccess: () => showToast('Entrega confirmada', 'success'),
                                    onError: () => showToast('No se pudo confirmar la entrega', 'error'),
                                  }
                                )
                              }
                              disabled={updateOrderStatus.isPending}
                              style={{
                                padding: '8px 16px',
                                borderRadius: 20,
                                border: 'none',
                                background: Z.success,
                                color: '#fff',
                                fontFamily: Z.font,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              Confirmar entrega
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons for Pending with Payment Evidence uploaded */}
                    {order.status === 'pending' && order.payment_evidence_url && (
                      <div
                        style={{
                          marginTop: 4,
                          padding: 12,
                          borderRadius: Z.r.sm,
                          background: Z.orangeLight,
                          border: `1px solid ${Z.orangePastel}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.orangeDark }}>
                            Comprobante recibido
                          </span>
                          <a
                            href={order.payment_evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontFamily: Z.font,
                              fontSize: 11,
                              color: Z.blueDark,
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            Ver Imagen
                          </a>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            disabled={isConfirming}
                            onClick={async () => {
                              try {
                                await confirmOrderPayment(order.id)
                                showToast('Pago confirmado correctamente', 'success')
                              } catch (err) {
                                showToast(err instanceof Error ? err.message : 'Error al confirmar', 'error')
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: 20,
                              border: 'none',
                              background: isConfirming ? Z.border : Z.success,
                              color: '#fff',
                              fontFamily: Z.font,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: isConfirming ? 'default' : 'pointer',
                              outline: 'none',
                            }}
                          >
                            {isConfirming ? 'Confirmando...' : 'Confirmar pago'}
                          </button>
                          <button
                            disabled={isRejecting}
                            onClick={() => setRejectingId(order.id)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: 20,
                              border: `1.5px solid ${Z.error}`,
                              background: 'transparent',
                              color: Z.error,
                              fontFamily: Z.font,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            Rechazar pago
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Rental Details and Actions (Item Level) */}
                    {hasRental && (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${Z.divider}`, paddingTop: 10 }}>
                        <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.text }}>
                          Detalles de Alquiler
                        </div>
                        {order.items
                          .filter((item) => item.is_rental)
                          .map((item) => (
                            <div
                              key={item.id}
                              style={{
                                padding: '10px 12px',
                                borderRadius: Z.r.sm,
                                background: Z.bg,
                                border: `1px solid ${Z.border}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                <div>
                                  <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.text }}>
                                    {item.quantity}x {item.product?.name}
                                  </div>
                                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 2 }}>
                                    Del {item.rental_start_date ? new Date(item.rental_start_date).toLocaleDateString('es-BO') : ''} al{' '}
                                    {item.rental_end_date ? new Date(item.rental_end_date).toLocaleDateString('es-BO') : ''}{' '}
                                    ({item.rental_days} días)
                                  </div>
                                </div>
                                <span
                                  style={{
                                    fontFamily: Z.font,
                                    fontSize: 9,
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: 12,
                                    background:
                                      item.rental_status === 'reserved'
                                        ? Z.blueLight
                                        : item.rental_status === 'in_use'
                                        ? Z.orangeLight
                                        : Z.successBg,
                                    color:
                                      item.rental_status === 'reserved'
                                        ? Z.blueDark
                                        : item.rental_status === 'in_use'
                                        ? Z.orangeDark
                                        : Z.successDark,
                                  }}
                                >
                                  {item.rental_status === 'reserved'
                                    ? 'Reservado'
                                    : item.rental_status === 'in_use'
                                    ? 'En uso'
                                    : item.rental_status === 'returned'
                                    ? 'Devuelto'
                                    : 'Completado'}
                                </span>
                              </div>

                              {item.rental_deposit && (
                                <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec }}>
                                  Garantía: Bs {item.rental_deposit.toLocaleString('es-BO')}
                                </div>
                              )}

                              {/* Rental actions */}
                              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                {item.rental_status === 'reserved' && (
                                  <button
                                    onClick={() =>
                                      markRentalInUse.mutate(
                                        { orderId: order.id, providerId },
                                        {
                                          onSuccess: () => showToast('Marcado en uso/entregado', 'success'),
                                          onError: () => showToast('Error al actualizar alquiler', 'error'),
                                        }
                                      )
                                    }
                                    disabled={markRentalInUse.isPending}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: 20,
                                      border: 'none',
                                      background: Z.orange,
                                      color: '#fff',
                                      cursor: 'pointer',
                                      outline: 'none',
                                      fontFamily: Z.font,
                                      fontSize: 10,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {markRentalInUse.isPending ? 'Procesando...' : 'Marcar en Uso'}
                                  </button>
                                )}

                                {item.rental_status === 'in_use' && (
                                  <button
                                    onClick={() =>
                                      confirmRentalReturn.mutate(
                                        { orderItemId: item.id, providerId },
                                        {
                                          onSuccess: () => showToast('Devolución confirmada', 'success'),
                                          onError: () => showToast('Error al confirmar devolución', 'error'),
                                        }
                                      )
                                    }
                                    disabled={confirmRentalReturn.isPending}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: 20,
                                      border: 'none',
                                      background: Z.success,
                                      color: '#fff',
                                      cursor: 'pointer',
                                      outline: 'none',
                                      fontFamily: Z.font,
                                      fontSize: 10,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {confirmRentalReturn.isPending ? 'Confirmando...' : 'Confirmar Devolución'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Timeago footer */}
                    <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, alignSelf: 'flex-start' }}>
                      {timeAgo(order.created_at)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Publish Form Modal Overlay */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 150, background: Z.bg,
          display: 'flex', flexDirection: 'column',
          animation: 'zFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '58px 16px 12px', borderBottom: `1px solid ${Z.divider}`, background: Z.surface,
          }}>
            <button
              onClick={() => { setShowForm(false); resetForm() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px 0 8px', height: 40,
                borderRadius: 20, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
                background: Z.surface, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', outline: 'none',
              }}
              aria-label="Cerrar"
            >
              <ZIcon name="arrow-left" size={20} color={Z.text} />
              <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text, whiteSpace: 'nowrap' }}>
                Volver
              </span>
            </button>
            <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 700, color: Z.text }}>
              Publicar Artículo
            </span>
            <div style={{ width: 40 }} />
          </div>

          {/* Form Content */}
          <form onSubmit={handlePublish} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Image Upload Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Imagen del artículo
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: 140,
                  borderRadius: Z.r.md,
                  border: `2px dashed ${Z.border}`,
                  background: Z.surface,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setImageFile(null)
                        setImagePreview(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      style={{
                        position: 'absolute', top: 8, right: 8, width: 28, height: 28,
                        borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}
                    >
                      <ZIcon name="close" size={16} color="#fff" />
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={Z.textSec} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec }}>
                      Seleccionar imagen (opcional)
                    </span>
                    <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>
                      JPG, PNG hasta 5 MB
                    </span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>

            {/* Name */}
            <ZInput
              label="Nombre del artículo *"
              value={form.name}
              onChange={(val) => setForm((f) => ({ ...f, name: val }))}
              placeholder="Ej: Ladrillos de primera, Taladro Bosch..."
            />

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe el estado de conservación, dimensiones, etc."
                rows={3}
                style={{
                  fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text,
                  padding: '14px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                  background: Z.surface, outline: 'none', resize: 'none', boxSizing: 'border-box',
                  width: '100%',
                }}
              />
            </div>

            {/* Selects: Listing Type & Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ZSelect
                label="Tipo de publicación"
                value={form.listing_type}
                onChange={(val) => setForm((f) => ({ ...f, listing_type: val as 'sell' | 'rent' }))}
                options={[
                  { value: 'sell', label: 'Venta' },
                  { value: 'rent', label: 'Alquiler' },
                ]}
              />

              <ZSelect
                label="Estado"
                value={form.item_condition}
                onChange={(val) => setForm((f) => ({ ...f, item_condition: val as 'nuevo' | 'usado' }))}
                options={[
                  { value: 'nuevo', label: 'Nuevo' },
                  { value: 'usado', label: 'Usado' },
                ]}
              />
            </div>

            {/* Selects: Category & Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ZSelect
                label="Categoría *"
                value={form.category_name}
                onChange={(val) => setForm((f) => ({ ...f, category_name: val }))}
                placeholder="Seleccionar..."
                options={[...CATEGORIAS_CONSTRUCCION]}
              />

              <ZSelect
                label="Unidad"
                value={form.unit}
                onChange={(val) => setForm((f) => ({ ...f, unit: val }))}
                options={['unidad', 'kg', 'm2', 'm3', 'saco', 'varilla']}
              />
            </div>

            {/* Inputs: Price & Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ZInput
                label="Precio (Bs.) *"
                type="number"
                value={form.price}
                onChange={(val) => setForm((f) => ({ ...f, price: val }))}
                placeholder="Ej: 80"
              />

              <ZInput
                label="Stock / Cantidad *"
                type="number"
                value={form.stock}
                onChange={(val) => setForm((f) => ({ ...f, stock: val }))}
                placeholder="Ej: 10"
              />
            </div>

            {/* Rental specific fields */}
            {form.listing_type === 'rent' && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 14,
                border: `1.5px solid ${Z.bluePastel}`, borderRadius: Z.r.md,
                padding: 16, background: 'rgba(46, 110, 181, 0.03)',
              }}>
                <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.blueDark }}>
                  Detalles de Alquiler
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <ZInput
                    label="Tarifa Diaria (Bs.) *"
                    type="number"
                    value={form.rental_daily_rate}
                    onChange={(val) => setForm((f) => ({ ...f, rental_daily_rate: val }))}
                    placeholder="Ej: 50"
                  />

                  <ZInput
                    label="Tarifa Semanal (Bs.)"
                    type="number"
                    value={form.rental_weekly_rate}
                    onChange={(val) => setForm((f) => ({ ...f, rental_weekly_rate: val }))}
                    placeholder="Ej: 300"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <ZInput
                    label="Garantía / Depósito (Bs.)"
                    type="number"
                    value={form.rental_deposit}
                    onChange={(val) => setForm((f) => ({ ...f, rental_deposit: val }))}
                    placeholder="Ej: 200"
                  />

                  <ZInput
                    label="Mínimo de días"
                    type="number"
                    value={form.rental_min_days}
                    onChange={(val) => setForm((f) => ({ ...f, rental_min_days: val }))}
                    placeholder="Ej: 1"
                  />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <ZButton
              type="submit"
              variant="primary"
              disabled={crearPublicacion.isPending}
              style={{ marginTop: 12 }}
            >
              {crearPublicacion.isPending ? 'Publicando...' : 'Publicar Artículo'}
            </ZButton>
          </form>
        </div>
      )}
    </ZScreen>
  )
}

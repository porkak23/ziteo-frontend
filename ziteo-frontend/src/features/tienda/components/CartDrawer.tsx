import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../hooks/useCart'
import type { CargoType, CartItem } from '../hooks/useCart'
import { usePlaceOrder } from '../hooks/useOrders'
import { useGenerateQuotation } from '../hooks/useQuotation'
import { useProviderConditions } from '../hooks/useProviderConditions'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { DeliverySection } from './DeliverySection'
import type { DeliveryMethod } from './DeliverySection'
import { CargoSelector } from './CargoSelector'
import type { MapPickerValue } from '../../../shared/components/MapPicker'
import { useAuthStore } from '../../auth/store/authStore'
import { useProyectos } from '../../proyectos/hooks/useProyectos'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

const detectCargoType = (w: number | null): CargoType | null => w === null ? null : w < 5 ? 'light' : 'heavy'

// ─── OrderProgressBar ─────────────────────────────────────────────────────────

interface OrderProgressBarProps {
  sellerItems: CartItem[]
}

function OrderProgressBar({ sellerItems }: OrderProgressBarProps) {
  const sellerId = sellerItems[0]?.sellerId ?? ''
  const { data: conditions } = useProviderConditions(sellerId)

  const subtotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const hasMin  = conditions?.min_order_amount != null && conditions.min_order_amount > 0
  const hasFree = conditions?.free_shipping_threshold != null && conditions.free_shipping_threshold > 0

  if (!hasMin && !hasFree) return null

  const minOrder    = (conditions?.min_order_amount ?? 0) as number
  const freeShipping = hasFree ? (conditions?.free_shipping_threshold as number) : null

  const reachedMin  = !hasMin || subtotal >= minOrder
  const reachedFree = freeShipping != null && subtotal >= freeShipping

  let progressValue = 0
  let barColor = 'bg-primary'
  let message  = ''

  if (hasMin && !reachedMin) {
    progressValue = minOrder > 0 ? Math.min(subtotal / minOrder, 1) : 0
    barColor = 'bg-[#A43700]'
    message  = `Te faltan Bs. ${(minOrder - subtotal).toFixed(2)} para el pedido mínimo (Bs. ${minOrder.toLocaleString('es-BO')})`
  } else if (freeShipping != null && !reachedFree) {
    progressValue = Math.min(subtotal / freeShipping, 1)
    barColor = 'bg-green-500'
    message  = `Te faltan Bs. ${(freeShipping - subtotal).toFixed(2)} para envío gratis`
  } else {
    progressValue = 1
    barColor = 'bg-green-500'
    message  = 'Pedido mínimo y envío gratis alcanzado'
  }

  const storeName = conditions?.store_name ?? ''

  return (
    <div className="px-4 pt-3 pb-2">
      {storeName && (
        <p className="font-label text-xs font-semibold text-on-surface-variant mb-1 truncate">
          {storeName}
        </p>
      )}
      <div className="h-2 rounded-full bg-surface-container overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${progressValue * 100}%` }}
        />
      </div>
      <p className="font-body text-xs text-on-surface-variant mt-1">{message}</p>
    </div>
  )
}

// ─── CartDrawer ───────────────────────────────────────────────────────────────

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items        = useCart((s) => s.items)
  const updateQty    = useCart((s) => s.updateQty)
  const removeItem   = useCart((s) => s.removeItem)
  const total        = useCart((s) => s.total)
  const itemCount    = useCart((s) => s.itemCount)
  const cargoType    = useCart((s) => s.cargoType)
  const setCargoType = useCart((s) => s.setCargoType)
  const totalWeight  = useCart((s) => s.totalWeight)
  const currentUser  = useAuthStore((s) => s.user)

  const [deliveryMethod, setDeliveryMethod]       = useState<DeliveryMethod>('delivery')
  const [deliveryLoc, setDeliveryLoc]             = useState<MapPickerValue | null>(null)
  const [originProjectId, setOriginProjectId]     = useState<string | null>(null)

  const { data: proyectos } = useProyectos(
    currentUser?.user_id ? { constructor_id: currentUser.user_id } : undefined,
  )

  const { mutate: placeOrder, isPending: isPlacing } = usePlaceOrder()
  const { mutate: generateQuotation, isPending: isQuoting } = useGenerateQuotation()
  const { toasts, showToast, removeToast } = useToast()

  const detectedCargo: CargoType | null = useMemo(
    () => detectCargoType(totalWeight()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  )

  const sellerGroups = items.reduce<Record<string, CartItem[]>>((acc, item) => {
    if (!acc[item.sellerId]) acc[item.sellerId] = []
    acc[item.sellerId].push(item)
    return acc
  }, {})
  const sellerIds = Object.keys(sellerGroups)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) { setDeliveryMethod('delivery'); setDeliveryLoc(null); setOriginProjectId(null) }
  }, [open])

  const needsAddress   = deliveryMethod === 'delivery' && !deliveryLoc?.address
  const isEmpty        = items.length === 0
  const isBusy         = isPlacing || isQuoting
  const confirmBlocked = isBusy || isEmpty || needsAddress

  function handleConfirm() {
    placeOrder(
      {
        deliveryMethod,
        deliveryAddress: deliveryLoc?.address,
        deliveryLat:     deliveryLoc?.lat,
        deliveryLng:     deliveryLoc?.lng,
        projectId:       originProjectId ?? undefined,
      },
      {
        onSuccess: () => {
          showToast('¡Pedido enviado!', 'success')
          setTimeout(onClose, 1200)
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Error al crear el pedido'
          showToast(msg, 'error')
        },
      }
    )
  }

  function handleCotizar() {
    if (items.length === 0) return

    const byProvider = items.reduce<Record<string, typeof items>>((acc, item) => {
      if (!acc[item.sellerId]) acc[item.sellerId] = []
      acc[item.sellerId].push(item)
      return acc
    }, {})

    const [providerId, providerItems] = Object.entries(byProvider).reduce(
      (best, current) => {
        const bestSub = best[1].reduce((s, i) => s + i.price * i.quantity, 0)
        const currSub = current[1].reduce((s, i) => s + i.price * i.quantity, 0)
        return current[1].length > best[1].length ||
          (current[1].length === best[1].length && currSub > bestSub)
          ? current : best
      }
    )

    generateQuotation(
      {
        provider_id: providerId,
        items: providerItems.map((i) => ({
          product_id: i.productId,
          name:       i.name,
          quantity:   i.quantity,
          price_unit: i.price,
          ...(i.weight_kg != null ? { weight_kg: i.weight_kg } : {}),
        })),
        subtotal: providerItems.reduce((s, i) => s + i.price * i.quantity, 0),
      },
      {
        onSuccess: () => {
          showToast('Cotización generada. Vence en 7 días. La puedes ver en Mis Pedidos.', 'success')
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Error al generar cotización'
          showToast(msg, 'error')
        },
      }
    )
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-xl flex flex-col transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-outline-variant">
          <h2 className="font-label font-semibold text-on-surface text-base">
            Mi carrito ({itemCount()} {itemCount() === 1 ? 'item' : 'items'})
          </h2>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            aria-label="Cerrar carrito"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">shopping_cart</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">El carrito está vacío</p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">Agrega materiales desde la tienda</p>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-outline-variant pb-1">
              {sellerIds.map((sid) => (
                <OrderProgressBar key={sid} sellerItems={sellerGroups[sid]} />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {items.map((item, index) => (
                <div key={item.productId}>
                  <div className="flex items-center gap-3 py-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-xl text-on-surface-variant">inventory_2</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label font-semibold text-on-surface text-sm truncate">{item.name}</p>
                      <p className="font-body text-on-surface-variant text-xs">
                        Bs. {item.price.toLocaleString('es-BO')} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center active:opacity-60"
                        aria-label={`Disminuir cantidad de ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-on-surface text-xl leading-none">remove</span>
                      </button>
                      <span className="font-label font-semibold text-on-surface text-sm w-5 text-center" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center active:opacity-60"
                        aria-label={`Aumentar cantidad de ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-on-surface text-xl leading-none">add</span>
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors shrink-0"
                      aria-label={`Eliminar ${item.name} del carrito`}
                    >
                      <span className="material-symbols-outlined text-error text-base">delete</span>
                    </button>
                  </div>
                  {index < items.length - 1 && <div className="border-b border-outline-variant" />}
                </div>
              ))}
            </div>

            <div className="px-4 pt-3 pb-6 border-t border-outline-variant shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-label font-semibold text-on-surface">Total</span>
                <span className="font-headline font-extrabold text-primary text-lg">
                  Bs. {total().toLocaleString('es-BO')}
                </span>
              </div>

              <DeliverySection
                method={deliveryMethod}
                onMethodChange={setDeliveryMethod}
                location={deliveryLoc}
                onLocationChange={setDeliveryLoc}
                projects={proyectos}
                originProjectId={originProjectId}
                onOriginProjectChange={setOriginProjectId}
              />

              <CargoSelector
                value={cargoType}
                detected={detectedCargo}
                hasWeight={totalWeight() !== null}
                onChange={setCargoType}
              />

              {needsAddress && (
                <p className="font-body text-xs text-error">
                  Indica la dirección de entrega para continuar.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCotizar}
                  disabled={isBusy || isEmpty}
                  className="flex items-center justify-center gap-1.5 rounded-2xl py-4 border border-primary text-primary font-semibold text-sm transition-opacity disabled:opacity-50 active:opacity-70"
                  aria-label="Generar cotización PDF"
                >
                  {isQuoting ? (
                    <span className="material-symbols-outlined text-[18px] leading-none animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] leading-none">description</span>
                  )}
                  {isQuoting ? 'Generando...' : 'Cotizar'}
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={confirmBlocked}
                  className="rounded-2xl py-4 bg-primary text-on-primary font-semibold text-sm transition-opacity disabled:opacity-60 active:opacity-80"
                >
                  {isPlacing ? 'Enviando...' : 'Confirmar pedido'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

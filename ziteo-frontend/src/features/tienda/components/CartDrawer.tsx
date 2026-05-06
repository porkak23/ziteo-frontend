import { useEffect, useMemo } from 'react'
import { useCart } from '../hooks/useCart'
import type { CargoType, CartItem } from '../hooks/useCart'
import { usePlaceOrder } from '../hooks/useOrders'
import { useGenerateQuotation } from '../hooks/useQuotation'
import { useProviderConditions } from '../hooks/useProviderConditions'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

// ─── Cargo type helpers ───────────────────────────────────────────────────────

const CARGO_LABELS: Record<CargoType, string> = {
  light: 'Carga ligera · Moto',
  heavy: 'Carga pesada · Camión',
}

const CARGO_ICONS: Record<CargoType, string> = {
  light: 'two_wheeler',
  heavy: 'local_shipping',
}

function detectCargoType(totalWeight: number | null): CargoType | null {
  if (totalWeight === null) return null
  return totalWeight < 5 ? 'light' : 'heavy'
}

// ─── OrderProgressBar ─────────────────────────────────────────────────────────

interface OrderProgressBarProps {
  sellerItems: CartItem[]
}

function OrderProgressBar({ sellerItems }: OrderProgressBarProps) {
  const sellerId = sellerItems[0]?.sellerId ?? ''
  const { data: conditions } = useProviderConditions(sellerId)

  const subtotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const hasMin = conditions?.min_order_amount != null && conditions.min_order_amount > 0
  const hasFree = conditions?.free_shipping_threshold != null && conditions.free_shipping_threshold > 0

  if (!hasMin && !hasFree) return null

  const minOrder = (conditions?.min_order_amount ?? 0) as number
  const freeShipping = hasFree ? (conditions?.free_shipping_threshold as number) : null

  const reachedMin = !hasMin || subtotal >= minOrder
  const reachedFree = freeShipping != null && subtotal >= freeShipping

  let progressValue = 0
  let barColor = 'bg-primary'
  let message = ''

  if (hasMin && !reachedMin) {
    progressValue = minOrder > 0 ? Math.min(subtotal / minOrder, 1) : 0
    barColor = 'bg-[#D94F00]'
    const remaining = (minOrder - subtotal).toFixed(2)
    message = `Te faltan Bs. ${remaining} para el pedido mínimo (Bs. ${minOrder.toLocaleString('es-BO')})`
  } else if (freeShipping != null && !reachedFree) {
    progressValue = Math.min(subtotal / freeShipping, 1)
    barColor = 'bg-green-500'
    const remaining = (freeShipping - subtotal).toFixed(2)
    message = `Te faltan Bs. ${remaining} para envío gratis`
  } else {
    progressValue = 1
    barColor = 'bg-green-500'
    message = '✓ Pedido mínimo y envío gratis alcanzado'
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

  const { mutate: placeOrder, isPending: isPlacing } = usePlaceOrder()
  const { mutate: generateQuotation, isPending: isQuoting } = useGenerateQuotation()
  const { toasts, showToast, removeToast } = useToast()

  const detectedCargo: CargoType | null = useMemo(
    () => detectCargoType(totalWeight()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  )

  const effectiveCargo: CargoType | null = cargoType ?? detectedCargo

  // Group items by sellerId (for progress bars)
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

  function handleConfirm() {
    placeOrder(undefined, {
      onSuccess: () => {
        showToast('¡Pedido enviado!', 'success')
        setTimeout(onClose, 1200)
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : 'Error al crear el pedido'
        showToast(msg, 'error')
      },
    })
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
          ? current
          : best
      }
    )

    const subtotal = providerItems.reduce((s, i) => s + i.price * i.quantity, 0)

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
        subtotal,
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

  const isEmpty   = items.length === 0
  const isBusy    = isPlacing || isQuoting
  const hasWeight = totalWeight() !== null

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
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Header */}
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

        {/* Content */}
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">shopping_cart</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">El carrito está vacío</p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">Agrega materiales desde la tienda</p>
          </div>
        ) : (
          <>
            {/* Progress bars — one per seller */}
            <div className="shrink-0 border-b border-outline-variant pb-1">
              {sellerIds.map((sid) => (
                <OrderProgressBar key={sid} sellerItems={sellerGroups[sid]} />
              ))}
            </div>

            {/* Item list */}
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

            {/* Footer */}
            <div className="px-4 pt-3 pb-6 border-t border-outline-variant shrink-0 flex flex-col gap-3">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="font-label font-semibold text-on-surface">Total</span>
                <span className="font-headline font-extrabold text-primary text-lg">
                  Bs. {total().toLocaleString('es-BO')}
                </span>
              </div>

              {/* Cargo type selector */}
              <div className="flex flex-col gap-1.5">
                <p className="font-label text-xs text-on-surface-variant">
                  Tipo de entrega
                  {hasWeight && detectedCargo !== null && (
                    <span className="ml-1 text-on-surface-variant/60">(detectado automáticamente)</span>
                  )}
                  {!hasWeight && (
                    <span className="ml-1 text-on-surface-variant/60">(selecciona manualmente)</span>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['light', 'heavy'] as CargoType[]).map((type) => {
                    const isActive = effectiveCargo === type
                    return (
                      <button
                        key={type}
                        onClick={() => setCargoType(type)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-outline'
                        }`}
                        aria-pressed={isActive}
                        aria-label={CARGO_LABELS[type]}
                      >
                        <span
                          className="material-symbols-outlined text-[18px] leading-none shrink-0"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {CARGO_ICONS[type]}
                        </span>
                        <span className="font-label text-xs font-medium leading-tight">
                          {CARGO_LABELS[type]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Action buttons */}
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
                  disabled={isBusy || isEmpty}
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

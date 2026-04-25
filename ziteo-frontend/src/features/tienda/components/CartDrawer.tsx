import { useEffect } from 'react'
import { useCart } from '../hooks/useCart'
import { usePlaceOrder } from '../hooks/useOrders'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCart((s) => s.items)
  const updateQty = useCart((s) => s.updateQty)
  const removeItem = useCart((s) => s.removeItem)
  const total = useCart((s) => s.total)
  const itemCount = useCart((s) => s.itemCount)

  const { mutate: placeOrder, isPending } = usePlaceOrder()
  const { toasts, showToast, removeToast } = useToast()

  // Lock body scroll while open
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
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">shopping_cart</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">El carrito está vacío</p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">Agrega materiales desde la tienda</p>
          </div>
        ) : (
          <>
            {/* Item list */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {items.map((item, index) => (
                <div key={item.productId}>
                  <div className="flex items-center gap-3 py-3">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-xl text-on-surface-variant">inventory_2</span>
                      )}
                    </div>

                    {/* Name + price */}
                    <div className="flex-1 min-w-0">
                      <p className="font-label font-semibold text-on-surface text-sm truncate">{item.name}</p>
                      <p className="font-body text-on-surface-variant text-xs">
                        Bs. {item.price.toLocaleString('es-BO')} c/u
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center active:opacity-60"
                      >
                        <span className="material-symbols-outlined text-on-surface text-xl leading-none">remove</span>
                      </button>
                      <span className="font-label font-semibold text-on-surface text-sm w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center active:opacity-60"
                      >
                        <span className="material-symbols-outlined text-on-surface text-xl leading-none">add</span>
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-error text-base">delete</span>
                    </button>
                  </div>
                  {index < items.length - 1 && (
                    <div className="border-b border-outline-variant" />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 pt-3 pb-6 border-t border-outline-variant shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="font-label font-semibold text-on-surface">Total</span>
                <span className="font-headline font-extrabold text-primary text-lg">
                  Bs. {total().toLocaleString('es-BO')}
                </span>
              </div>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="w-full rounded-2xl py-4 bg-primary text-on-primary font-semibold transition-opacity disabled:opacity-60 active:opacity-80"
              >
                {isPending ? 'Enviando...' : 'Confirmar pedido'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

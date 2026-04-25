import { useCart } from '../hooks/useCart'

interface CartScreenProps {
  onBack: () => void
  onCheckout: () => void
}

export function CartScreen({ onBack, onCheckout }: CartScreenProps) {
  const items = useCart((s) => s.items)
  const removeItem = useCart((s) => s.removeItem)
  const updateQty = useCart((s) => s.updateQty)
  const total = useCart((s) => s.total)

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-10 h-14 flex items-center px-2 bg-surface border-b border-outline-variant">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="flex-1 text-center font-label font-semibold text-on-surface text-base pr-10">
          Mi Carrito
        </span>
      </header>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-8">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">shopping_cart</span>
          <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">El carrito está vacío</p>
          <p className="font-body text-sm text-on-surface-variant/50 text-center">Agrega materiales y herramientas desde la tienda</p>
          <button
            onClick={onBack}
            className="mt-1 bg-primary text-on-primary font-label font-semibold rounded-2xl py-3 px-8 transition-opacity active:opacity-80"
          >
            Ver productos
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto pb-28">
            {items.map((item, index) => (
              <div key={item.productId}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-xl text-on-surface-variant">inventory_2</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-label font-semibold text-on-surface text-sm truncate">
                      {item.name}
                    </p>
                    <p className="font-body text-on-surface-variant text-xs">
                      Bs. {item.price.toLocaleString('es-BO')} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center transition-opacity active:opacity-60"
                    >
                      <span className="material-symbols-outlined text-on-surface text-base leading-none">remove</span>
                    </button>
                    <span className="font-label font-semibold text-on-surface text-sm w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center transition-opacity active:opacity-60"
                    >
                      <span className="material-symbols-outlined text-on-surface text-base leading-none">add</span>
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-error text-base">delete</span>
                  </button>
                </div>
                {index < items.length - 1 && (
                  <div className="border-b border-outline-variant mx-4" />
                )}
              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label font-semibold text-on-surface text-base">Total</span>
              <span className="font-label font-semibold text-on-surface text-base">
                Bs. {total().toFixed(2)}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-primary text-on-primary font-label font-semibold rounded-2xl py-4 transition-opacity active:opacity-80"
            >
              Proceder al pago
            </button>
          </div>
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useCart } from '../hooks/useCart'
import { usePlaceOrder } from '../hooks/useOrders'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

interface CheckoutScreenProps {
  onBack: () => void
  onSuccess: () => void
}

export function CheckoutScreen({ onBack, onSuccess }: CheckoutScreenProps) {
  const [orderError, setOrderError] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  const items = useCart((s) => s.items)
  const total = useCart((s) => s.total)

  const { mutate: placeOrder, isPending } = usePlaceOrder()

  function handleConfirm() {
    setOrderError(null)
    placeOrder(undefined, {
      onSuccess: () => {
        showToast('¡Pedido realizado con éxito!', 'success')
        onSuccess()
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : 'Error al procesar el pedido'
        setOrderError(msg)
        showToast('Error al procesar el pedido', 'error')
      },
    })
  }

  return (
    <div className="flex flex-col h-full">
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="h-14 flex items-center gap-3 px-4 border-b border-outline-variant bg-surface flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-11 h-11 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <h1 className="font-label font-semibold text-on-surface text-sm truncate flex-1">
          Confirmar pedido
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1 pb-32">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between py-3 border-b border-outline-variant"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-label text-sm text-on-surface">{item.name}</span>
              <span className="text-xs text-on-surface-variant">x{item.quantity}</span>
            </div>
            <span className="font-label text-sm text-on-surface">
              Bs. {(item.price * item.quantity).toLocaleString('es-BO')}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between pt-4">
          <span className="font-label text-on-surface">Total</span>
          <span className="font-headline text-xl text-primary">
            Bs. {total().toLocaleString('es-BO')}
          </span>
        </div>

        {orderError && (
          <div className="mt-3 bg-error-container text-on-error-container rounded-2xl p-3 font-body text-sm">
            {orderError}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-background border-t border-outline-variant">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending || items.length === 0}
          className="w-full bg-primary text-on-primary font-label font-semibold rounded-2xl py-4 text-sm transition-opacity disabled:opacity-60"
        >
          {isPending ? 'Procesando...' : 'Confirmar pedido'}
        </button>
      </div>
    </div>
  )
}

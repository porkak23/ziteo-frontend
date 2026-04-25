import { useState } from 'react'
import type { ProductCard } from '../types/tiendaTypes'
import { useCart } from '../hooks/useCart'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

interface ProductDetailScreenProps {
  product: ProductCard
  onBack: () => void
}

export function ProductDetailScreen({ product, onBack }: ProductDetailScreenProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCart((s) => s.addItem)
  const { toasts, showToast, removeToast } = useToast()

  const proveedorInitial = product.proveedor.store_name.charAt(0).toUpperCase()

  const decrement = () => setQuantity((q) => Math.max(1, q - 1))
  const increment = () => setQuantity((q) => Math.min(product.stock, q + 1))

  const handleAddToCart = () => {
    // Single addItem call passes the desired quantity — no loop, no N re-renders
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        sellerId: product.proveedor.user_id,
        imageUrl: product.image_url ?? undefined,
      },
      quantity
    )
    showToast('Agregado al carrito', 'success')
    setTimeout(onBack, 800)
  }

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Toast toasts={toasts} onRemove={removeToast} />
      <header className="sticky top-0 z-10 h-14 flex items-center px-2 bg-surface border-b border-outline-variant">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="flex-1 text-center font-label font-semibold text-on-surface text-base pr-10">
          Detalle
        </span>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="h-56 w-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-6xl">image</span>
          </div>
        )}

        <div className="px-4 py-3 flex flex-col gap-2">
          <h1 className="font-headline text-xl text-on-surface">{product.name}</h1>

          <p className="font-headline text-2xl text-primary">
            Bs. {product.price}{' '}
            <span className="font-body font-normal text-on-surface-variant text-sm">
              / {product.unit}
            </span>
          </p>

          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0">
              <span className="font-label font-semibold text-on-surface text-sm">
                {proveedorInitial}
              </span>
            </div>
            <span className="font-body text-sm text-on-surface flex-1 truncate">
              {product.proveedor.store_name}
            </span>
            {product.proveedor.is_verified && (
              <div className="flex items-center gap-1 bg-secondary-container rounded-full px-2 py-0.5 shrink-0">
                <span
                  className="material-symbols-outlined text-xs text-on-secondary-container leading-none"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="text-on-secondary-container text-xs font-label">
                  Verificado
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-on-surface-variant text-sm leading-none">
              location_on
            </span>
            <span className="text-sm text-on-surface-variant">{product.proveedor.city}</span>
          </div>

          <p className="font-body text-sm text-on-surface mt-2">{product.description}</p>

          <span className="text-xs text-on-surface-variant">
            Disponible: {product.stock} {product.unit}
          </span>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center gap-4">
            <button
              onClick={decrement}
              disabled={quantity <= 1}
              className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              <span className="material-symbols-outlined text-on-surface text-base leading-none">remove</span>
            </button>
            <span className="font-label font-semibold text-on-surface text-lg w-6 text-center">
              {quantity}
            </span>
            <button
              onClick={increment}
              disabled={quantity >= product.stock}
              className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              <span className="material-symbols-outlined text-on-surface text-base leading-none">add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-outline-variant px-4 py-3">
        <button
          onClick={handleAddToCart}
          className="w-full bg-primary text-on-primary font-label font-semibold rounded-2xl py-4 transition-opacity active:opacity-80"
        >
          Agregar al carrito — Bs. {product.price * quantity}
        </button>
      </div>
    </div>
  )
}

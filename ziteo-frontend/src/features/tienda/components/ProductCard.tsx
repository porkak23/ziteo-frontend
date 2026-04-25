import { memo } from 'react'
import { useCart } from '../hooks/useCart'
import type { ProductCard as ProductCardType } from '../types/tiendaTypes'

interface ProductCardProps {
  product: ProductCardType
  onPress?: (id: string) => void
}

function ProductCardComponent({ product, onPress }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem)
  const updateQty = useCart((s) => s.updateQty)
  const cartItem = useCart((s) => s.items.find((i) => i.productId === product.id))

  const inCart = !!cartItem
  const outOfStock = typeof product.stock === 'number' && product.stock === 0

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      sellerId: product.proveedor.user_id,
      imageUrl: product.image_url ?? undefined,
    })
  }

  function handleDecrease(e: React.MouseEvent) {
    e.stopPropagation()
    if (!cartItem) return
    updateQty(product.id, cartItem.quantity - 1)
  }

  function handleIncrease(e: React.MouseEvent) {
    e.stopPropagation()
    if (!cartItem) return
    updateQty(product.id, cartItem.quantity + 1)
  }

  return (
    <button
      onClick={() => onPress?.(product.id)}
      className="flex flex-col bg-surface rounded-2xl border border-outline-variant overflow-hidden text-left w-full active:opacity-80 active:scale-[0.98] transition-[border-color,opacity] cursor-pointer hover:border-primary/30"
    >
      {/* Imagen */}
      <div className="relative h-36 w-full bg-surface-container flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-36 object-cover w-full transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">inventory_2</span>
        )}
        {outOfStock && (
          <span className="absolute top-2 left-2 bg-error text-on-error text-[10px] font-label font-bold rounded-lg px-2 py-0.5 uppercase tracking-wide">
            Sin stock
          </span>
        )}
        {inCart && !outOfStock && (
          <span className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <span className="font-label text-[10px] font-bold text-white leading-none">{cartItem.quantity}</span>
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="font-label font-semibold text-on-surface text-sm line-clamp-2 leading-tight">
          {product.name}
        </p>

        <div className="flex items-baseline gap-1">
          <span className="font-headline font-black text-primary text-base leading-none tracking-[-0.02em]">
            Bs. {product.price.toLocaleString('es-BO')}
          </span>
          <span className="font-body text-on-surface-variant text-xs">/{product.unit}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px] text-on-surface-variant">store</span>
          <span className="font-body text-on-surface-variant text-xs truncate">{product.proveedor.store_name}</span>
        </div>

        {/* Cart control */}
        {inCart ? (
          <div
            className="flex items-center justify-between bg-primary/10 rounded-xl px-1 py-0.5 mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDecrease}
              className="w-11 h-11 rounded-lg bg-primary text-white flex items-center justify-center active:opacity-70 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl leading-none">remove</span>
            </button>
            <span className="font-headline font-black text-primary text-sm">{cartItem.quantity}</span>
            <button
              onClick={handleIncrease}
              disabled={outOfStock}
              className="w-11 h-11 rounded-lg bg-primary text-white flex items-center justify-center active:opacity-70 disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl leading-none">add</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="mt-1 flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 bg-primary text-white text-xs font-label font-bold disabled:opacity-40 active:opacity-80 transition-opacity cursor-pointer uppercase tracking-wide"
          >
            <span className="material-symbols-outlined text-sm leading-none">add_shopping_cart</span>
            Agregar
          </button>
        )}
      </div>
    </button>
  )
}

export const ProductCard = memo(ProductCardComponent)

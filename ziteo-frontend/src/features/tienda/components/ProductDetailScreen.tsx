import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ProductCard } from '../types/tiendaTypes'
import { useCart } from '../hooks/useCart'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { supabase } from '../../../lib/supabaseClient'
import { getProductImageUrl } from '../utils/productImages'

interface ProductDetailScreenProps {
  product: ProductCard
  onBack: () => void
  onViewProviderStore?: (providerId: string, providerName: string) => void
}

interface AlternativeProvider {
  id: string
  price_unit: number
  unit_type: string
  provider_id: string
  user_roles: {
    store_name: string
    delivery_time_hours: number | null
    min_order_amount: number | null
  } | null
}

export function ProductDetailScreen({ product, onBack, onViewProviderStore }: ProductDetailScreenProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCart((s) => s.addItem)
  const { toasts, showToast, removeToast } = useToast()

  const proveedorInitial = product.proveedor.store_name.charAt(0).toUpperCase()

  const decrement = () => setQuantity((q) => Math.max(1, q - 1))
  const increment = () => setQuantity((q) => Math.min(product.stock, q + 1))

  const handleAddToCart = () => {
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

  // ── Query: alternative providers for same product ──────────────────────────
  const { data: altProviders = [] } = useQuery<AlternativeProvider[]>({
    queryKey: ['alt-providers', product.name, product.proveedor.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          price_unit,
          unit_type,
          provider_id,
          user_roles!inner (
            store_name,
            delivery_time_hours,
            min_order_amount
          )
        `)
        .eq('name', product.name)
        .neq('provider_id', product.proveedor.user_id)
        .eq('active', true)
        .limit(3)
      if (error) return []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((p: any) => ({
        id: p.id,
        price_unit: Number(p.price_unit),
        unit_type: p.unit_type,
        provider_id: p.provider_id,
        user_roles: Array.isArray(p.user_roles) ? (p.user_roles[0] ?? null) : (p.user_roles ?? null),
      })) as AlternativeProvider[]
    },
    staleTime: 60_000,
  })

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
        {getProductImageUrl(product.name, product.image_url) ? (
          <img
            src={getProductImageUrl(product.name, product.image_url)}
            alt={product.name}
            loading="lazy"
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

          {/* Proveedor info */}
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

          {/* Provider delivery badges */}
          {(product.proveedor.delivery_time_hours != null || product.proveedor.min_order_amount != null || product.proveedor.free_shipping_threshold != null) && (
            <div className="flex gap-2 flex-wrap mt-1">
              {product.proveedor.min_order_amount != null && (
                <span className="flex items-center gap-1 bg-surface-container rounded-full px-2.5 py-1 font-label text-xs text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-xs leading-none text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    shopping_bag
                  </span>
                  Mín Bs.{product.proveedor.min_order_amount.toLocaleString('es-BO')}
                </span>
              )}
              {product.proveedor.delivery_time_hours != null && (
                <span className="flex items-center gap-1 bg-surface-container rounded-full px-2.5 py-1 font-label text-xs text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-xs leading-none text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    schedule
                  </span>
                  Entrega {product.proveedor.delivery_time_hours}h
                </span>
              )}
              {product.proveedor.free_shipping_threshold != null && (
                <span className="flex items-center gap-1 bg-surface-container rounded-full px-2.5 py-1 font-label text-xs text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-xs leading-none text-green-600"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_shipping
                  </span>
                  Gratis +Bs.{product.proveedor.free_shipping_threshold.toLocaleString('es-BO')}
                </span>
              )}
            </div>
          )}

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

        {/* ── Otros proveedores ─────────────────────────────────────────────── */}
        {altProviders.length > 0 && (
          <div className="px-4 pt-2 pb-4">
            <div className="border-t border-outline-variant pt-4">
              <h2 className="font-label font-semibold text-on-surface text-sm mb-3">
                Otros proveedores con este producto
              </h2>
              <div className="flex flex-col gap-2">
                {altProviders.map((alt) => {
                  const storeName = alt.user_roles?.store_name ?? 'Proveedor'
                  const initial = storeName.charAt(0).toUpperCase()
                  return (
                    <div
                      key={alt.id}
                      className="bg-surface-container rounded-2xl px-4 py-3 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-label font-bold text-primary text-sm leading-none">{initial}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label font-semibold text-on-surface text-sm truncate">{storeName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="font-headline font-bold text-primary text-sm">
                            Bs. {alt.price_unit.toLocaleString('es-BO')}
                            <span className="font-body font-normal text-on-surface-variant text-xs"> /{alt.unit_type}</span>
                          </span>
                          {alt.user_roles?.delivery_time_hours != null && (
                            <span className="flex items-center gap-0.5 font-label text-xs text-on-surface-variant">
                              <span
                                className="material-symbols-outlined text-xs leading-none"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                schedule
                              </span>
                              {alt.user_roles.delivery_time_hours}h
                            </span>
                          )}
                          {alt.user_roles?.min_order_amount != null && (
                            <span className="font-label text-xs text-on-surface-variant">
                              Mín Bs.{alt.user_roles.min_order_amount}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onViewProviderStore
                          ? onViewProviderStore(alt.provider_id, storeName)
                          : showToast('Ver tienda completa: próximamente disponible', 'info')
                        }
                        className="shrink-0 bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1.5 font-label text-xs font-semibold active:opacity-70 transition-opacity"
                      >
                        Ver tienda
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

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

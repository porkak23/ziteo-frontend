import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useCart } from '../hooks/useCart'
import { getProductImageUrl } from '../utils/productImages'

interface SurtidoRapidoSheetProps {
  open: boolean
  onClose: () => void
  providerId: string
  providerName: string
}

interface SurtidoProduct {
  id: string
  name: string
  price_unit: number
  unit_type: string
  stock_quantity: number
  bulk_price: number | null
  bulk_unit: string | null
  bulk_min_qty: number | null
  image_url: string | null
}

function useSurtidoProducts(providerId: string, enabled: boolean) {
  return useQuery<SurtidoProduct[]>({
    queryKey: ['surtido-products', providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price_unit, unit_type, stock_quantity, bulk_price, bulk_unit, bulk_min_qty, image_url')
        .eq('provider_id', providerId)
        .eq('active', true)
        .limit(30)
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price_unit: Number(p.price_unit),
        unit_type: p.unit_type,
        stock_quantity: p.stock_quantity,
        bulk_price: p.bulk_price != null ? Number(p.bulk_price) : null,
        bulk_unit: p.bulk_unit ?? null,
        bulk_min_qty: p.bulk_min_qty != null ? Number(p.bulk_min_qty) : null,
        image_url: getProductImageUrl(p.name, p.image_url) ?? null,
      })) as SurtidoProduct[]
    },
    staleTime: 2 * 60 * 1000,
    enabled: enabled && !!providerId,
  })
}

export function SurtidoRapidoSheet({
  open,
  onClose,
  providerId,
  providerName,
}: SurtidoRapidoSheetProps) {
  const { data: products, isLoading } = useSurtidoProducts(providerId, open)
  const addItem = useCart((s) => s.addItem)

  // Local quantity map: productId -> qty
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Reset quantities when sheet closes
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantities({})
    }
  }, [open])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function setQty(productId: string, qty: number) {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, qty),
    }))
  }

  const selectedItems = (products ?? []).filter((p) => (quantities[p.id] ?? 0) > 0)
  const selectedCount = selectedItems.reduce((sum, p) => sum + (quantities[p.id] ?? 0), 0)
  const selectedTotal = selectedItems.reduce(
    (sum, p) => sum + p.price_unit * (quantities[p.id] ?? 0),
    0,
  )

  function handleAddAll() {
    for (const p of selectedItems) {
      const qty = quantities[p.id] ?? 0
      if (qty > 0) {
        addItem(
          {
            productId: p.id,
            name: p.name,
            price: p.price_unit,
            sellerId: providerId,
            imageUrl: p.image_url ?? undefined,
          },
          qty,
        )
      }
    }
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-outline-variant">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-xl shrink-0">bolt</span>
            <div className="min-w-0">
              <h2 className="font-label font-semibold text-on-surface text-base leading-tight">
                Surtido Rápido
              </h2>
              <p className="font-body text-on-surface-variant text-xs truncate">{providerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors shrink-0"
            aria-label="Cerrar surtido rápido"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 animate-spin">
                progress_activity
              </span>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">
                inventory_2
              </span>
              <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">
                Sin productos activos
              </p>
              <p className="font-body text-sm text-on-surface-variant/50 text-center">
                Este proveedor no tiene productos disponibles en este momento
              </p>
            </div>
          ) : (
            <div className="px-4 py-2 divide-y divide-outline-variant">
              {products.map((product) => {
                const qty = quantities[product.id] ?? 0
                const outOfStock = product.stock_quantity === 0
                return (
                  <div key={product.id} className="flex items-center gap-3 py-3">
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-base text-on-surface-variant/40">
                          inventory_2
                        </span>
                      )}
                    </div>

                    {/* Name + price */}
                    <div className="flex-1 min-w-0">
                      <p className="font-label font-semibold text-on-surface text-sm line-clamp-1">
                        {product.name}
                      </p>
                      <p className="font-headline font-black text-primary text-sm leading-tight">
                        Bs. {product.price_unit.toLocaleString('es-BO')}
                        <span className="font-body font-normal text-on-surface-variant text-xs">
                          {' '}/{product.unit_type}
                        </span>
                      </p>
                      {product.bulk_price && product.bulk_unit && (
                        <p className="font-body text-on-surface-variant text-[10px]">
                          Bulto: Bs. {product.bulk_price.toLocaleString('es-BO')} por {product.bulk_unit}
                        </p>
                      )}
                    </div>

                    {/* Quantity control */}
                    <div className="flex items-center gap-1 shrink-0">
                      {qty > 0 ? (
                        <>
                          <button
                            onClick={() => setQty(product.id, qty - 1)}
                            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center active:opacity-60"
                            aria-label={`Disminuir ${product.name}`}
                          >
                            <span className="material-symbols-outlined text-on-surface text-lg leading-none">
                              remove
                            </span>
                          </button>
                          <span className="font-label font-semibold text-on-surface text-sm w-6 text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() => setQty(product.id, qty + 1)}
                            disabled={outOfStock}
                            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center active:opacity-60 disabled:opacity-40"
                            aria-label={`Aumentar ${product.name}`}
                          >
                            <span className="material-symbols-outlined text-lg leading-none">add</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => !outOfStock && setQty(product.id, 1)}
                          disabled={outOfStock}
                          className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center active:opacity-60 disabled:opacity-30"
                          aria-label={`Agregar ${product.name}`}
                        >
                          <span className="material-symbols-outlined text-primary text-lg leading-none">
                            add
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sticky footer CTA */}
        <div className="px-4 pt-3 pb-6 border-t border-outline-variant shrink-0">
          <button
            onClick={handleAddAll}
            disabled={selectedCount === 0}
            className="w-full rounded-2xl py-4 bg-primary text-on-primary font-semibold text-sm transition-opacity disabled:opacity-40 active:opacity-80 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg leading-none">add_shopping_cart</span>
            {selectedCount === 0
              ? 'Selecciona productos'
              : `Agregar ${selectedCount} producto${selectedCount !== 1 ? 's' : ''} al carrito (Bs. ${selectedTotal.toLocaleString('es-BO')})`}
          </button>
        </div>
      </div>
    </>
  )
}

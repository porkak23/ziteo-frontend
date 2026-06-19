import { useState, useEffect } from 'react'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { useAuthStore } from '../../auth/store/authStore'
import { useInventario, useToggleProductoActivo, INVENTARIO_PAGE_SIZE } from '../hooks/useInventario'
import type { ProductoInventario } from '../hooks/useInventario'
import { supabase } from '../../../lib/supabaseClient'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProductUnit } from '../../tienda/types/tiendaTypes'
import { ImagePicker } from '../../../shared/components/ImagePicker'

interface Category {
  id: string
  name: string
}

function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('id, name').order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

const UNIT_OPTIONS: ProductUnit[] = ['kg', 'm2', 'm3', 'unidad', 'saco', 'varilla']

type ListingType = 'sell' | 'rent'
type ConstructionStage = 'fundaciones' | 'muros' | 'techos' | 'terminaciones'

const CONSTRUCTION_STAGES: { value: ConstructionStage; label: string }[] = [
  { value: 'fundaciones', label: 'Fundaciones' },
  { value: 'muros', label: 'Muros' },
  { value: 'techos', label: 'Techos' },
  { value: 'terminaciones', label: 'Terminaciones' },
]

const STAGE_BADGE: Record<ConstructionStage, { bg: string; text: string }> = {
  fundaciones: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200' },
  muros:       { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-300' },
  techos:      { bg: 'bg-blue-100 dark:bg-blue-900/40',  text: 'text-blue-800 dark:text-blue-200' },
  terminaciones: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200' },
}

interface ProductForm {
  name: string
  description: string
  price: string
  unit: ProductUnit
  stock: string
  category_id: string
  image_url: string
  listing_type: ListingType
  construction_stage: ConstructionStage | ''
  bulk_price: string
  bulk_unit: string
  bulk_min_qty: string
  weight_kg: string
  showBulkSection: boolean
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: '',
  unit: 'unidad',
  stock: '',
  category_id: '',
  image_url: '',
  listing_type: 'sell',
  construction_stage: '',
  bulk_price: '',
  bulk_unit: '',
  bulk_min_qty: '',
  weight_kg: '',
  showBulkSection: false,
}

export function InventarioScreen() {
  const user = useAuthStore((s) => s.user)
  const { toasts, showToast, removeToast } = useToast()
  const queryClient = useQueryClient()
  const [offset, setOffset] = useState(0)
  const [allProducts, setAllProducts] = useState<ProductoInventario[]>([])
  const { data: page = [], isLoading, isFetching } = useInventario(offset)
  const { mutate: toggleActivo } = useToggleProductoActivo()
  const { data: categories = [] } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Accumulate results as pages load
  useEffect(() => {
    if (page.length === 0 && offset === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllProducts([])
      return
    }
    if (page.length === 0) return
    if (offset === 0) {
      setAllProducts(page)
    } else {
      setAllProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const newItems = page.filter((p) => !existingIds.has(p.id))
        return [...prev, ...newItems]
      })
    }
  }, [page, offset])

  const hasMore = page.length === INVENTARIO_PAGE_SIZE

  const handleCargarMas = () => {
    setOffset((prev) => prev + INVENTARIO_PAGE_SIZE)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('products').insert({
      name: form.name,
      description: form.description,
      price_unit: parseFloat(form.price),
      unit_type: form.unit,
      stock_quantity: parseInt(form.stock, 10),
      category_id: form.category_id || null,
      provider_id: user.user_id,
      image_url: form.image_url || null,
      listing_type: form.listing_type,
      active: true,
      construction_stage: form.construction_stage || null,
      bulk_price: form.bulk_price ? parseFloat(form.bulk_price) : null,
      bulk_unit: form.bulk_unit || null,
      bulk_min_qty: form.bulk_min_qty ? parseInt(form.bulk_min_qty, 10) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    setSaving(false)
    if (error) {
      showToast('Error al guardar el producto', 'error')
    } else {
      setOffset(0)
      setAllProducts([])
      queryClient.invalidateQueries({ queryKey: ['inventario', user.user_id] })
      setForm(EMPTY_FORM)
      setShowForm(false)
      showToast('Producto guardado', 'success')
    }
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="flex flex-col gap-3 py-3">
          <div className="flex items-center justify-end px-4">
            <button
              onClick={() => setShowForm(true)}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-on-primary"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          <div className="flex flex-col gap-3 px-4">
            {isLoading && offset === 0 ? (
              <>
                <div className="bg-surface-container animate-pulse rounded-2xl h-20" />
                <div className="bg-surface-container animate-pulse rounded-2xl h-20" />
                <div className="bg-surface-container animate-pulse rounded-2xl h-20" />
              </>
            ) : allProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">inventory_2</span>
                <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">Tu inventario está vacío</p>
                <p className="font-body text-sm text-on-surface-variant/50 text-center">Agrega tu primer producto para empezar a recibir pedidos</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-1 bg-primary text-on-primary font-label font-semibold text-sm rounded-2xl px-6 py-3 transition-opacity active:opacity-80"
                >
                  Agregar producto
                </button>
              </div>
            ) : (
              <>
                {allProducts.map((product) => (
                  <div key={product.id} className="bg-surface rounded-2xl p-4 flex items-center gap-3 border border-outline-variant">
                    <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-2xl">
                          inventory_2
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-label font-semibold text-on-surface text-sm truncate">
                          {product.name}
                        </p>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(product as any).construction_stage && (() => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const stage = (product as any).construction_stage as ConstructionStage
                          const badge = STAGE_BADGE[stage]
                          const stageLabel = CONSTRUCTION_STAGES.find(s => s.value === stage)?.label ?? stage
                          return badge ? (
                            <span className={`px-1.5 py-0.5 rounded-md font-label text-[10px] font-semibold leading-none ${badge.bg} ${badge.text}`}>
                              {stageLabel}
                            </span>
                          ) : null
                        })()}
                      </div>
                      <p className="font-body text-on-surface-variant text-xs">
                        Bs. {product.price}/{product.unit}
                      </p>
                      <p className="font-body text-on-surface-variant text-xs">
                        {product.stock} disponibles
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        toggleActivo({ product_id: product.id, active: !product.active })
                      }
                      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                        product.active ? 'bg-primary' : 'bg-surface-container'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          product.active ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}

                {/* Skeleton while fetching next page */}
                {isFetching && offset > 0 && (
                  <>
                    <div className="bg-surface-container animate-pulse rounded-2xl h-20" />
                    <div className="bg-surface-container animate-pulse rounded-2xl h-20" />
                  </>
                )}

                {/* Cargar más button */}
                {hasMore && !isFetching && (
                  <div className="flex justify-center pt-2 pb-4">
                    <button
                      onClick={handleCargarMas}
                      className="bg-surface-container text-on-surface font-label font-semibold rounded-2xl px-6 py-3"
                    >
                      Cargar más
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <header className="h-14 flex items-center px-2 border-b border-outline-variant bg-surface shrink-0">
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="w-10 h-10 flex items-center justify-center rounded-full" aria-label="Cerrar"
            >
              <span className="material-symbols-outlined text-on-surface">close</span>
            </button>
            <span className="flex-1 text-center font-label font-semibold text-on-surface pr-10">
              Agregar producto
            </span>
          </header>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label text-xs text-on-surface-variant">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                placeholder="Cemento SOBOCE IP-40"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label text-xs text-on-surface-variant">Descripción</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none resize-none"
                placeholder="Descripción del producto..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label text-xs text-on-surface-variant">Imagen del producto</label>
              <ImagePicker
                shape="square"
                bucket="product-images"
                folder={user?.user_id}
                value={form.image_url}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label text-xs text-on-surface-variant">Precio (Bs.)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                  placeholder="58"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label text-xs text-on-surface-variant">Unidad</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as ProductUnit }))}
                  className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label text-xs text-on-surface-variant">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                  placeholder="100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label text-xs text-on-surface-variant">Categoría *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipo de publicación */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-xs text-on-surface-variant">Tipo de publicación</label>
              <div className="flex gap-2">
                {(['sell', 'rent'] as ListingType[]).map((type) => {
                  const label = type === 'sell' ? 'Venta' : 'Alquiler'
                  const isSelected = form.listing_type === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, listing_type: type }))}
                      className={`flex-1 py-2.5 rounded-2xl border font-label text-sm font-medium transition-[border-color,background-color,color] ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Etapa de obra */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-xs text-on-surface-variant">
                Etapa de obra <span className="text-on-surface-variant/50">(opcional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CONSTRUCTION_STAGES.map((s) => {
                  const isSelected = form.construction_stage === s.value
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          construction_stage: isSelected ? '' : s.value,
                        }))
                      }
                      className={`flex-1 min-w-[40%] py-2 rounded-2xl border font-label text-sm font-medium transition-[border-color,background-color,color] ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant'
                      }`}
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Peso unitario */}
            <div className="flex flex-col gap-1">
              <label className="font-label text-xs text-on-surface-variant">
                Peso unitario <span className="text-on-surface-variant/50">(opcional)</span>
              </label>
              <div className="flex items-center gap-2 bg-surface-container rounded-2xl px-4 py-2.5">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.weight_kg}
                  onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
                  className="flex-1 bg-transparent outline-none font-body text-sm text-on-surface placeholder:text-on-surface-variant/40"
                  placeholder="ej: 42.5"
                />
                <span className="font-label text-on-surface-variant text-sm">kg / unidad</span>
              </div>
              {form.weight_kg && parseFloat(form.weight_kg) > 0 && (
                <p className="font-body text-xs text-on-surface-variant px-1">
                  {parseFloat(form.weight_kg) >= 50 ? '🚛 Se clasificará como carga pesada' : '🛵 Se clasificará como carga ligera'}
                </p>
              )}
            </div>

            {/* Precio de volumen (colapsable) */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, showBulkSection: !f.showBulkSection }))}
                className="flex items-center justify-between w-full py-2 bg-surface-container rounded-2xl px-4 transition-opacity active:opacity-70"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    inventory
                  </span>
                  <span className="font-label text-sm font-semibold text-on-surface">
                    Precio de volumen
                  </span>
                  <span className="font-body text-xs text-on-surface-variant/60">(opcional)</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                  {form.showBulkSection ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {form.showBulkSection && (
                <div className="flex flex-col gap-3 bg-surface-container/50 rounded-2xl p-3 border border-outline-variant">
                  <div className="flex flex-col gap-1">
                    <label className="font-label text-xs text-on-surface-variant">Unidad de bulto</label>
                    <input
                      type="text"
                      value={form.bulk_unit}
                      onChange={(e) => setForm((f) => ({ ...f, bulk_unit: e.target.value }))}
                      className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                      placeholder='ej: "bolsa de 42 kg", "docena"'
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="font-label text-xs text-on-surface-variant">Precio por bulto (Bs.)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.bulk_price}
                        onChange={(e) => setForm((f) => ({ ...f, bulk_price: e.target.value }))}
                        className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                        placeholder="ej: 450"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label text-xs text-on-surface-variant">Qty mínima</label>
                      <input
                        type="number"
                        min="1"
                        value={form.bulk_min_qty}
                        onChange={(e) => setForm((f) => ({ ...f, bulk_min_qty: e.target.value }))}
                        className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                        placeholder="ej: 10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="p-4 border-t border-outline-variant shrink-0">
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.price || !form.stock || !form.category_id}
              className="w-full bg-primary text-on-primary font-label font-semibold rounded-2xl py-4 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

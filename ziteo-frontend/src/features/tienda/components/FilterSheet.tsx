import { useState } from 'react'
import type { TiendaFilters, ListingType } from '../types/tiendaTypes'
import type { Category } from '../types/tiendaTypes'
import { BOLIVIAN_CITIES } from '../../auth/constants/authConstants'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  filters: TiendaFilters
  categories: Category[]
  onApply: (filters: TiendaFilters) => void
}

export function FilterSheet({ open, onClose, filters, categories, onApply }: FilterSheetProps) {
  const [draft, setDraft] = useState<TiendaFilters>(filters)

  // Sync draft when sheet opens
  const handleOpen = () => setDraft(filters)

  const handleReset = () => {
    setDraft({})
  }

  const handleApply = () => {
    onApply(draft)
    onClose()
  }

  const activeCount = [
    draft.listing_type,
    draft.category_id,
    draft.city,
    draft.min_price !== undefined,
    draft.max_price !== undefined,
  ].filter(Boolean).length

  // Keep draft in sync when sheet re-opens
  if (open && JSON.stringify(draft) !== JSON.stringify(filters) && activeCount === 0 && Object.keys(filters).length > 0) {
    handleOpen()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl flex flex-col transition-transform duration-300 ease-out max-h-[90dvh] ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-outline-variant shrink-0">
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface text-xl">close</span>
          </button>
          <span className="font-label font-semibold text-on-surface text-base">Filtros</span>
          <button
            onClick={handleReset}
            className="font-label text-sm text-primary px-2 py-1 rounded-xl hover:bg-primary/10 transition-colors"
          >
            Limpiar
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
          {/* Section 1: Tipo de publicación */}
          <div className="flex flex-col gap-3">
            <span className="font-label font-semibold text-on-surface text-sm">Tipo de publicación</span>
            <div className="flex gap-2">
              {([undefined, 'sell', 'rent'] as (ListingType | undefined)[]).map((type) => {
                const label = type === undefined ? 'Todos' : type === 'sell' ? 'Venta' : 'Alquiler'
                const isSelected = draft.listing_type === type
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, listing_type: type }))}
                    className={`flex-1 py-2 rounded-2xl border font-label text-sm font-medium transition-[border-color,background-color,color] ${
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

          {/* Section 2: Categoría */}
          <div className="flex flex-col gap-3">
            <span className="font-label font-semibold text-on-surface text-sm">Categoría</span>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, category_id: undefined }))}
                className={`shrink-0 rounded-full px-4 py-1.5 border font-label text-sm transition-[border-color,background-color,color] ${
                  !draft.category_id
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant'
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, category_id: cat.id }))}
                  className={`shrink-0 rounded-full px-4 py-1.5 border font-label text-sm transition-[border-color,background-color,color] ${
                    draft.category_id === cat.id
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container text-on-surface-variant border-outline-variant'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Ciudad */}
          <div className="flex flex-col gap-3">
            <span className="font-label font-semibold text-on-surface text-sm">Ciudad</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, city: undefined }))}
                className={`rounded-full px-4 py-1.5 border font-label text-sm transition-[border-color,background-color,color] ${
                  !draft.city
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant'
                }`}
              >
                Todas
              </button>
              {BOLIVIAN_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, city }))}
                  className={`rounded-full px-4 py-1.5 border font-label text-sm transition-[border-color,background-color,color] ${
                    draft.city === city
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container text-on-surface-variant border-outline-variant'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Precio */}
          <div className="flex flex-col gap-3">
            <span className="font-label font-semibold text-on-surface text-sm">Precio</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label text-xs text-on-surface-variant">Mínimo Bs.</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={draft.min_price ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      min_price: e.target.value !== '' ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label text-xs text-on-surface-variant">Máximo Bs.</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Sin límite"
                  value={draft.max_price ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      max_price: e.target.value !== '' ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="bg-surface-container rounded-2xl px-4 py-2.5 font-body text-sm text-on-surface outline-none border-none"
                />
              </div>
            </div>
          </div>

          {/* Bottom padding for footer */}
          <div className="h-2" />
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-outline-variant shrink-0">
          <button
            type="button"
            onClick={handleApply}
            className="w-full bg-primary text-on-primary font-label font-semibold rounded-2xl py-4 transition-opacity active:opacity-80"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCrearLicitacion, type LicitacionType, type LicitacionIntent } from '../hooks/useLicitaciones'
import { BOLIVIAN_CITIES } from '../../auth/constants/authConstants'
import { supabase } from '../../../lib/supabaseClient'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

const SPECIALTIES = [
  'Albañilería',
  'Electricidad',
  'Plomería',
  'Carpintería',
  'Pintura',
  'Gasfitería',
  'Soldadura',
  'Otro',
]

// Fallback si la consulta a `categories` falla — coincide con los nombres seedeados.
const FALLBACK_CATEGORIES = [
  'Acero y fierro', 'Cemento y hormigón', 'Eléctrico', 'Equipos', 'Herramientas',
  'Madera', 'Materiales', 'Pintura', 'Plomería', 'Seguridad',
]

const TYPE_OPTIONS: { value: LicitacionType; label: string }[] = [
  { value: 'labor', label: 'Mano de obra' },
  { value: 'material', label: 'Material' },
  { value: 'equipment', label: 'Equipo / Maquinaria' },
]

export function NuevaLicitacionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { mutate: crearLicitacion, isPending } = useCrearLicitacion()
  const { toasts, showToast, removeToast } = useToast()

  // Categorías reales de la tienda (categories.name). Deben coincidir con la categoría
  // de los productos para que broadcast_licitacion encuentre a los proveedores correctos.
  const { data: fetchedCategories = [] } = useQuery<string[]>({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('name').order('name')
      if (error) throw error
      return (data ?? []).map((c: { name: string }) => c.name)
    },
    staleTime: 5 * 60_000,
  })
  const itemCategories = fetchedCategories.length ? fetchedCategories : FALLBACK_CATEGORIES

  const [type, setType] = useState<LicitacionType>('labor')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [intent, setIntent] = useState<LicitacionIntent>('buy')
  const [city, setCity] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')

  const isItem = type === 'material' || type === 'equipment'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      showToast('El título es obligatorio', 'error')
      return
    }
    if (isItem && !itemCategory) {
      showToast('Elige la categoría del material o equipo', 'error')
      return
    }
    crearLicitacion(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        specialty: !isItem ? (specialty || undefined) : undefined,
        city: city || undefined,
        budget_min: budgetMin ? parseFloat(budgetMin) : undefined,
        budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
        type,
        item_category: isItem ? itemCategory : undefined,
        intent: isItem ? intent : undefined,
      },
      {
        onSuccess: () => {
          showToast(
            isItem
              ? 'Solicitud enviada a los proveedores de esa categoría'
              : 'Licitación publicada correctamente',
            'success'
          )
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 900)
        },
        onError: () => {
          showToast('Error al publicar la licitación', 'error')
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-surface rounded-t-2xl border-t border-outline-variant px-4 pt-4 pb-8 flex flex-col gap-4 animate-[fadeSlideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <Toast toasts={toasts} onRemove={removeToast} />
        {/* Handle */}
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-title text-lg text-on-surface">Nueva solicitud</h2>
          <button onClick={onClose} className="text-on-surface-variant p-1" aria-label="Cerrar">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Tipo de solicitud */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-xs text-on-surface-variant">¿Qué necesitas?</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const active = type === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`rounded-xl px-2 py-2.5 text-xs font-label font-semibold border transition-colors ${
                      active
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-surface-container border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Título */}
          <div className="flex flex-col gap-1">
            <label className="font-label text-xs text-on-surface-variant">
              {isItem ? 'Título de la solicitud *' : 'Título del trabajo *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isItem ? 'Ej: Necesito una grúa de 50 ton' : 'Ej: Construcción de losa en 2do piso'}
              className="bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none"
            />
          </div>

          {/* Categoría + intención (solo material/equipo) */}
          {isItem && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label text-xs text-on-surface-variant">Categoría *</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="bg-surface-container rounded-xl px-3 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none appearance-none"
                >
                  <option value="">Elegir...</option>
                  {itemCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label text-xs text-on-surface-variant">Quiero</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['buy', 'Comprar'], ['rent', 'Alquilar']] as const).map(([val, lbl]) => {
                    const active = intent === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setIntent(val)}
                        className={`rounded-xl py-3 text-xs font-label font-semibold border transition-colors ${
                          active
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-surface-container border-outline-variant text-on-surface-variant'
                        }`}
                      >
                        {lbl}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div className="flex flex-col gap-1">
            <label className="font-label text-xs text-on-surface-variant">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla el trabajo a realizar..."
              rows={3}
              className="bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Especialidad (mano de obra) y Ciudad */}
          <div className={isItem ? 'flex flex-col gap-1' : 'grid grid-cols-2 gap-3'}>
            {!isItem && (
              <div className="flex flex-col gap-1">
                <label className="font-label text-xs text-on-surface-variant">Especialidad</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="bg-surface-container rounded-xl px-3 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none appearance-none"
                >
                  <option value="">Cualquiera</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="font-label text-xs text-on-surface-variant">Ciudad</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-surface-container rounded-xl px-3 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none appearance-none"
              >
                <option value="">Todas</option>
                {BOLIVIAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Presupuesto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label text-xs text-on-surface-variant">Presupuesto mín. (Bs.)</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="0"
                min={0}
                className="bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label text-xs text-on-surface-variant">Presupuesto máx. (Bs.)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="0"
                min={0}
                className="bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-on-primary rounded-2xl py-3 text-sm font-label font-semibold disabled:opacity-50 transition-opacity active:opacity-80 mt-1"
          >
            {isPending ? 'Publicando...' : isItem ? 'Enviar solicitud a proveedores' : 'Publicar licitación'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useCrearLicitacion } from '../hooks/useLicitaciones'
import { BOLIVIAN_CITIES } from '../../auth/constants/authConstants'
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

export function NuevaLicitacionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { mutate: crearLicitacion, isPending } = useCrearLicitacion()
  const { toasts, showToast, removeToast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [city, setCity] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      showToast('El título es obligatorio', 'error')
      return
    }
    crearLicitacion(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        specialty: specialty || undefined,
        city: city || undefined,
        budget_min: budgetMin ? parseFloat(budgetMin) : undefined,
        budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
      },
      {
        onSuccess: () => {
          showToast('Licitación publicada correctamente', 'success')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 800)
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
          <h2 className="font-title text-lg text-on-surface">Nueva licitación</h2>
          <button onClick={onClose} className="text-on-surface-variant p-1">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Título */}
          <div className="flex flex-col gap-1">
            <label className="font-label text-xs text-on-surface-variant">Título del trabajo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Construcción de losa en 2do piso"
              className="bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none"
            />
          </div>

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

          {/* Especialidad y Ciudad */}
          <div className="grid grid-cols-2 gap-3">
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
            {isPending ? 'Publicando...' : 'Publicar licitación'}
          </button>
        </form>
      </div>
    </div>
  )
}

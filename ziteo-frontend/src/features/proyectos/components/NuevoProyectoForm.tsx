import { useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import type { ProjectStatus } from '../types/proyectosTypes'
import { ImagePicker } from '../../../shared/components/ImagePicker'
import { MapPicker } from '../../../shared/components/MapPicker'
import { useCreateProyecto } from '../hooks/useProyectos'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

interface NuevoProyectoFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface FormState {
  name: string
  description: string
  location_address: string
  location_lat: number | null
  location_lng: number | null
  city: string
  estimated_budget: string
  needs_maestro: boolean
  needs_materials: boolean
  photo_url: string
}

interface FormErrors {
  name?: string
}

export function NuevoProyectoForm({ onSuccess, onCancel }: NuevoProyectoFormProps) {
  const constructor_id = useAuthStore((s) => s.user?.user_id ?? '')
  const { mutate: createProyecto, isPending } = useCreateProyecto()
  const { toasts, showToast, removeToast } = useToast()
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    location_address: '',
    location_lat: null,
    location_lng: null,
    city: '',
    estimated_budget: '',
    needs_maestro: false,
    needs_materials: false,
    photo_url: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const set = (field: keyof FormState, value: string | boolean | number | null) =>
    setForm((f) => ({ ...f, [field]: value }))

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (form.name.trim().length < 3) e.name = 'El nombre debe tener al menos 3 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    createProyecto(
      {
        constructor_id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        location_address: form.location_address.trim() || null,
        location_lat: form.location_lat,
        location_lng: form.location_lng,
        city: form.city.trim() || null,
        estimated_budget: form.estimated_budget ? Number(form.estimated_budget) : null,
        status: 'planning' as ProjectStatus,
        photo_url: form.photo_url || null,
        start_date: null,
        needs_maestro: form.needs_maestro,
        needs_materials: form.needs_materials,
      },
      {
        onSuccess: () => {
          showToast('Proyecto creado con éxito', 'success')
          setTimeout(onSuccess, 800)
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Error al crear el proyecto'
          showToast(msg, 'error')
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="flex items-center gap-3 px-4 h-14 border-b border-outline-variant">
        <button onClick={onCancel} className="text-on-surface-variant">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline font-extrabold text-lg text-on-surface">Nuevo proyecto</h1>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4 pb-8">
        {/* Nombre del proyecto */}
        <div>
          <label htmlFor="proyecto-name" className="font-label text-sm text-on-surface-variant block mb-1">
            Nombre del proyecto
          </label>
          <input
            id="proyecto-name"
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej: Casa de dos pisos en zona norte"
            className="w-full border border-outline-variant rounded-2xl px-4 py-3 font-body text-on-surface bg-surface-container-low outline-none focus:border-primary text-sm"
          />
          {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Foto del proyecto (opcional) */}
        <div>
          <label className="font-label text-sm text-on-surface-variant block mb-1">
            Foto del proyecto <span className="text-xs opacity-70">(Opcional)</span>
          </label>
          <ImagePicker 
            shape="square" 
            bucket="project-photos" 
            folder={constructor_id} 
            value={form.photo_url} 
            onChange={(url) => set('photo_url', url)} 
          />
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="proyecto-description" className="font-label text-sm text-on-surface-variant block mb-1">
            Descripción
          </label>
          <textarea
            id="proyecto-description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Describe el alcance del proyecto..."
            className="w-full border border-outline-variant rounded-2xl px-4 py-3 font-body text-on-surface bg-surface-container-low outline-none focus:border-primary text-sm resize-none"
          />
        </div>

        {/* Ciudad */}
        <div>
          <label htmlFor="proyecto-city" className="font-label text-sm text-on-surface-variant block mb-1">
            Ciudad
          </label>
          <input
            id="proyecto-city"
            type="text"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Ej: Sucre"
            className="w-full border border-outline-variant rounded-2xl px-4 py-3 font-body text-on-surface bg-surface-container-low outline-none focus:border-primary text-sm"
          />
        </div>

        {/* Ubicación / Dirección — mapa (GPS o pin) con fallback a texto sin API key */}
        <div>
          <label className="font-label text-sm text-on-surface-variant block mb-1">
            Ubicación del proyecto
          </label>
          <MapPicker
            value={
              form.location_address || form.location_lat != null
                ? {
                    lat: form.location_lat ?? 0,
                    lng: form.location_lng ?? 0,
                    address: form.location_address,
                  }
                : null
            }
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                location_address: v.address,
                location_lat: v.lat || null,
                location_lng: v.lng || null,
              }))
            }
            placeholder="Ej: Calle Junín #123"
            height={240}
          />
        </div>

        {/* Presupuesto estimado */}
        <div>
          <label htmlFor="proyecto-budget" className="font-label text-sm text-on-surface-variant block mb-1">
            Presupuesto estimado (Bs.)
          </label>
          <div className="flex items-center border border-outline-variant rounded-2xl overflow-hidden">
            <span className="px-2 text-on-surface-variant text-sm font-label bg-surface-container border-r border-outline-variant py-2">
              Bs
            </span>
            <input
              id="proyecto-budget"
              type="number"
              value={form.estimated_budget}
              onChange={(e) => set('estimated_budget', e.target.value)}
              placeholder="0"
              className="flex-1 px-2 py-2 font-body text-on-surface bg-surface-container-low outline-none text-sm"
            />
          </div>
        </div>

        {/* Necesidades */}
        <div className="flex flex-col gap-3">
          {([
            { field: 'needs_maestro' as const, label: 'Necesita maestro de obra', icon: 'engineering' },
            { field: 'needs_materials' as const, label: 'Necesita materiales', icon: 'inventory_2' },
          ]).map(({ field, label, icon }) => (
            <button
              key={field}
              role="switch"
              aria-checked={form[field]}
              onClick={() => set(field, !form[field])}
              className="flex items-center justify-between px-4 py-3.5 bg-surface-container-low rounded-2xl border border-outline-variant"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
                <span className="font-label text-sm text-on-surface">{label}</span>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${form[field] ? 'bg-primary' : 'bg-surface-container border border-outline-variant'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form[field] ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full px-4 py-4 bg-primary text-on-primary font-label font-semibold rounded-2xl disabled:opacity-60 transition-opacity"
        >
          {isPending ? 'Publicando...' : 'Publicar proyecto'}
        </button>
      </div>
    </div>
  )
}

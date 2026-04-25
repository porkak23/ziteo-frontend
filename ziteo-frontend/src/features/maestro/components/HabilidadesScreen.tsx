import { useRef, useState } from 'react'
import { useHabilidades, useUpsertHabilidad, useDeleteHabilidad, SKILLS_DISPONIBLES } from '../hooks/useHabilidades'
import { useAuthStore } from '../../auth/store/authStore'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

function SkeletonBar() {
  return (
    <div className="bg-surface-container rounded-2xl p-4 animate-pulse">
      <div className="h-4 bg-surface rounded w-1/3 mb-3" />
      <div className="h-3 bg-surface rounded w-full mb-1" />
      <div className="h-2 bg-surface rounded w-full" />
    </div>
  )
}

export function HabilidadesScreen({ maestroId }: { maestroId?: string }) {
  const user = useAuthStore((s) => s.user)
  const effectiveMaestroId = maestroId ?? user?.user_id ?? ''
  const isOwn = !maestroId || maestroId === user?.user_id

  const { data: habilidades = [], isLoading, isError } = useHabilidades(effectiveMaestroId)
  const upsert = useUpsertHabilidad()
  const deleteMut = useDeleteHabilidad()
  const { toasts, showToast, removeToast } = useToast()

  const [showSheet, setShowSheet] = useState(false)
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const skillsDisponibles = SKILLS_DISPONIBLES.filter(
    (s) => !habilidades.some((h) => h.skill === s)
  )

  async function handleAddSkill(skill: string) {
    setShowSheet(false)
    try {
      await upsert.mutateAsync({ maestro_id: effectiveMaestroId, skill, porcentaje: 50 })
      showToast('Habilidad agregada', 'success')
    } catch {
      showToast('Error al agregar habilidad', 'error')
    }
  }

  function handleSliderChange(skill: string, porcentaje: number) {
    if (debounceRefs.current[skill]) clearTimeout(debounceRefs.current[skill])
    debounceRefs.current[skill] = setTimeout(async () => {
      try {
        await upsert.mutateAsync({ maestro_id: effectiveMaestroId, skill, porcentaje })
      } catch {
        showToast('Error al actualizar', 'error')
      }
    }, 500)
  }

  async function handleDelete(id: string) {
    try {
      await deleteMut.mutateAsync({ id, maestro_id: effectiveMaestroId })
      showToast('Habilidad eliminada', 'success')
    } catch {
      showToast('Error al eliminar', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-on-surface">
          {isOwn ? 'Mis habilidades' : 'Habilidades'}
        </h1>
        {isOwn && (
          <button
            onClick={() => setShowSheet(true)}
            className="flex items-center gap-1 bg-primary text-on-primary text-sm font-semibold px-3 py-2 rounded-xl"
          >
            <span className="text-lg leading-none">+</span> Agregar
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <SkeletonBar />
          <SkeletonBar />
          <SkeletonBar />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 mt-12 text-center">
          <span className="material-symbols-outlined text-4xl text-error opacity-60">error</span>
          <p className="text-on-surface-variant text-sm">
            No se pudieron cargar las habilidades.{'\n'}Asegúrate de que la tabla existe en Supabase.
          </p>
        </div>
      )}

      {!isLoading && !isError && habilidades.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">construction</span>
          <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">
            {isOwn ? 'Aún no tienes habilidades' : 'Sin habilidades registradas'}
          </p>
          <p className="font-body text-sm text-on-surface-variant/50 text-center">
            {isOwn ? 'Agrega tus especialidades para aparecer en más búsquedas' : 'Este maestro no ha registrado habilidades aún'}
          </p>
          {isOwn && (
            <button
              onClick={() => setShowSheet(true)}
              className="mt-1 bg-primary text-on-primary font-label font-semibold text-sm px-6 py-3 rounded-2xl transition-opacity active:opacity-80"
            >
              Agregar habilidad
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && habilidades.length > 0 && (
        <div className="flex flex-col gap-3">
          {habilidades.map((h) => (
            <div key={h.id} className="bg-surface-container rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface text-sm">{h.skill}</span>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold text-sm">{h.porcentaje}%</span>
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="text-error p-1 rounded-lg hover:bg-error/10 transition-colors"
                      aria-label="Eliminar habilidad"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative w-full h-2.5 rounded-full bg-surface overflow-hidden">
                <div
                  className="absolute inset-0 bg-primary rounded-full origin-left transition-transform duration-300"
                  style={{ transform: `scaleX(${h.porcentaje / 100})` }}
                />
              </div>

              {/* Slider (solo modo propio) */}
              {isOwn && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  defaultValue={h.porcentaje}
                  onChange={(e) => handleSliderChange(h.skill, Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom sheet para agregar habilidad */}
      {showSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSheet(false) }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSheet(false)} />
          <div className="relative bg-surface rounded-t-3xl p-4 max-h-[70vh] flex flex-col z-10">
            <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4" />
            <h2 className="text-base font-bold text-on-surface mb-3">Selecciona una habilidad</h2>
            {skillsDisponibles.length === 0 ? (
              <p className="text-on-surface-variant text-sm text-center py-6">
                Ya tienes todas las habilidades disponibles
              </p>
            ) : (
              <ul className="overflow-y-auto flex flex-col gap-1">
                {skillsDisponibles.map((skill) => (
                  <li key={skill}>
                    <button
                      onClick={() => handleAddSkill(skill)}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-surface-container text-on-surface text-sm font-medium transition-colors"
                    >
                      {skill}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

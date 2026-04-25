import { useState } from 'react'
import { useTrabajos, usePostularseAProyecto } from '../hooks/useTrabajos'
import { usePendingContracts } from '../hooks/useContracts'
import { ContractCard } from './ContractCard'
import { EarningsPanel } from './EarningsPanel'
import { BOLIVIAN_CITIES } from '../../auth/constants/authConstants'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { useAuthStore } from '../../auth/store/authStore'
import { LicitacionFeed } from '../../licitaciones/components/LicitacionFeed'
import { AdBanner } from '../../../shared/components/AdBanner'

type WorkTab = 'licitaciones' | 'proyectos'

export function TrabajosScreen() {
  const [activeWorkTab, setActiveWorkTab] = useState<WorkTab>('licitaciones')
  const [location, setLocation] = useState<string>('')
  const user = useAuthStore((s) => s.user)
  const { data: proyectos = [], isLoading } = useTrabajos(location ? { location } : undefined)
  const { data: pendingContracts = [], isLoading: isLoadingPending } = usePendingContracts(user?.user_id ?? '')
  const { mutate: postularse, isPending } = usePostularseAProyecto()
  const { toasts, showToast, removeToast } = useToast()

  const handlePostularse = (project_id: string) => {
    if (!user?.user_id) return
    postularse(
      { project_id, applicant_id: user.user_id },
      {
        onSuccess: () => {
          showToast('Postulación enviada correctamente', 'success')
        },
        onError: () => {
          showToast('Ocurrió un error al postularse', 'error')
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      <Toast toasts={toasts} onRemove={removeToast} />

      <AdBanner variant="banner" className="mx-4 mb-3" />

      {/* Tabs */}
      <div className="flex gap-1 px-4">
        <button
          onClick={() => setActiveWorkTab('licitaciones')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-label font-semibold transition-colors ${
            activeWorkTab === 'licitaciones'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          Licitaciones
        </button>
        <button
          onClick={() => setActiveWorkTab('proyectos')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-label font-semibold transition-colors ${
            activeWorkTab === 'proyectos'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          Proyectos
        </button>
      </div>

      {activeWorkTab === 'licitaciones' && <LicitacionFeed />}

      {activeWorkTab === 'proyectos' && (
      <>
      <div className="px-4">
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant focus:border-primary outline-none appearance-none"
        >
          <option value="">Todas las ciudades</option>
          {BOLIVIAN_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3 px-4">
        
        {user?.active_role === 'maestro' && user?.user_id && (
          <EarningsPanel maestroId={user.user_id} />
        )}

        {/* Seccion de solicitudes pendientes */}
        <div className="flex items-center gap-2 mb-2 mt-2">
          <h2 className="font-headline font-bold text-[18px] text-on-surface tracking-[-0.02em]">Solicitudes pendientes</h2>
          {pendingContracts.length > 0 && (
            <div className="bg-primary text-on-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {pendingContracts.length}
            </div>
          )}
        </div>
        
        {isLoadingPending ? (
          <>
            <div className="bg-surface-container animate-pulse rounded-2xl h-24 mb-4" />
            <div className="bg-surface-container animate-pulse rounded-2xl h-24 mb-4" />
          </>
        ) : pendingContracts.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant/50 mb-4">Ningún constructor te ha enviado una solicitud todavía</p>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {pendingContracts.map((contract) => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                onShowToast={showToast} 
              />
            ))}
          </div>
        )}

        <h2 className="font-headline font-bold text-[18px] text-on-surface tracking-[-0.02em] mt-2 mb-1">Trabajos disponibles</h2>

        {isLoading ? (
          <>
            <div className="bg-surface-container animate-pulse rounded-2xl h-[96px]" />
            <div className="bg-surface-container animate-pulse rounded-2xl h-[96px]" />
            <div className="bg-surface-container animate-pulse rounded-2xl h-[96px]" />
          </>
        ) : proyectos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">work_off</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">Sin trabajos por ahora</p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">Prueba en otra ciudad o vuelve más tarde cuando haya nuevos proyectos</p>
          </div>
        ) : (
          proyectos.map((proyecto) => (
            <div key={proyecto.id} className="bg-surface rounded-2xl p-4 flex flex-col gap-3 border border-outline-variant">
              <div className="flex items-center justify-between gap-2 border-b border-outline-variant pb-2">
                <div className="flex flex-col">
                  <h3 className="font-title text-base text-on-surface line-clamp-1">{proyecto.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span className="font-body text-xs line-clamp-1">{proyecto.location_address || 'Sin ubicación'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label text-primary font-semibold">
                    {proyecto.estimated_budget ? `Bs. ${proyecto.estimated_budget.toLocaleString('es-BO')}` : 'A convenir'}
                  </span>
                  <span className="font-body text-[10px] text-on-surface-variant mt-1">
                    {new Date(proyecto.created_at).toLocaleDateString('es-BO')}
                  </span>
                </div>
              </div>

              {proyecto.description && (
                <p className="font-body text-sm text-on-surface-variant line-clamp-2">
                  {proyecto.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                <span className="font-body text-xs text-on-surface text-opacity-80">
                  {proyecto.constructor?.name ?? 'Constructor'}
                </span>
              </div>

              <div className="pt-1">
                <button
                  disabled={isPending}
                  onClick={() => handlePostularse(proyecto.id)}
                  className="w-full bg-primary text-on-primary rounded-2xl py-3 text-sm font-label font-semibold disabled:opacity-50 transition-opacity active:opacity-80"
                >
                  Postularme
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      </>
      )}
    </div>
  )
}

// ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

// CREATE TABLE IF NOT EXISTS contracts (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   project_id uuid NOT NULL,
//   constructor_id uuid NOT NULL,
//   maestro_id uuid NOT NULL,
//   status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','rejected')),
//   budget numeric,
//   description text,
//   created_at timestamp NOT NULL DEFAULT now()
// );

import { useState, useRef, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../auth/store/authStore'
import { useApplyToProject } from '../hooks/useProjectDetail'
import { ProjectStatusChip } from './ProjectStatusChip'
import type { ProjectCard, ProjectStatus } from '../types/proyectosTypes'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { supabase } from '../../../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'

interface ProjectDetailScreenProps {
  project: ProjectCard
  onBack: () => void
}

// ── Contract types ─────────────────────────────────────────────────────────────

interface Contract {
  id: string
  project_id: string
  maestro_id: string
  status: 'pending' | 'active' | 'completed' | 'rejected'
  budget: number | null
  description: string | null
}

interface ContractWithMaestro extends Contract {
  maestro_name: string
}

// ── Chip color map for contract status ────────────────────────────────────────

const CONTRACT_STATUS_STYLES: Record<
  Contract['status'],
  { bg: string; text: string; label: string }
> = {
  pending:   { bg: 'bg-surface-container', text: 'text-on-surface-variant', label: 'Pendiente' },
  active:    { bg: 'bg-primary',           text: 'text-on-primary',          label: 'Activo'    },
  completed: { bg: 'bg-surface-container', text: 'text-on-surface',          label: 'Completado'},
  rejected:  { bg: 'bg-error-container',   text: 'text-on-error-container',  label: 'Rechazado' },
}

// ── Project status options for the "Cambiar estado" menu ──────────────────────

const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning',  label: 'Planificación' },
  { value: 'active',    label: 'Activo'         },
  { value: 'paused',    label: 'Pausado'        },
  { value: 'completed', label: 'Completado'     },
]

// ── Hook: active contracts for a project ─────────────────────────────────────

function useActiveContracts(projectId: string) {
  return useQuery<ContractWithMaestro[]>({
    queryKey: ['contracts', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, project_id, maestro_id, status, budget, description')
        .eq('project_id', projectId)
        .eq('status', 'active')

      if (error) throw error
      if (!contracts || contracts.length === 0) return []

      const maestroIds = contracts.map((c: Contract) => c.maestro_id)

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', maestroIds)

      if (profilesError) throw profilesError

      const nameMap: Record<string, string> = {}
      ;(profiles ?? []).forEach((p: { user_id: string; name: string }) => {
        nameMap[p.user_id] = p.name
      })

      return (contracts as Contract[]).map((c) => ({
        ...c,
        maestro_name: nameMap[c.maestro_id] ?? 'Maestro desconocido',
      }))
    },
  })
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProjectDetailScreen({ project, onBack }: ProjectDetailScreenProps) {
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  const user = useAuthStore((s) => s.user)
  const active_role = user?.active_role
  const user_id = user?.user_id ?? ''

  const queryClient = useQueryClient()
  const { mutate: apply, isPending } = useApplyToProject(project.id)

  // ── Progress state ──────────────────────────────────────────────────────────

  const [localProgress, setLocalProgress] = useState<number>(
    (project as ProjectCard & { progress?: number }).progress ?? 0
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOwnerConstructor =
    active_role === 'constructor' && project.constructor_id === user_id

  const handleProgressChange = useCallback(
    (value: number) => {
      setLocalProgress(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        await supabase
          .from('projects')
          .update({ progress: value })
          .eq('id', project.id)
        queryClient.invalidateQueries({ queryKey: ['proyectos'] })
        queryClient.invalidateQueries({ queryKey: ['proyecto', project.id] })
      }, 500)
    },
    [project.id, queryClient]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // ── Status change menu ──────────────────────────────────────────────────────

  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false)
      }
    }
    if (showStatusMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showStatusMenu])

  async function handleStatusChange(newStatus: ProjectStatus) {
    setShowStatusMenu(false)
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', project.id)

    if (error) {
      showToast('Error al cambiar el estado', 'error')
      return
    }

    queryClient.invalidateQueries({ queryKey: ['proyectos'] })
    queryClient.invalidateQueries({ queryKey: ['proyecto', project.id] })
    showToast('Estado actualizado', 'success')
  }

  // ── Contracts ───────────────────────────────────────────────────────────────

  const { data: contracts, isLoading: contractsLoading } = useActiveContracts(project.id)

  // ── Apply logic ─────────────────────────────────────────────────────────────

  const canApply =
    (active_role === 'maestro' && project.needs_maestro) ||
    (active_role === 'proveedor' && project.needs_materials)

  function handleApply() {
    if (!message.trim() || active_role === 'constructor' || active_role === 'chofer') return

    setApplyError(null)
    apply(
      {
        project_id: project.id,
        applicant_id: user_id,
        role: active_role as 'maestro' | 'proveedor',
        message: message.trim(),
      },
      {
        onSuccess: () => {
          setSubmitted(true)
          setMessage('')
          showToast('Postulación enviada', 'success')
        },
        onError: (err) => {
          const errorMessage = err instanceof Error ? err.message : 'Error al enviar postulación'
          setApplyError(errorMessage)
          showToast(errorMessage, 'error')
        },
      }
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-outline-variant bg-surface flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-11 h-11 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <h2 className="font-label font-semibold text-on-surface text-sm truncate flex-1">
          {project.name}
        </h2>

        {/* Cambiar estado — solo constructor propietario */}
        {isOwnerConstructor && (
          <div className="relative" ref={statusMenuRef}>
            <button
              type="button"
              onClick={() => setShowStatusMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-2xl border border-outline-variant px-3 py-1.5 text-xs font-label text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm leading-none">edit_note</span>
              Estado
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 top-10 z-20 bg-surface border border-outline-variant rounded-2xl shadow-lg overflow-hidden min-w-36">
                {PROJECT_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusChange(opt.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-label transition-colors hover:bg-surface-container ${
                      project.status === opt.value
                        ? 'text-primary font-semibold'
                        : 'text-on-surface'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {/* Photo */}
        {project.photo_url && (
          <img
            src={project.photo_url}
            alt={project.name}
            className="w-full h-48 object-cover rounded-2xl"
          />
        )}

        {/* ── Progress bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">
            Progreso: {localProgress}%
          </span>

          {isOwnerConstructor ? (
            /* Slider interactivo — solo constructor propietario */
            <input
              type="range"
              min="0"
              max="100"
              value={localProgress}
              onChange={(e) => handleProgressChange(Number(e.target.value))}
              className="w-full accent-[var(--color-primary,#D94F00)] h-2 rounded-full cursor-pointer"
              aria-label="Progreso del proyecto"
            />
          ) : (
            /* Barra estática */
            <div className="relative w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="absolute inset-0 bg-primary rounded-full origin-left transition-transform duration-300"
                style={{ transform: `scaleX(${localProgress / 100})` }}
              />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <ProjectStatusChip status={project.status} />
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-base leading-none">construction</span>
            <span className="text-xs font-label">Proyecto</span>
          </div>
        </div>

        <h1 className="font-headline text-xl text-on-surface">{project.name}</h1>

        {project.description && (
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            {project.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {project.location_address && (
            <div className="flex items-start gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-base leading-tight">location_on</span>
              <span className="text-sm">{project.location_address}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base leading-tight">person</span>
            <span className="text-sm">{project.constructor_name}</span>
          </div>
          {project.estimated_budget != null && (
            <div className="flex items-start gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-base leading-tight">payments</span>
              <span className="text-sm">
                Presupuesto: Bs. {project.estimated_budget.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex items-start gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base leading-tight">groups</span>
            <span className="text-sm">{project.application_count} postulaciones</span>
          </div>
        </div>

        {(project.needs_maestro || project.needs_materials) && (
          <div className="flex flex-wrap gap-2">
            {project.needs_maestro && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-container text-on-tertiary-container px-3 py-1.5 text-xs font-label">
                <span className="material-symbols-outlined text-sm leading-none">engineering</span>
                Necesita Maestro
              </span>
            )}
            {project.needs_materials && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container text-on-secondary-container px-3 py-1.5 text-xs font-label">
                <span className="material-symbols-outlined text-sm leading-none">inventory_2</span>
                Necesita Materiales
              </span>
            )}
          </div>
        )}

        {/* ── Equipo del proyecto (contratos activos) ───────────────────────── */}
        <div className="flex flex-col gap-3">
          <span className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">
            Equipo del proyecto
          </span>

          {contractsLoading ? (
            /* Skeleton */
            <>
              <div className="bg-surface-container animate-pulse rounded-2xl h-16" />
              <div className="bg-surface-container animate-pulse rounded-2xl h-16" />
            </>
          ) : contracts && contracts.length > 0 ? (
            contracts.map((contract) => {
              const chip = CONTRACT_STATUS_STYLES[contract.status]
              return (
                <div
                  key={contract.id}
                  className="flex items-center gap-3 bg-surface-container rounded-2xl px-4 py-3"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-lg leading-none">person</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-label font-semibold text-on-surface text-sm truncate">
                      {contract.maestro_name}
                    </span>
                    {contract.description && (
                      <span className="text-xs text-on-surface-variant truncate">
                        {contract.description}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-label font-semibold ${chip.bg} ${chip.text} flex-shrink-0`}
                  >
                    {chip.label}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="flex items-center gap-3 text-on-surface-variant py-2">
              <span className="material-symbols-outlined text-2xl leading-none">group</span>
              <span className="font-body text-sm">Sin equipo asignado aún</span>
            </div>
          )}
        </div>

        {/* Apply section */}
        {canApply && (
          <div className="flex flex-col gap-3">
            <span className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">Postularme</span>

            {submitted ? (
              <div className="bg-primary-container text-on-primary-container rounded-2xl p-3 font-body text-sm">
                Postulación enviada
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe tu experiencia y por qué eres el indicado..."
                  className="min-h-24 bg-surface-container rounded-2xl p-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {applyError && (
                  <p className="text-xs text-on-error-container">{applyError}</p>
                )}
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isPending || !message.trim()}
                  className="w-full bg-primary text-on-primary rounded-2xl py-3 font-label font-semibold text-sm transition-opacity disabled:opacity-60"
                >
                  {isPending ? 'Enviando...' : 'Enviar postulación'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

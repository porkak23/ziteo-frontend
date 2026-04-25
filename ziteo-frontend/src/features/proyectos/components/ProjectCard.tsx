import type { ProjectCard as ProjectCardType } from '../types/proyectosTypes'
import { ProjectStatusChip } from './ProjectStatusChip'

interface ProjectCardProps {
  project: ProjectCardType
  onPress: (id: string) => void
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const formatBudget = (n: number) => n.toLocaleString('es-BO')

  return (
    <button
      onClick={() => onPress(project.id)}
      className="bg-surface rounded-2xl border border-outline-variant/50 text-left w-full flex flex-col overflow-hidden active:opacity-80 transition-opacity"
    >
      {/* Photo — full-width, leads the card */}
      <div className="relative w-full h-40 bg-surface-container shrink-0">
        {project.photo_url ? (
          <img
            src={project.photo_url}
            alt={project.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
            <span className="material-symbols-outlined text-4xl">construction</span>
          </div>
        )}
        {/* Status chip overlaid on photo, top-right */}
        <div className="absolute top-2 right-2">
          <ProjectStatusChip status={project.status} />
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-4">
        <p className="font-headline font-bold text-on-surface text-base line-clamp-2 leading-tight">
          {project.name}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          {project.location_address && (
            <div className="flex items-center gap-1 min-w-0">
              <span className="material-symbols-outlined text-xs text-on-surface-variant leading-none shrink-0">location_on</span>
              <span className="text-on-surface-variant text-xs truncate">{project.location_address}</span>
            </div>
          )}
          {project.estimated_budget != null && (
            <span className="text-primary font-label font-semibold text-sm shrink-0">
              Bs {formatBudget(project.estimated_budget)}
            </span>
          )}
        </div>

        {(project.needs_maestro || project.needs_materials || project.application_count > 0) && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {project.needs_maestro && (
                <span className="flex items-center gap-1 bg-surface-container rounded-full px-2 py-0.5 text-xs font-label text-on-surface-variant">
                  <span className="material-symbols-outlined text-xs leading-none">engineering</span>
                  Busca maestro
                </span>
              )}
              {project.needs_materials && (
                <span className="flex items-center gap-1 bg-surface-container rounded-full px-2 py-0.5 text-xs font-label text-on-surface-variant">
                  <span className="material-symbols-outlined text-xs leading-none">inventory_2</span>
                  Busca materiales
                </span>
              )}
            </div>
            {project.application_count > 0 && (
              <div className="flex items-center gap-1 text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined text-xs leading-none">groups</span>
                <span className="text-xs font-label">{project.application_count} interesados</span>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

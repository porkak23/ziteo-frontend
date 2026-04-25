import type { ProjectStatus } from '../types/proyectosTypes'

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  planning:  { label: 'Planificación', className: 'bg-surface-container text-on-surface-variant' },
  active:    { label: 'Activo',        className: 'bg-secondary-container text-on-secondary-container' },
  paused:    { label: 'Pausado',       className: 'bg-tertiary-container text-on-tertiary-container' },
  completed: { label: 'Completado',    className: 'bg-primary-container text-on-primary-container' },
}

interface ProjectStatusChipProps {
  status: ProjectStatus
}

export function ProjectStatusChip({ status }: ProjectStatusChipProps) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-label ${className}`}>
      {label}
    </span>
  )
}

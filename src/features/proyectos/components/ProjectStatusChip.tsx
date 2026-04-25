// src/features/proyectos/components/ProjectStatusChip.tsx

import React from 'react';
import type { ProjectStatus } from '../types/proyectosTypes';

interface ProjectStatusChipProps {
  status: ProjectStatus;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; classes: string }> = {
  borrador: {
    label: 'Borrador',
    classes: 'bg-surface-container text-on-surface-variant',
  },
  activo: {
    label: 'Activo',
    classes: 'bg-secondary-container text-on-secondary-container',
  },
  en_progreso: {
    label: 'En progreso',
    classes: 'bg-tertiary-container text-on-tertiary-container',
  },
  completado: {
    label: 'Completado',
    classes: 'bg-primary-container text-on-primary-container',
  },
  cancelado: {
    label: 'Cancelado',
    classes: 'bg-error-container text-on-error-container',
  },
};

export function ProjectStatusChip({ status }: ProjectStatusChipProps) {
  const { label, classes } = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-label ${classes}`}
    >
      {label}
    </span>
  );
}
